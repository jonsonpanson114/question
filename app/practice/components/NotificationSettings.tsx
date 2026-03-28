// Component: NotificationSettings
'use client';

import { useState } from 'react';
import { usePushNotifications } from '../../_hooks/usePushNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({
  isOpen,
  onClose,
}: NotificationSettingsProps) {
  const {
    permission,
    isSubscribed,
    preferences,
    isSupported,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();

  const [localPrefs, setLocalPrefs] = useState({
    morningEnabled: preferences?.morningEnabled ?? true,
    morningHour: preferences?.morningHour ?? 7,
    eveningEnabled: preferences?.eveningEnabled ?? true,
    eveningHour: preferences?.eveningHour ?? 21,
  });

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    if (confirm('本当に通知を停止しますか？')) {
      await unsubscribe();
      onClose();
    }
  };

  const handleSavePreferences = async () => {
    await updatePreferences(localPrefs);
    alert('設定を保存しました');
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    alert('テスト通知を送信しました');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--dojo-paper)] text-[var(--dojo-ink)] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--dojo-ink)] border-opacity-20">
          <h2 className="text-xl font-semibold">通知設定</h2>
          <button
            onClick={onClose}
            className="text-[var(--dojo-ink)] opacity-60 hover:opacity-100 transition-opacity"
            aria-label="閉じる"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Support check */}
          {!isSupported && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              このブラウザはプッシュ通知をサポートしていません。
            </div>
          )}

          {/* Permission status */}
          {isSupported && permission === 'denied' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              通知が拒否されています。ブラウザの設定から許可してください。
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Subscription status */}
          {isSupported && permission !== 'denied' && (
            <div className="space-y-4">
              {!isSubscribed ? (
                <div className="text-center py-6">
                  <p className="text-sm opacity-70 mb-4">
                    毎日の練習リマインダーを受け取りましょう
                  </p>
                  <button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="w-full bg-[var(--dojo-ink)] text-[var(--dojo-paper)] py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '処理中...' : '通知を開始する'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Morning settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-medium">朝のリマインダー</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPrefs.morningEnabled}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              morningEnabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {localPrefs.morningEnabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={localPrefs.morningHour}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              morningHour: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-3 py-2 border border-[var(--dojo-ink)] border-opacity-20 rounded-lg text-center"
                        />
                        <span className="text-sm opacity-70">時</span>
                      </div>
                    )}
                  </div>

                  {/* Evening settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-medium">夜のリマインダー</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPrefs.eveningEnabled}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              eveningEnabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {localPrefs.eveningEnabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={localPrefs.eveningHour}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              eveningHour: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-3 py-2 border border-[var(--dojo-ink)] border-opacity-20 rounded-lg text-center"
                        />
                        <span className="text-sm opacity-70">時</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-[var(--dojo-ink)] border-opacity-20">
                    <button
                      onClick={handleSavePreferences}
                      disabled={isLoading}
                      className="w-full bg-[var(--dojo-ink)] text-[var(--dojo-paper)] py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '保存中...' : '設定を保存'}
                    </button>
                    <button
                      onClick={handleTestNotification}
                      disabled={isLoading}
                      className="w-full border border-[var(--dojo-ink)] border-opacity-20 py-3 px-6 rounded-lg hover:bg-opacity-10 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      テスト通知を送信
                    </button>
                    <button
                      onClick={handleUnsubscribe}
                      disabled={isLoading}
                      className="w-full text-red-600 py-3 px-6 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      通知を停止する
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
