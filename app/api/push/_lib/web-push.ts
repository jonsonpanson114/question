// Web Push Configuration and Utilities
import webpush from 'web-push';
import type { PushSubscriptionJSON, NotificationPayload } from '../_types';

// Configure VAPID
if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    'mailto:contact@toi-no-dojo.example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('VAPID configured successfully');
} else {
  console.warn('VAPID keys not configured');
}

export interface SendNotificationOptions {
  subscription: PushSubscriptionJSON;
  payload: NotificationPayload;
  TTL?: number; // Time to live in seconds
}

export async function sendPushNotification({
  subscription,
  payload,
  TTL = 3600,
}: SendNotificationOptions): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL,
        urgency: 'normal',
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send push notification:', error);

    // Handle specific error cases
    if (error.statusCode === 410) {
      // Subscription has expired
      return {
        success: false,
        error: 'Subscription expired (410 Gone)',
      };
    } else if (error.statusCode === 404) {
      // Subscription not found
      return {
        success: false,
        error: 'Subscription not found (404)',
      };
    } else if (error.statusCode === 429) {
      // Rate limited
      return {
        success: false,
        error: 'Rate limited (429)',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

export function getMorningNotificationPayload(): NotificationPayload {
  const messages = [
    {
      title: 'おはようございます 🌅',
      body: '今日も問いと向き合う時間です。静かに、深く。',
    },
    {
      title: '良い朝を 🌄',
      body: '問いを紡ぐ、穏やかな時間を始めましょう。',
    },
    {
      title: '今日の問い ☀️',
      body: '新たな気づきを待っている問いがあります。',
    },
  ];

  const selected = messages[Math.floor(Math.random() * messages.length)];

  return {
    ...selected,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    data: {
      url: '/practice',
      type: 'morning',
    },
  };
}

export function getEveningNotificationPayload(): NotificationPayload {
  const messages = [
    {
      title: '今日の稽古、お疲れさまでした 🌙',
      body: '問いを振り返る時間を。今日の気づきは？',
    },
    {
      title: 'お疲れ様でした 🌆',
      body: '今日の気づきを、明日の問いに変えて。',
    },
    {
      title: '問いとの対話 ✨',
      body: '今日、出会った問いは何でしたか？',
    },
  ];

  const selected = messages[Math.floor(Math.random() * messages.length)];

  return {
    ...selected,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    data: {
      url: '/practice',
      type: 'evening',
    },
  };
}

export function getTestNotificationPayload(): NotificationPayload {
  return {
    title: 'テスト通知 🔔',
    body: 'プッシュ通知が正常に動作しています。',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    data: {
      url: '/practice',
      type: 'morning',
    },
  };
}
