-- =====================================================
-- WEAPON IMAGES TABLE
-- Stores IPFS URLs and metadata for all weapon images
-- =====================================================

-- Create weapon_images table
CREATE TABLE IF NOT EXISTS weapon_images (
  id BIGSERIAL PRIMARY KEY,
  weapon_class INTEGER NOT NULL CHECK (weapon_class BETWEEN 0 AND 19),
  rarity INTEGER NOT NULL CHECK (rarity BETWEEN 0 AND 3),
  
  -- Image URLs
  image_url TEXT NOT NULL,
  ipfs_uri TEXT NOT NULL,
  image_cid TEXT,
  
  -- Metadata URLs
  metadata_url TEXT NOT NULL,
  metadata_ipfs_uri TEXT NOT NULL,
  metadata_cid TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one image per weapon_class + rarity combination
  UNIQUE (weapon_class, rarity)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weapon_images_weapon_class ON weapon_images(weapon_class);
CREATE INDEX IF NOT EXISTS idx_weapon_images_rarity ON weapon_images(rarity);
CREATE INDEX IF NOT EXISTS idx_weapon_images_weapon_class_rarity ON weapon_images(weapon_class, rarity);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weapon_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS weapon_images_updated_at_trigger ON weapon_images;
CREATE TRIGGER weapon_images_updated_at_trigger
  BEFORE UPDATE ON weapon_images
  FOR EACH ROW
  EXECUTE FUNCTION update_weapon_images_updated_at();

-- Create view for weapon images with type names
CREATE OR REPLACE VIEW weapon_images_with_names AS
SELECT 
  wi.*,
  CASE wi.weapon_class
    WHEN 0 THEN 'Twin Legendary Blades'
    WHEN 1 THEN 'Obsidian Daggers'
    WHEN 2 THEN 'Blessed Longsword'
    WHEN 3 THEN 'Enchanted Staff-Sword'
    WHEN 4 THEN 'Composite Bow'
    WHEN 5 THEN 'Holographic Terminal'
    WHEN 6 THEN 'Combat Gloves'
    WHEN 7 THEN 'Electric Guitar'
    WHEN 8 THEN 'Chef''s Knife Set'
    WHEN 9 THEN 'Pro Camera'
    WHEN 10 THEN 'Dual Pistols'
    WHEN 11 THEN 'Medical Kit'
    WHEN 12 THEN 'High-Tech Toolkit'
    WHEN 13 THEN 'Magnifying Glass'
    WHEN 14 THEN 'Sports Equipment'
    WHEN 15 THEN 'Summoning Orb'
    WHEN 16 THEN 'Alchemy Vials'
    WHEN 17 THEN 'Katana Blade'
    WHEN 18 THEN 'Kunai Set'
    WHEN 19 THEN 'Flame Spear'
  END AS weapon_name,
  CASE wi.rarity
    WHEN 0 THEN 'Common'
    WHEN 1 THEN 'Rare'
    WHEN 2 THEN 'Epic'
    WHEN 3 THEN 'Legendary'
  END AS rarity_name
FROM weapon_images wi;

-- Grant permissions (adjust role as needed)
GRANT ALL ON weapon_images TO postgres;
GRANT ALL ON weapon_images_id_seq TO postgres;
GRANT SELECT ON weapon_images_with_names TO postgres;

-- Comments
COMMENT ON TABLE weapon_images IS 'Stores IPFS URLs and metadata for all weapon images (80 total: 20 types × 4 rarities)';
COMMENT ON COLUMN weapon_images.weapon_class IS 'Weapon class enum (0-19) matching WeaponClass in smart contract';
COMMENT ON COLUMN weapon_images.rarity IS 'Rarity tier (0=Common, 1=Rare, 2=Epic, 3=Legendary)';
COMMENT ON COLUMN weapon_images.image_url IS 'Pinata CDN gateway URL for the weapon image';
COMMENT ON COLUMN weapon_images.ipfs_uri IS 'IPFS URI (ipfs://...) for the weapon image';
COMMENT ON COLUMN weapon_images.metadata_url IS 'Pinata CDN gateway URL for NFT metadata JSON';
COMMENT ON COLUMN weapon_images.metadata_ipfs_uri IS 'IPFS URI (ipfs://...) for NFT metadata JSON';
