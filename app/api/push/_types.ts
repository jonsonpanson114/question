export interface NotificationPreferences {
  morningEnabled: boolean;
  morningHour: number;
  eveningEnabled: boolean;
  eveningHour: number;
  timezone: string;
}

export interface PushSubscriptionKeys {
  auth: string;
  p256dh: string;
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  morningEnabled: true,
  morningHour: 7,
  eveningEnabled: true,
  eveningHour: 21,
  timezone: "Asia/Tokyo",
};
