-- =====================================================
-- NOTIFICATION TOKENS TABLE
-- Store notification tokens for users who enabled notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Index for fast lookups
  CONSTRAINT unique_fid_token UNIQUE(fid, token)
);

-- Index for fast FID lookups
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_enabled ON notification_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);

-- =====================================================
-- NOTIFICATION LOGS TABLE
-- Track all sent notifications for analytics and debugging
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT NOT NULL,
  fid BIGINT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'rate_limited'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for analytics
  CONSTRAINT unique_notification_send UNIQUE(notification_id, fid)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_fid ON notification_logs(fid);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);

-- =====================================================
-- WEBHOOK EVENTS TABLE
-- Store raw webhook events for debugging
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT NOT NULL,
  event_type TEXT NOT NULL, -- 'miniapp_added', 'notifications_enabled', 'notifications_disabled', 'miniapp_removed'
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_fid ON webhook_events(fid);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notification_tokens_updated_at ON notification_tokens;
CREATE TRIGGER update_notification_tokens_updated_at
    BEFORE UPDATE ON notification_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on notification_tokens"
  ON notification_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on notification_logs"
  ON notification_logs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on webhook_events"
  ON webhook_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Active notification tokens view
CREATE OR REPLACE VIEW active_notification_tokens AS
SELECT 
  fid,
  COUNT(*) as token_count,
  MAX(created_at) as latest_token_at,
  MAX(last_used_at) as last_notification_at
FROM notification_tokens
WHERE enabled = true
GROUP BY fid;

-- Notification stats view
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  DATE(sent_at) as date,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT fid) as unique_users
FROM notification_logs
GROUP BY DATE(sent_at), status
ORDER BY date DESC;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all active tokens for a user
-- SELECT * FROM notification_tokens WHERE fid = 235940 AND enabled = true;

-- Get notification history for a user
-- SELECT * FROM notification_logs WHERE fid = 235940 ORDER BY sent_at DESC LIMIT 10;

-- Get daily notification stats
-- SELECT * FROM notification_stats WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Get all users with active notifications
-- SELECT * FROM active_notification_tokens ORDER BY latest_token_at DESC;
