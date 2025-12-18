-- FrameShadows Monsters Database Schema

-- Create monsters table
CREATE TABLE IF NOT EXISTS monsters (
  id TEXT PRIMARY KEY,
  monster_id INTEGER NOT NULL,
  token_id TEXT,
  name TEXT NOT NULL,
  monster_type TEXT NOT NULL,
  element TEXT NOT NULL DEFAULT 'Dark',
  rarity TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  power_level INTEGER NOT NULL DEFAULT 100,
  image_url TEXT NOT NULL,
  ipfs_uri TEXT,
  ipfs_gateway TEXT,
  metadata_uri TEXT,
  minted BOOLEAN DEFAULT FALSE,
  mint_tx_hash TEXT,
  is_wild BOOLEAN DEFAULT TRUE,
  owner_fid INTEGER,
  defeated_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  minted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_monsters_monster_id ON monsters(monster_id);
CREATE INDEX IF NOT EXISTS idx_monsters_token_id ON monsters(token_id);
CREATE INDEX IF NOT EXISTS idx_monsters_owner_fid ON monsters(owner_fid);
CREATE INDEX IF NOT EXISTS idx_monsters_minted ON monsters(minted);
CREATE INDEX IF NOT EXISTS idx_monsters_rarity ON monsters(rarity);
CREATE INDEX IF NOT EXISTS idx_monsters_element ON monsters(element);
CREATE INDEX IF NOT EXISTS idx_monsters_level ON monsters(level);
CREATE INDEX IF NOT EXISTS idx_monsters_is_wild ON monsters(is_wild);

-- Create battle_history table for tracking character vs monster battles
CREATE TABLE IF NOT EXISTS battle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_fid INTEGER NOT NULL REFERENCES nfts(fid) ON DELETE CASCADE,
  character_token_id TEXT,
  monster_id TEXT NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
  monster_token_id TEXT,
  winner TEXT NOT NULL CHECK (winner IN ('character', 'monster', 'draw')),
  character_power INTEGER NOT NULL,
  monster_power INTEGER NOT NULL,
  tria_reward INTEGER DEFAULT 0,
  exp_gained INTEGER DEFAULT 0,
  battle_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for battle history
CREATE INDEX IF NOT EXISTS idx_battle_character_fid ON battle_history(character_fid);
CREATE INDEX IF NOT EXISTS idx_battle_monster_id ON battle_history(monster_id);
CREATE INDEX IF NOT EXISTS idx_battle_winner ON battle_history(winner);
CREATE INDEX IF NOT EXISTS idx_battle_created_at ON battle_history(created_at);

-- Create monster_traits table (similar to nft_traits but for monsters)
CREATE TABLE IF NOT EXISTS monster_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id TEXT NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
  trait_type TEXT NOT NULL,
  trait_value TEXT NOT NULL,
  display_type TEXT DEFAULT 'string',
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(monster_id, trait_type, trait_value)
);

-- Add index for monster traits
CREATE INDEX IF NOT EXISTS idx_monster_traits_monster_id ON monster_traits(monster_id);
CREATE INDEX IF NOT EXISTS idx_monster_traits_type ON monster_traits(trait_type);

-- Add comments
COMMENT ON TABLE monsters IS 'FrameShadows monster NFTs - opponents for FrameFusion characters';
COMMENT ON TABLE battle_history IS 'Record of all battles between characters and monsters';
COMMENT ON TABLE monster_traits IS 'Special traits and abilities for monsters';

COMMENT ON COLUMN monsters.monster_id IS 'Unique monster ID for deterministic generation (like FID for characters)';
COMMENT ON COLUMN monsters.element IS 'Elemental type (Fire, Ice, Dark, Lightning, Poison, etc)';
COMMENT ON COLUMN monsters.level IS 'Monster level - starts at 1, can increase through battles';
COMMENT ON COLUMN monsters.is_wild IS 'Whether monster is wild (spawned) or owned by player';
COMMENT ON COLUMN monsters.power_level IS 'Combat power level for battle system (calculated from level and rarity)';
COMMENT ON COLUMN monsters.defeated_count IS 'Number of times defeated in battles';

-- Create view for monster stats summary
CREATE OR REPLACE VIEW monster_stats_summary AS
SELECT 
  m.id,
  m.monster_id,
  m.token_id,
  m.name,
  m.monster_type,
  m.element,
  m.rarity,
  m.level,
  m.power_level,
  m.defeated_count,
  m.is_wild,
  m.owner_fid,
  COUNT(DISTINCT b.id) as total_battles,
  COUNT(DISTINCT CASE WHEN b.winner = 'monster' THEN b.id END) as wins,
  COUNT(DISTINCT CASE WHEN b.winner = 'character' THEN b.id END) as losses,
  array_agg(
    DISTINCT jsonb_build_object(
      'trait_type', t.trait_type,
      'value', t.trait_value,
      'display_type', t.display_type
    )
  ) FILTER (WHERE t.id IS NOT NULL) as traits
FROM monsters m
LEFT JOIN battle_history b ON m.id = b.monster_id
LEFT JOIN monster_traits t ON m.id = t.monster_id
GROUP BY m.id, m.monster_id, m.token_id, m.name, m.monster_type, m.element, m.rarity, 
         m.level, m.power_level, m.defeated_count, m.is_wild, m.owner_fid;

COMMENT ON VIEW monster_stats_summary IS 'Aggregated monster statistics with battle record and traits';

-- Create view for player battle statistics
CREATE OR REPLACE VIEW player_battle_stats AS
SELECT 
  n.fid,
  COUNT(DISTINCT b.id) as total_battles,
  COUNT(DISTINCT CASE WHEN b.winner = 'character' THEN b.id END) as wins,
  COUNT(DISTINCT CASE WHEN b.winner = 'monster' THEN b.id END) as losses,
  COUNT(DISTINCT CASE WHEN b.winner = 'draw' THEN b.id END) as draws,
  SUM(b.tria_reward) as total_tria_from_battles,
  SUM(b.exp_gained) as total_exp_gained,
  AVG(b.battle_duration) as avg_battle_duration
FROM nfts n
LEFT JOIN battle_history b ON n.fid = b.character_fid
GROUP BY n.fid;

COMMENT ON VIEW player_battle_stats IS 'Player battle statistics and rewards summary';

-- Function to award traits based on battle performance
CREATE OR REPLACE FUNCTION award_battle_traits()
RETURNS TRIGGER AS $$
BEGIN
  -- Award "Monster Slayer" badge for defeating 10+ monsters
  IF (SELECT COUNT(*) FROM battle_history WHERE character_fid = NEW.character_fid AND winner = 'character') >= 10 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.character_fid, 'Achievement', 'Monster Slayer', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;
  END IF;

  -- Award "Legendary Hunter" for defeating 50+ monsters
  IF (SELECT COUNT(*) FROM battle_history WHERE character_fid = NEW.character_fid AND winner = 'character') >= 50 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.character_fid, 'Achievement', 'Legendary Hunter', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;
  END IF;

  -- Award "Boss Killer" for defeating Epic or Legendary monsters
  IF NEW.winner = 'character' THEN
    DECLARE
      monster_rarity TEXT;
    BEGIN
      SELECT rarity INTO monster_rarity FROM monsters WHERE id = NEW.monster_id;
      
      IF monster_rarity IN ('Epic', 'Legendary') THEN
        INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
        VALUES (NEW.character_fid, 'Achievement', 'Boss Killer', 'badge')
        ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for battle achievements
DROP TRIGGER IF EXISTS trigger_award_battle_traits ON battle_history;
CREATE TRIGGER trigger_award_battle_traits
  AFTER INSERT ON battle_history
  FOR EACH ROW
  EXECUTE FUNCTION award_battle_traits();

-- Grant permissions
GRANT SELECT ON monsters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON monsters TO authenticated;
GRANT SELECT ON battle_history TO anon, authenticated;
GRANT INSERT ON battle_history TO authenticated;
GRANT SELECT ON monster_traits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON monster_traits TO authenticated;
GRANT SELECT ON monster_stats_summary TO anon, authenticated;
GRANT SELECT ON player_battle_stats TO anon, authenticated;
