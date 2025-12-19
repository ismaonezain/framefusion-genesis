-- FrameFusion Genesis V3 Migration - Supabase Schema Updates

-- Add V3 migration columns to nfts table
ALTER TABLE nfts
ADD COLUMN IF NOT EXISTS migrated_to_v3 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS v3_token_id TEXT,
ADD COLUMN IF NOT EXISTS v3_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster V3 migration queries
CREATE INDEX IF NOT EXISTS idx_nfts_migrated_v3 ON nfts(migrated_to_v3);
CREATE INDEX IF NOT EXISTS idx_nfts_v3_token_id ON nfts(v3_token_id);

-- Create traits table for storing unlockable traits
CREATE TABLE IF NOT EXISTS nft_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL REFERENCES nfts(fid) ON DELETE CASCADE,
  trait_type TEXT NOT NULL,
  trait_value TEXT NOT NULL,
  display_type TEXT DEFAULT 'string',
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fid, trait_type, trait_value)
);

-- Add index for faster trait queries
CREATE INDEX IF NOT EXISTS idx_nft_traits_fid ON nft_traits(fid);
CREATE INDEX IF NOT EXISTS idx_nft_traits_type ON nft_traits(trait_type);

-- Add comments for documentation
COMMENT ON COLUMN nfts.migrated_to_v3 IS 'Whether this NFT has been migrated from V2 to V3 contract';
COMMENT ON COLUMN nfts.v3_token_id IS 'Token ID in V3 contract after migration';
COMMENT ON COLUMN nfts.v3_tx_hash IS 'Transaction hash of V3 migration';
COMMENT ON COLUMN nfts.migrated_at IS 'Timestamp when NFT was migrated to V3';
COMMENT ON TABLE nft_traits IS 'Unlockable traits earned through user engagement';

-- Create function to auto-award traits based on engagement
CREATE OR REPLACE FUNCTION award_engagement_traits()
RETURNS TRIGGER AS $$
BEGIN
  -- Award "Streak Legend" badge for 30+ day streak
  IF NEW.check_in_streak >= 30 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.fid, 'Achievement', 'Streak Legend', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;
  END IF;

  -- Award "Whale" badge for 1M+ $TRIA claimed
  IF NEW.total_tria >= 1000000 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.fid, 'Achievement', 'Whale', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;
  END IF;

  -- Update loyalty tier based on streak
  IF NEW.check_in_streak >= 100 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.fid, 'Loyalty Tier', 'Diamond', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO UPDATE SET trait_value = 'Diamond';
  ELSIF NEW.check_in_streak >= 30 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.fid, 'Loyalty Tier', 'Gold', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO UPDATE SET trait_value = 'Gold';
  ELSIF NEW.check_in_streak >= 7 THEN
    INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
    VALUES (NEW.fid, 'Loyalty Tier', 'Silver', 'badge')
    ON CONFLICT (fid, trait_type, trait_value) DO UPDATE SET trait_value = 'Silver';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-award traits on user_engagement updates
DROP TRIGGER IF EXISTS trigger_award_traits ON user_engagement;
CREATE TRIGGER trigger_award_traits
  AFTER INSERT OR UPDATE OF check_in_streak, total_tria ON user_engagement
  FOR EACH ROW
  EXECUTE FUNCTION award_engagement_traits();

-- Award "Early Adopter" badge to first 100 minters
INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
SELECT 
  n.fid,
  'Achievement' as trait_type,
  'Early Adopter' as trait_value,
  'badge' as display_type
FROM nfts n
WHERE n.token_id::INTEGER <= 100 
  AND n.minted = TRUE
ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;

-- Award "V3 Pioneer" badge to all migrated users
INSERT INTO nft_traits (fid, trait_type, trait_value, display_type)
SELECT 
  n.fid,
  'Achievement' as trait_type,
  'V3 Pioneer' as trait_value,
  'badge' as display_type
FROM nfts n
WHERE n.migrated_to_v3 = TRUE
ON CONFLICT (fid, trait_type, trait_value) DO NOTHING;

-- Create view for easy trait querying
CREATE OR REPLACE VIEW nft_traits_summary AS
SELECT 
  n.fid,
  n.image_url,
  n.token_id,
  n.migrated_to_v3,
  u.check_in_streak,
  u.total_tria,
  array_agg(
    json_build_object(
      'trait_type', t.trait_type,
      'value', t.trait_value,
      'display_type', t.display_type,
      'unlocked_at', t.unlocked_at
    )
  ) FILTER (WHERE t.id IS NOT NULL) as traits
FROM nfts n
LEFT JOIN user_engagement u ON n.fid = u.fid
LEFT JOIN nft_traits t ON n.fid = t.fid
GROUP BY n.fid, n.image_url, n.token_id, n.migrated_to_v3, u.check_in_streak, u.total_tria;

COMMENT ON VIEW nft_traits_summary IS 'Aggregated view of NFTs with their traits and engagement stats';

-- Grant appropriate permissions
GRANT SELECT ON nft_traits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON nft_traits TO authenticated;
GRANT SELECT ON nft_traits_summary TO anon, authenticated;
