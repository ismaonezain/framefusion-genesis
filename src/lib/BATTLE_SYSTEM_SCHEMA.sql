-- ================================================================================
-- FRAMEFUSION GENESIS BATTLE SYSTEM - COMPLETE DATABASE SCHEMA
-- ================================================================================
-- This schema implements:
-- - Monster staking system (1 day minimum lock)
-- - User vs User battles (FrameFusion vs Monster)
-- - $SHADOW token economy (100B total supply, 10B treasury)
-- - Risk/reward multiplier system
-- - Weekly raffle with flat 10% distribution
-- - Daily battle limits (3 per day)
-- ================================================================================

-- 1. STAKING SYSTEM
-- ================================================================================

CREATE TABLE IF NOT EXISTS staked_monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id TEXT NOT NULL UNIQUE REFERENCES monsters(id) ON DELETE CASCADE,
  owner_fid INTEGER NOT NULL,
  staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unstake_available_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
  is_active BOOLEAN DEFAULT TRUE,
  total_battles INTEGER DEFAULT 0,
  max_battles INTEGER DEFAULT 10,
  total_earned DECIMAL(20, 2) DEFAULT 0,
  last_battled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_staked_monsters_owner ON staked_monsters(owner_fid);
CREATE INDEX idx_staked_monsters_active ON staked_monsters(is_active);
CREATE INDEX idx_staked_monsters_available ON staked_monsters(monster_id) WHERE is_active = TRUE AND total_battles < max_battles;

COMMENT ON TABLE staked_monsters IS 'Monsters staked for battle pool (1 day minimum lock)';
COMMENT ON COLUMN staked_monsters.unstake_available_at IS 'Timestamp when monster can be unstaked (1 day after staking)';
COMMENT ON COLUMN staked_monsters.max_battles IS 'Maximum battles before monster needs rest (default 10)';

-- 2. UPDATED BATTLE HISTORY
-- ================================================================================

-- Drop existing foreign key constraint if it exists
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_character_fid_fkey;

-- Add new columns for battle system
ALTER TABLE battle_history
ADD COLUMN IF NOT EXISTS entry_tier TEXT CHECK (entry_tier IN ('free', 'standard', 'premium')),
ADD COLUMN IF NOT EXISTS entry_amount DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS framefusion_owner_fid INTEGER NOT NULL,
ADD COLUMN IF NOT EXISTS monster_owner_fid INTEGER NOT NULL,
ADD COLUMN IF NOT EXISTS framefusion_class TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS monster_element TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS monster_power INTEGER NOT NULL,
ADD COLUMN IF NOT EXISTS class_advantage_multiplier DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS power_multiplier DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS element_multiplier DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS framefusion_reward DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monster_owner_reward DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS treasury_amount DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS raffle_contribution DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS battle_details JSONB;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_battle_history_ff_owner ON battle_history(framefusion_owner_fid);
CREATE INDEX IF NOT EXISTS idx_battle_history_monster_owner ON battle_history(monster_owner_fid);
CREATE INDEX IF NOT EXISTS idx_battle_history_entry_tier ON battle_history(entry_tier);

COMMENT ON COLUMN battle_history.entry_tier IS 'Entry tier: free (0), standard (5K-500K), premium (500K-5M)';
COMMENT ON COLUMN battle_history.entry_amount IS 'Amount of $SHADOW paid for entry';
COMMENT ON COLUMN battle_history.power_multiplier IS 'Based on monster rarity: Common 1.5x, Uncommon 2x, Rare 3x, Epic 5x, Legendary 8x';
COMMENT ON COLUMN battle_history.element_multiplier IS 'Class vs Element: Super Effective 3x, Effective 2x, Neutral 1x, Not Effective 0.5x';

-- 3. DAILY BATTLE LIMITS
-- ================================================================================

CREATE TABLE IF NOT EXISTS user_daily_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  free_battles_used INTEGER DEFAULT 0,
  paid_battles_used INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  last_battle_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fid, battle_date),
  CHECK (total_battles <= 3)
);

CREATE INDEX idx_user_daily_battles_fid_date ON user_daily_battles(fid, battle_date);

COMMENT ON TABLE user_daily_battles IS 'Track daily battle limits (max 3 per day all tiers)';

-- 4. RAFFLE SYSTEM
-- ================================================================================

CREATE TABLE IF NOT EXISTS raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  entry_tier TEXT NOT NULL CHECK (entry_tier IN ('standard', 'premium')),
  tickets_count INTEGER NOT NULL DEFAULT 1,
  battle_id UUID REFERENCES battle_history(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_raffle_tickets_fid_week ON raffle_tickets(fid, week_number);
CREATE INDEX idx_raffle_tickets_week ON raffle_tickets(week_number);

COMMENT ON TABLE raffle_tickets IS 'Raffle tickets earned from paid battles (standard=1, premium=5)';
COMMENT ON COLUMN raffle_tickets.week_number IS 'Format: YYYYWW (e.g., 202401 = 2024 week 1)';

CREATE TABLE IF NOT EXISTS raffle_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  total_pool DECIMAL(20, 2) DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  unique_participants INTEGER DEFAULT 0,
  is_drawn BOOLEAN DEFAULT FALSE,
  drawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE raffle_pool IS 'Weekly raffle prize pool (10% of all entry fees)';

CREATE TABLE IF NOT EXISTS raffle_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  fid INTEGER NOT NULL,
  prize_amount DECIMAL(20, 2) NOT NULL,
  user_ticket_count INTEGER NOT NULL,
  total_pool_tickets INTEGER NOT NULL,
  drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_raffle_winners_week ON raffle_winners(week_number);
CREATE INDEX idx_raffle_winners_fid ON raffle_winners(fid);

COMMENT ON TABLE raffle_winners IS 'Weekly raffle winners (10 winners, flat 10% each)';

-- 5. $SHADOW TOKEN ECONOMY
-- ================================================================================

CREATE TABLE IF NOT EXISTS shadow_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL UNIQUE,
  balance DECIMAL(20, 2) DEFAULT 0 CHECK (balance >= 0),
  total_earned DECIMAL(20, 2) DEFAULT 0,
  total_spent DECIMAL(20, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shadow_balances_fid ON shadow_balances(fid);

COMMENT ON TABLE shadow_balances IS '$SHADOW token balances (100B total supply)';

CREATE TABLE IF NOT EXISTS shadow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn_battle', 'earn_staking', 'earn_raffle', 'spend_battle', 'admin_add', 'admin_deduct')),
  amount DECIMAL(20, 2) NOT NULL,
  balance_before DECIMAL(20, 2) NOT NULL,
  balance_after DECIMAL(20, 2) NOT NULL,
  source_detail TEXT,
  battle_id UUID REFERENCES battle_history(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shadow_tx_fid ON shadow_transactions(fid);
CREATE INDEX idx_shadow_tx_type ON shadow_transactions(transaction_type);
CREATE INDEX idx_shadow_tx_created ON shadow_transactions(created_at DESC);

COMMENT ON TABLE shadow_transactions IS 'All $SHADOW token transactions with audit trail';

CREATE TABLE IF NOT EXISTS treasury_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance DECIMAL(20, 2) NOT NULL DEFAULT 10000000000,
  total_income DECIMAL(20, 2) DEFAULT 0,
  total_expenses DECIMAL(20, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial treasury balance (10B from 100B total supply)
INSERT INTO treasury_balance (current_balance) 
VALUES (10000000000)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE treasury_balance IS 'Treasury balance tracking (starts with 10B SHADOW)';

-- 6. HELPER FUNCTIONS
-- ================================================================================

-- Function to get current week number (format: YYYYWW)
CREATE OR REPLACE FUNCTION get_current_week_number()
RETURNS INTEGER AS $$
BEGIN
  RETURN CAST(TO_CHAR(NOW(), 'IYYYIW') AS INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Function to initialize raffle pool for current week
CREATE OR REPLACE FUNCTION initialize_raffle_pool()
RETURNS INTEGER AS $$
DECLARE
  current_week INTEGER;
BEGIN
  current_week := get_current_week_number();
  
  INSERT INTO raffle_pool (week_number)
  VALUES (current_week)
  ON CONFLICT (week_number) DO NOTHING;
  
  RETURN current_week;
END;
$$ LANGUAGE plpgsql;

-- Function to update user SHADOW balance
CREATE OR REPLACE FUNCTION update_shadow_balance(
  user_fid INTEGER,
  amount_change DECIMAL(20, 2),
  tx_type TEXT,
  tx_source TEXT DEFAULT NULL,
  battle_ref UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_balance DECIMAL(20, 2);
  new_balance DECIMAL(20, 2);
BEGIN
  -- Get or create balance record
  INSERT INTO shadow_balances (fid, balance)
  VALUES (user_fid, 0)
  ON CONFLICT (fid) DO NOTHING;
  
  -- Get current balance
  SELECT balance INTO old_balance FROM shadow_balances WHERE fid = user_fid;
  
  -- Calculate new balance
  new_balance := old_balance + amount_change;
  
  -- Check for negative balance
  IF new_balance < 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Update balance
  UPDATE shadow_balances
  SET 
    balance = new_balance,
    total_earned = total_earned + GREATEST(amount_change, 0),
    total_spent = total_spent + GREATEST(-amount_change, 0),
    last_updated = NOW()
  WHERE fid = user_fid;
  
  -- Record transaction
  INSERT INTO shadow_transactions (fid, transaction_type, amount, balance_before, balance_after, source_detail, battle_id)
  VALUES (user_fid, tx_type, ABS(amount_change), old_balance, new_balance, tx_source, battle_ref);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. VIEWS FOR STATISTICS
-- ================================================================================

CREATE OR REPLACE VIEW battle_stats_summary AS
SELECT 
  b.framefusion_owner_fid,
  COUNT(*) as total_battles,
  SUM(CASE WHEN entry_tier = 'free' THEN 1 ELSE 0 END) as free_battles,
  SUM(CASE WHEN entry_tier = 'standard' THEN 1 ELSE 0 END) as standard_battles,
  SUM(CASE WHEN entry_tier = 'premium' THEN 1 ELSE 0 END) as premium_battles,
  SUM(framefusion_reward) as total_rewards_earned,
  AVG(framefusion_reward) as avg_reward,
  MAX(framefusion_reward) as max_reward,
  MIN(framefusion_reward) as min_reward
FROM battle_history b
GROUP BY b.framefusion_owner_fid;

COMMENT ON VIEW battle_stats_summary IS 'User battle statistics and earnings';

CREATE OR REPLACE VIEW staking_stats_summary AS
SELECT 
  sm.owner_fid,
  COUNT(*) as total_staked_monsters,
  SUM(sm.total_battles) as total_battles_as_opponent,
  SUM(sm.total_earned) as total_staking_rewards,
  AVG(sm.total_earned) as avg_earnings_per_monster
FROM staked_monsters sm
WHERE sm.is_active = TRUE
GROUP BY sm.owner_fid;

COMMENT ON VIEW staking_stats_summary IS 'Monster owner staking statistics and earnings';

-- 8. PERMISSIONS
-- ================================================================================

GRANT SELECT ON staked_monsters TO anon, authenticated;
GRANT INSERT, UPDATE ON staked_monsters TO authenticated;
GRANT SELECT ON battle_history TO anon, authenticated;
GRANT INSERT ON battle_history TO authenticated;
GRANT SELECT ON user_daily_battles TO anon, authenticated;
GRANT INSERT, UPDATE ON user_daily_battles TO authenticated;
GRANT SELECT ON raffle_tickets TO anon, authenticated;
GRANT INSERT ON raffle_tickets TO authenticated;
GRANT SELECT ON raffle_pool TO anon, authenticated;
GRANT UPDATE ON raffle_pool TO authenticated;
GRANT SELECT ON raffle_winners TO anon, authenticated;
GRANT INSERT ON raffle_winners TO authenticated;
GRANT SELECT ON shadow_balances TO anon, authenticated;
GRANT UPDATE ON shadow_balances TO authenticated;
GRANT SELECT ON shadow_transactions TO anon, authenticated;
GRANT INSERT ON shadow_transactions TO authenticated;
GRANT SELECT ON treasury_balance TO anon, authenticated;
GRANT UPDATE ON treasury_balance TO authenticated;
GRANT SELECT ON battle_stats_summary TO anon, authenticated;
GRANT SELECT ON staking_stats_summary TO anon, authenticated;

-- Initialize first raffle pool
SELECT initialize_raffle_pool();
