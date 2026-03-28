-- Neon Database Schema for 問いの道場 Push Notifications
-- Run this in Neon SQL Editor at https://console.neon.tech/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP
);

-- Create notification_preferences table
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

-- Create notification_history table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_subscription
ON notification_preferences(subscription_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_subscription
ON notification_history(subscription_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at
ON notification_history(sent_at);

-- Verification query
SELECT
  'push_subscriptions' as table_name,
  COUNT(*) as row_count
FROM push_subscriptions
UNION ALL
SELECT
  'notification_preferences' as table_name,
  COUNT(*) as row_count
FROM notification_preferences
UNION ALL
SELECT
  'notification_history' as table_name,
  COUNT(*) as row_count
FROM notification_history;
