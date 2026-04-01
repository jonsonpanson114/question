// React Hook: usePushNotifications
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences } from '../api/push/_types';

interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  preferences: NotificationPreferences | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Check browser support
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setError('このブラウザはプッシュ通知をサポートしていません');
    }
  }, []);

  // Get current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load existing subscription and preferences
  useEffect(() => {
    if (!isSupported) return;

    const loadSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          setIsSubscribed(true);

          // Get subscription ID from endpoint
          // (In production, this would be stored in localStorage or fetched from server)
          const storedSubId = localStorage.getItem('push_subscription_id');
          if (storedSubId) {
            setSubscriptionId(storedSubId);
            await loadPreferences(storedSubId);
          }
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
      }
    };

    loadSubscription();
  }, [isSupported]);

  const loadPreferences = async (subId: string) => {
    try {
      const response = await fetch(`/api/push/preferences?subscriptionId=${subId}`);
      if (response.ok) {
        const prefs = await response.json();
        setPreferences(prefs);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('プッシュ通知はサポートされていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      setError('通知が拒否されています。ブラウザの設定から許可してください。');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        return true;
      } else {
        setError('通知が拒否されました');
        return false;
      }
    } catch (err) {
      setError('通知の許可を求める際にエラーが発生しました');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('プッシュ通知はサポートされていません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission if not granted
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        setError('VAPID公開鍵が設定されていません');
        setIsLoading(false);
        return;
      }

      // Convert VAPID key
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences: {
            morningEnabled: true,
            morningHour: 7,
            eveningEnabled: true,
            eveningHour: 21,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register subscription on server');
      }

      const data = await response.json();

      setIsSubscribed(true);
      setSubscriptionId(data.subscriptionId);
      setPreferences(data.preferences);

      // Store subscription ID for later use
      localStorage.setItem('push_subscription_id', data.subscriptionId);
    } catch (err) {
      console.error('Subscription error:', err);
      setError('通知の購読に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!subscriptionId) {
      setError('購読が見つかりません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe on server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      // Unsubscribe locally
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setPreferences(null);
      setSubscriptionId(null);
      localStorage.removeItem('push_subscription_id');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('購読の解除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!subscriptionId) {
      setError('購読が見つかりません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          preferences: prefs,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();

      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Update preferences error:', err);
      setError('設定の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  const sendTestNotification = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return;
    } catch (err) {
      console.error('Test notification error:', err);
      setError('テスト通知の送信に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  return {
    permission,
    isSubscribed,
    preferences,
    isSupported,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}


