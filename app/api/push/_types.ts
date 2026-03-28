// Push Notification Type Definitions

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  subscriptionId: string;
  morningEnabled: boolean;
  morningHour: number; // 0-23
  eveningEnabled: boolean;
  eveningHour: number; // 0-23
  timezone: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    type?: 'morning' | 'evening';
  };
}

export interface SubscriptionRecord {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface NotificationPreferencesRecord {
  id: string;
  subscriptionId: string;
  morningEnabled: boolean;
  morningHour: number;
  eveningEnabled: boolean;
  eveningHour: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationHistoryRecord {
  id: string;
  subscriptionId: string;
  type: 'morning' | 'evening';
  title: string;
  body: string;
  sentAt: Date;
  delivered: boolean;
  errorMessage?: string;
}

// API Request/Response Types
export interface SubscribeRequest {
  subscription: PushSubscriptionJSON;
  preferences?: Partial<NotificationPreferences>;
}

export interface SubscribeResponse {
  success: boolean;
  subscriptionId: string;
  preferences?: NotificationPreferences;
}

export interface UnsubscribeRequest {
  subscriptionId: string;
}

export interface UpdatePreferencesRequest {
  subscriptionId: string;
  preferences: Partial<NotificationPreferences>;
}

export interface TestNotificationRequest {
  subscriptionId?: string; // Optional: test specific subscription or all active
}
