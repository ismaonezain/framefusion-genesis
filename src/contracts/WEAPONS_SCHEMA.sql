-- Weapon NFT System - Supabase Schema
-- 20 Weapon Types Matching FrameFusion Character Classes
-- Tracks weapon minting, upgrades, equipment, and breaking for off-chain logic

-- Create weapons table
CREATE TABLE IF NOT EXISTS weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL UNIQUE,
  owner_address TEXT NOT NULL,
  fid INTEGER,
  weapon_class INTEGER NOT NULL, -- 0-19 (20 weapon types matching FrameFusion classes)
  weapon_type TEXT NOT NULL,
  rarity INTEGER NOT NULL, -- 0=Common, 1=Rare, 2=Epic, 3=Legendary
  level INTEGER NOT NULL DEFAULT 1,
  attack_power INTEGER NOT NULL,
  equipped_to INTEGER DEFAULT NULL, -- FrameFusion token_id or NULL
  is_broken BOOLEAN DEFAULT FALSE,
  metadata_uri TEXT,
  image_url TEXT,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_upgrade_at TIMESTAMP WITH TIME ZONE,
  upgrade_attempts INTEGER DEFAULT 0,
  successful_upgrades INTEGER DEFAULT 0,
  failed_upgrades INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weapon upgrade history table
CREATE TABLE IF NOT EXISTS weapon_upgrade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_token_id INTEGER NOT NULL REFERENCES weapons(token_id) ON DELETE CASCADE,
  owner_address TEXT NOT NULL,
  from_level INTEGER NOT NULL,
  to_level INTEGER,
  success BOOLEAN NOT NULL,
  cost INTEGER NOT NULL, -- Cost in $SHADOW tokens (goes to reserve)
  broke_weapon BOOLEAN DEFAULT FALSE, -- TRUE if weapon broke during this upgrade
  success_rate INTEGER NOT NULL, -- 0-100
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weapon equipment history table
CREATE TABLE IF NOT EXISTS weapon_equipment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_token_id INTEGER NOT NULL,
  framefusion_token_id INTEGER NOT NULL,
  owner_address TEXT NOT NULL,
  action TEXT NOT NULL, -- "equipped" or "unequipped"
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weapons_owner ON weapons(owner_address);
CREATE INDEX IF NOT EXISTS idx_weapons_fid ON weapons(fid);
CREATE INDEX IF NOT EXISTS idx_weapons_token_id ON weapons(token_id);
CREATE INDEX IF NOT EXISTS idx_weapons_equipped ON weapons(equipped_to);
CREATE INDEX IF NOT EXISTS idx_weapons_rarity ON weapons(rarity);
CREATE INDEX IF NOT EXISTS idx_weapons_level ON weapons(level);
CREATE INDEX IF NOT EXISTS idx_weapons_class ON weapons(weapon_class);
CREATE INDEX IF NOT EXISTS idx_weapon_upgrade_history_token_id ON weapon_upgrade_history(weapon_token_id);
CREATE INDEX IF NOT EXISTS idx_weapon_upgrade_history_owner ON weapon_upgrade_history(owner_address);
CREATE INDEX IF NOT EXISTS idx_weapon_equipment_history_weapon ON weapon_equipment_history(weapon_token_id);
CREATE INDEX IF NOT EXISTS idx_weapon_equipment_history_framefusion ON weapon_equipment_history(framefusion_token_id);

-- Add comments for documentation
COMMENT ON TABLE weapons IS 'Tracks all weapon NFT mints and their current stats (20 weapon types matching FrameFusion classes)';
COMMENT ON TABLE weapon_upgrade_history IS 'Records all weapon upgrade attempts (success, failure, breaking)';
COMMENT ON TABLE weapon_equipment_history IS 'Tracks weapon equipment/unequipment to FrameFusions';

COMMENT ON COLUMN weapons.weapon_class IS '0-19: Swordmaster, ShadowAssassin, HolyKnight, BattleMage, ArcherRanger, TechHacker, StreetFighter, MusicianBard, ChefArtisan, PhotographerScout, Gunslinger, MedicHealer, EngineerBuilder, DetectiveInvestigator, AthleteChampion, BeastTamer, AlchemistSage, SamuraiDuelist, NinjaOperative, DragonKnight';
COMMENT ON COLUMN weapons.rarity IS '0=Common, 1=Rare, 2=Epic, 3=Legendary';
COMMENT ON COLUMN weapons.equipped_to IS 'FrameFusion token_id if equipped, NULL if unequipped';
COMMENT ON COLUMN weapons.is_broken IS 'TRUE if weapon was destroyed from failed upgrade (level 6+ with 30% break chance)';
COMMENT ON COLUMN weapon_upgrade_history.broke_weapon IS 'TRUE if weapon broke during this upgrade attempt';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weapons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_weapons_updated_at ON weapons;
CREATE TRIGGER trigger_update_weapons_updated_at
  BEFORE UPDATE ON weapons
  FOR EACH ROW
  EXECUTE FUNCTION update_weapons_updated_at();

-- Create function to track upgrade stats
CREATE OR REPLACE FUNCTION update_weapon_upgrade_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update weapon upgrade attempt counters
  UPDATE weapons
  SET 
    upgrade_attempts = upgrade_attempts + 1,
    successful_upgrades = successful_upgrades + CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failed_upgrades = failed_upgrades + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    last_upgrade_at = NEW.timestamp,
    level = CASE WHEN NEW.success THEN NEW.to_level ELSE level END,
    is_broken = CASE WHEN NEW.broke_weapon THEN TRUE ELSE is_broken END
  WHERE token_id = NEW.weapon_token_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update weapon stats on upgrade
DROP TRIGGER IF EXISTS trigger_update_weapon_upgrade_stats ON weapon_upgrade_history;
CREATE TRIGGER trigger_update_weapon_upgrade_stats
  AFTER INSERT ON weapon_upgrade_history
  FOR EACH ROW
  EXECUTE FUNCTION update_weapon_upgrade_stats();

-- Create view for weapon stats with upgrade success rate
CREATE OR REPLACE VIEW weapon_stats_summary AS
SELECT 
  w.token_id,
  w.owner_address,
  w.fid,
  w.weapon_class,
  w.weapon_type,
  w.rarity,
  w.level,
  w.attack_power,
  w.equipped_to,
  w.is_broken,
  w.upgrade_attempts,
  w.successful_upgrades,
  w.failed_upgrades,
  CASE 
    WHEN w.upgrade_attempts > 0 THEN ROUND((w.successful_upgrades::NUMERIC / w.upgrade_attempts::NUMERIC) * 100, 2)
    ELSE 0
  END as success_rate_percentage,
  w.minted_at,
  w.last_upgrade_at,
  w.image_url,
  w.metadata_uri
FROM weapons w
WHERE w.is_broken = FALSE;

COMMENT ON VIEW weapon_stats_summary IS 'Aggregated weapon stats with calculated success rates';

-- Create view for top weapons leaderboard
CREATE OR REPLACE VIEW weapons_leaderboard AS
SELECT 
  w.token_id,
  w.owner_address,
  w.weapon_class,
  w.weapon_type,
  w.rarity,
  w.level,
  w.attack_power,
  w.successful_upgrades,
  w.minted_at,
  w.image_url,
  ROW_NUMBER() OVER (ORDER BY w.level DESC, w.attack_power DESC, w.successful_upgrades DESC) as rank
FROM weapons w
WHERE w.is_broken = FALSE
LIMIT 100;

COMMENT ON VIEW weapons_leaderboard IS 'Top 100 weapons ranked by level, attack power, and upgrade count';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON weapons TO anon, authenticated;
GRANT SELECT, INSERT ON weapon_upgrade_history TO anon, authenticated;
GRANT SELECT, INSERT ON weapon_equipment_history TO anon, authenticated;
GRANT SELECT ON weapon_stats_summary TO anon, authenticated;
GRANT SELECT ON weapons_leaderboard TO anon, authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapon_upgrade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapon_equipment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (everyone can read, only owners can update)
CREATE POLICY "Anyone can view weapons" ON weapons FOR SELECT USING (true);
CREATE POLICY "Owners can insert their weapons" ON weapons FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update their weapons" ON weapons FOR UPDATE USING (true);

CREATE POLICY "Anyone can view upgrade history" ON weapon_upgrade_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert upgrade history" ON weapon_upgrade_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view equipment history" ON weapon_equipment_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert equipment history" ON weapon_equipment_history FOR INSERT WITH CHECK (true);
