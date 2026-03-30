import { sql } from "@vercel/postgres";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type PushSubscriptionRecord,
} from "./_types";

type SubscriptionRow = {
  id: string;
  endpoint: string;
  keys: string;
  is_active: boolean;
};

type PreferencesRow = {
  morning_enabled: boolean;
  morning_hour: number;
  evening_enabled: boolean;
  evening_hour: number;
  timezone: string;
};

export interface StoredSubscription {
  id: string;
  subscription: PushSubscriptionRecord;
  preferences: NotificationPreferences;
}

export async function ensurePushTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      keys TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true,
      last_used_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      subscription_id TEXT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      morning_enabled BOOLEAN DEFAULT true,
      morning_hour INTEGER DEFAULT 7,
      evening_enabled BOOLEAN DEFAULT true,
      evening_hour INTEGER DEFAULT 21,
      timezone TEXT DEFAULT 'Asia/Tokyo',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notification_history (
      id TEXT PRIMARY KEY,
      subscription_id TEXT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT NOW(),
      delivered BOOLEAN DEFAULT true,
      error_message TEXT
    );
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_subscription_unique ON notification_preferences(subscription_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notification_history_subscription ON notification_history(subscription_id);`;
}

function parsePreferences(row: PreferencesRow | undefined): NotificationPreferences {
  if (!row) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    morningEnabled: row.morning_enabled,
    morningHour: row.morning_hour,
    eveningEnabled: row.evening_enabled,
    eveningHour: row.evening_hour,
    timezone: row.timezone,
  };
}

function mergePreferences(input: Partial<NotificationPreferences> | undefined): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...input,
  };
}

export async function upsertSubscription(
  subscription: PushSubscriptionRecord,
  preferencesInput?: Partial<NotificationPreferences>,
): Promise<StoredSubscription> {
  const mergedPreferences = mergePreferences(preferencesInput);

  const existing = await sql<Pick<SubscriptionRow, "id">>`
    SELECT id
    FROM push_subscriptions
    WHERE endpoint = ${subscription.endpoint}
    LIMIT 1;
  `;

  const subscriptionId = existing.rows[0]?.id ?? crypto.randomUUID();

  if (existing.rows[0]) {
    await sql`
      UPDATE push_subscriptions
      SET keys = ${JSON.stringify(subscription.keys)},
          is_active = true,
          updated_at = NOW(),
          last_used_at = NOW()
      WHERE id = ${subscriptionId};
    `;
  } else {
    await sql`
      INSERT INTO push_subscriptions (id, endpoint, keys, is_active, last_used_at)
      VALUES (
        ${subscriptionId},
        ${subscription.endpoint},
        ${JSON.stringify(subscription.keys)},
        true,
        NOW()
      );
    `;
  }

  await sql`
    INSERT INTO notification_preferences (
      id,
      subscription_id,
      morning_enabled,
      morning_hour,
      evening_enabled,
      evening_hour,
      timezone,
      updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${subscriptionId},
      ${mergedPreferences.morningEnabled},
      ${mergedPreferences.morningHour},
      ${mergedPreferences.eveningEnabled},
      ${mergedPreferences.eveningHour},
      ${mergedPreferences.timezone},
      NOW()
    )
    ON CONFLICT (subscription_id)
    DO UPDATE SET
      morning_enabled = EXCLUDED.morning_enabled,
      morning_hour = EXCLUDED.morning_hour,
      evening_enabled = EXCLUDED.evening_enabled,
      evening_hour = EXCLUDED.evening_hour,
      timezone = EXCLUDED.timezone,
      updated_at = NOW();
  `;

  return {
    id: subscriptionId,
    subscription,
    preferences: mergedPreferences,
  };
}

export async function deactivateSubscription(subscriptionId: string): Promise<void> {
  await sql`
    UPDATE push_subscriptions
    SET is_active = false,
        updated_at = NOW()
    WHERE id = ${subscriptionId};
  `;
}

export async function getPreferences(subscriptionId: string): Promise<NotificationPreferences | null> {
  const result = await sql<PreferencesRow>`
    SELECT morning_enabled, morning_hour, evening_enabled, evening_hour, timezone
    FROM notification_preferences
    WHERE subscription_id = ${subscriptionId}
    LIMIT 1;
  `;

  if (!result.rows[0]) {
    return null;
  }

  return parsePreferences(result.rows[0]);
}

export async function updatePreferences(
  subscriptionId: string,
  preferencesInput: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = (await getPreferences(subscriptionId)) ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const merged = { ...current, ...preferencesInput };

  await sql`
    INSERT INTO notification_preferences (
      id,
      subscription_id,
      morning_enabled,
      morning_hour,
      evening_enabled,
      evening_hour,
      timezone,
      updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${subscriptionId},
      ${merged.morningEnabled},
      ${merged.morningHour},
      ${merged.eveningEnabled},
      ${merged.eveningHour},
      ${merged.timezone},
      NOW()
    )
    ON CONFLICT (subscription_id)
    DO UPDATE SET
      morning_enabled = EXCLUDED.morning_enabled,
      morning_hour = EXCLUDED.morning_hour,
      evening_enabled = EXCLUDED.evening_enabled,
      evening_hour = EXCLUDED.evening_hour,
      timezone = EXCLUDED.timezone,
      updated_at = NOW();
  `;

  return merged;
}

export async function getActiveSubscriptionById(subscriptionId: string): Promise<StoredSubscription | null> {
  const result = await sql<SubscriptionRow & Partial<PreferencesRow>>`
    SELECT
      s.id,
      s.endpoint,
      s.keys,
      s.is_active,
      p.morning_enabled,
      p.morning_hour,
      p.evening_enabled,
      p.evening_hour,
      p.timezone
    FROM push_subscriptions s
    LEFT JOIN notification_preferences p ON p.subscription_id = s.id
    WHERE s.id = ${subscriptionId}
      AND s.is_active = true
    LIMIT 1;
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const keys = JSON.parse(row.keys) as PushSubscriptionRecord["keys"];

  return {
    id: row.id,
    subscription: {
      id: row.id,
      endpoint: row.endpoint,
      keys,
    },
    preferences: parsePreferences(row as PreferencesRow),
  };
}

export async function listActiveSubscriptions(): Promise<StoredSubscription[]> {
  const result = await sql<SubscriptionRow & Partial<PreferencesRow>>`
    SELECT
      s.id,
      s.endpoint,
      s.keys,
      s.is_active,
      p.morning_enabled,
      p.morning_hour,
      p.evening_enabled,
      p.evening_hour,
      p.timezone
    FROM push_subscriptions s
    LEFT JOIN notification_preferences p ON p.subscription_id = s.id
    WHERE s.is_active = true;
  `;

  return result.rows.map((row) => ({
    id: row.id,
    subscription: {
      id: row.id,
      endpoint: row.endpoint,
      keys: JSON.parse(row.keys) as PushSubscriptionRecord["keys"],
    },
    preferences: parsePreferences(row as PreferencesRow),
  }));
}

export async function recordNotificationHistory(input: {
  subscriptionId: string;
  type: string;
  title: string;
  body: string;
  delivered: boolean;
  errorMessage?: string;
}): Promise<void> {
  await sql`
    INSERT INTO notification_history (
      id,
      subscription_id,
      type,
      title,
      body,
      delivered,
      error_message
    ) VALUES (
      ${crypto.randomUUID()},
      ${input.subscriptionId},
      ${input.type},
      ${input.title},
      ${input.body},
      ${input.delivered},
      ${input.errorMessage ?? null}
    );
  `;
}
