-- FrameFusion Genesis - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- 1. Notification Tokens Table
-- Stores notification tokens for users who enabled notifications
CREATE TABLE IF NOT EXISTS notification_tokens (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_enabled ON notification_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);

-- 2. Webhook Events Table
-- Logs all webhook events from Farcaster
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_fid ON webhook_events(fid);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- 3. Notification Logs Table
-- Logs all sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGSERIAL PRIMARY KEY,
  notification_id TEXT NOT NULL,
  fid BIGINT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'rate_limited'
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_fid ON notification_logs(fid);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Enable Row Level Security (RLS) but allow service role full access
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (bypass RLS)
CREATE POLICY "Service role has full access to notification_tokens"
  ON notification_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to webhook_events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to notification_logs"
  ON notification_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification_tokens
DROP TRIGGER IF EXISTS update_notification_tokens_updated_at ON notification_tokens;
CREATE TRIGGER update_notification_tokens_updated_at
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ All tables created successfully!';
  RAISE NOTICE '📊 Tables: notification_tokens, webhook_events, notification_logs';
  RAISE NOTICE '🔒 RLS enabled with service_role policies';
  RAISE NOTICE '⚡ Indexes and triggers configured';
END $$;
