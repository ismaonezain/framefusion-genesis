-- FrameFusion Genesis V3 - Add Traits Columns to NFTs Table
-- This migration adds columns to store NFT base traits (character, clothing, etc.)

-- Add traits columns to nfts table if they don't exist
ALTER TABLE nfts
ADD COLUMN IF NOT EXISTS character_class TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS color_palette TEXT,
ADD COLUMN IF NOT EXISTS clothing TEXT,
ADD COLUMN IF NOT EXISTS accessories TEXT;

-- Add indexes for faster trait queries
CREATE INDEX IF NOT EXISTS idx_nfts_character_class ON nfts(character_class);
CREATE INDEX IF NOT EXISTS idx_nfts_gender ON nfts(gender);
CREATE INDEX IF NOT EXISTS idx_nfts_background ON nfts(background);

-- Add comments for documentation
COMMENT ON COLUMN nfts.character_class IS 'Character class/archetype (e.g., Warrior, Mage, Ranger)';
COMMENT ON COLUMN nfts.gender IS 'Character gender (male/female)';
COMMENT ON COLUMN nfts.background IS 'Background scene type (e.g., Cyberpunk City, Fantasy Forest)';
COMMENT ON COLUMN nfts.color_palette IS 'Primary color palette (e.g., Blue/Silver, Red/Gold)';
COMMENT ON COLUMN nfts.clothing IS 'Character clothing/outfit description';
COMMENT ON COLUMN nfts.accessories IS 'Character accessories (weapons, aura, effects)';

-- NOTE: For existing V2 NFTs that were minted before this migration,
-- you'll need to fetch metadata from the V2 contract and populate these columns.
-- This can be done via a script or admin panel function.

-- Example query to check which NFTs need trait data populated:
-- SELECT fid, token_id, character_class, gender, background 
-- FROM nfts 
-- WHERE minted = TRUE AND character_class IS NULL;
