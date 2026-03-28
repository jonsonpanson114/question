// Database Utilities for Push Notifications
import { neon } from '@neondatabase/serverless';
import type {
  PushSubscriptionJSON,
  SubscriptionRecord,
  NotificationPreferencesRecord,
  NotificationHistoryRecord,
} from '../_types';

// Initialize Neon database connection
let sql: ReturnType<typeof neon>;

try {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, using mock connection');
  } else {
    sql = neon(process.env.DATABASE_URL);
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

// Initialize database tables
export async function initializeDatabase(): Promise<boolean> {
  if (!sql) {
    console.warn('Database not configured, skipping initialization');
    return false;
  }

  try {
    // Create push_subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        keys TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP
      )
    `;

    // Create notification_preferences table
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
      )
    `;

    // Create notification_history table
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
      )
    `;

    // Create indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
      ON push_subscriptions(is_active)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_subscription
      ON notification_preferences(subscription_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notification_history_subscription
      ON notification_history(subscription_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at
      ON notification_history(sent_at)
    `;

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Subscription operations
export async function createSubscription(
  subscription: PushSubscriptionJSON
): Promise<string | null> {
  if (!sql) return null;

  try {
    const id = crypto.randomUUID();
    const keysJson = JSON.stringify(subscription.keys);

    await sql`
      INSERT INTO push_subscriptions (id, endpoint, keys)
      VALUES (${id}, ${subscription.endpoint}, ${keysJson})
    `;

    return id;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }
}

export async function getSubscriptionById(
  id: string
): Promise<SubscriptionRecord | null> {
  if (!sql) return null;

  try {
    const result = await sql`
      SELECT id, endpoint, keys, is_active, created_at, last_used_at
      FROM push_subscriptions
      WHERE id = ${id}
    `;

    if (result.length === 0) return null;

    const row = result[0] as any;
    return {
      id: row.id,
      endpoint: row.endpoint,
      keys: JSON.parse(row.keys),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    };
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

export async function updateSubscriptionLastUsed(id: string): Promise<void> {
  if (!sql) return;

  try {
    await sql`
      UPDATE push_subscriptions
      SET last_used_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Failed to update subscription last used:', error);
  }
}

export async function deactivateSubscription(id: string): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`
      UPDATE push_subscriptions
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('Failed to deactivate subscription:', error);
    return false;
  }
}

export async function deleteSubscription(id: string): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`DELETE FROM push_subscriptions WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Failed to delete subscription:', error);
    return false;
  }
}

// Preferences operations
export async function createPreferences(
  preferences: Omit<NotificationPreferencesRecord, 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO notification_preferences (
        id, subscription_id, morning_enabled, morning_hour,
        evening_enabled, evening_hour, timezone
      )
      VALUES (
        ${preferences.id}, ${preferences.subscriptionId},
        ${preferences.morningEnabled}, ${preferences.morningHour},
        ${preferences.eveningEnabled}, ${preferences.eveningHour},
        ${preferences.timezone}
      )
    `;
    return true;
  } catch (error) {
    console.error('Failed to create preferences:', error);
    return false;
  }
}

export async function getPreferencesBySubscriptionId(
  subscriptionId: string
): Promise<NotificationPreferencesRecord | null> {
  if (!sql) return null;

  try {
    const result = await sql`
      SELECT id, subscription_id, morning_enabled, morning_hour,
             evening_enabled, evening_hour, timezone, created_at, updated_at
      FROM notification_preferences
      WHERE subscription_id = ${subscriptionId}
    `;

    if (result.length === 0) return null;

    const row = result[0] as any;
    return {
      id: row.id,
      subscriptionId: row.subscription_id,
      morningEnabled: row.morning_enabled,
      morningHour: row.morning_hour,
      eveningEnabled: row.evening_enabled,
      eveningHour: row.evening_hour,
      timezone: row.timezone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return null;
  }
}

export async function updatePreferences(
  subscriptionId: string,
  updates: Partial<Omit<NotificationPreferencesRecord, 'id' | 'subscriptionId' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> {
  if (!sql) return false;

  try {
    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.morningEnabled !== undefined) {
      setClauses.push('morning_enabled = $1');
      values.push(updates.morningEnabled);
    }
    if (updates.morningHour !== undefined) {
      setClauses.push('morning_hour = $' + (values.length + 1));
      values.push(updates.morningHour);
    }
    if (updates.eveningEnabled !== undefined) {
      setClauses.push('evening_enabled = $' + (values.length + 1));
      values.push(updates.eveningEnabled);
    }
    if (updates.eveningHour !== undefined) {
      setClauses.push('evening_hour = $' + (values.length + 1));
      values.push(updates.eveningHour);
    }
    if (updates.timezone !== undefined) {
      setClauses.push('timezone = $' + (values.length + 1));
      values.push(updates.timezone);
    }

    if (setClauses.length === 0) return false;

    setClauses.push('updated_at = NOW()');
    values.push(subscriptionId);

    await sql.query(
      `UPDATE notification_preferences SET ${setClauses.join(', ')} WHERE subscription_id = $${values.length}`,
      values
    );

    return true;
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return false;
  }
}

// History operations
export async function logNotification(
  history: Omit<NotificationHistoryRecord, 'sentAt'>
): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO notification_history (
        id, subscription_id, type, title, body, delivered, error_message
      )
      VALUES (
        ${history.id}, ${history.subscriptionId}, ${history.type},
        ${history.title}, ${history.body}, ${history.delivered},
        ${history.errorMessage || null}
      )
    `;
    return true;
  } catch (error) {
    console.error('Failed to log notification:', error);
    return false;
  }
}

// Query operations for cron job
export async function getEligibleSubscriptions(
  currentHour: number
): Promise<Array<{
  subscription: PushSubscriptionJSON;
  preferences: NotificationPreferencesRecord;
}>> {
  if (!sql) return [];

  try {
    // Get subscriptions with matching morning or evening hour
    const result = await sql`
      SELECT
        s.id, s.endpoint, s.keys,
        p.id as pref_id, p.subscription_id, p.morning_enabled, p.morning_hour,
        p.evening_enabled, p.evening_hour, p.timezone, p.created_at as pref_created_at, p.updated_at
      FROM push_subscriptions s
      INNER JOIN notification_preferences p ON s.id = p.subscription_id
      WHERE s.is_active = true
        AND (
          (p.morning_enabled = true AND p.morning_hour = ${currentHour})
          OR
          (p.evening_enabled = true AND p.evening_hour = ${currentHour})
        )
    `;

    return result.map((row: any) => ({
      subscription: {
        endpoint: row.endpoint,
        keys: JSON.parse(row.keys),
      },
      preferences: {
        id: row.pref_id,
        subscriptionId: row.subscription_id,
        morningEnabled: row.morning_enabled,
        morningHour: row.morning_hour,
        eveningEnabled: row.evening_enabled,
        eveningHour: row.evening_hour,
        timezone: row.timezone,
        createdAt: new Date(row.pref_created_at),
        updatedAt: new Date(row.updated_at),
      },
    }));
  } catch (error) {
    console.error('Failed to get eligible subscriptions:', error);
    return [];
  }
}

export async function getAllActiveSubscriptions(): Promise<
  Array<{ id: string; subscription: PushSubscriptionJSON }>
> {
  if (!sql) return [];

  try {
    const result = await sql`
      SELECT id, endpoint, keys
      FROM push_subscriptions
      WHERE is_active = true
    `;

    return result.map((row: any) => ({
      id: row.id,
      subscription: {
        endpoint: row.endpoint,
        keys: JSON.parse(row.keys),
      },
    }));
  } catch (error) {
    console.error('Failed to get active subscriptions:', error);
    return [];
  }
}
