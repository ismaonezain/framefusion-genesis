-- FrameShadows Metadata Sync Tracking
-- Add columns to track on-chain metadata sync status

-- Add columns if they don't exist
ALTER TABLE monsters 
ADD COLUMN IF NOT EXISTS metadata_synced_onchain BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata_sync_tx TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monsters_metadata_sync 
ON monsters(metadata_synced_onchain, metadata_uri);

-- Create index for token_id lookups
CREATE INDEX IF NOT EXISTS idx_monsters_token_id 
ON monsters(token_id);

-- Comment explaining the columns
COMMENT ON COLUMN monsters.metadata_synced_onchain IS 'Whether the metadata URI has been synced to the blockchain via updateTokenURI';
COMMENT ON COLUMN monsters.metadata_sync_tx IS 'Transaction hash of the on-chain metadata update';

-- Find NFTs that need metadata sync
-- Use this query to see which NFTs have IPFS metadata but haven't been synced on-chain yet
-- 
-- SELECT token_id, name, monster_type, metadata_uri
-- FROM monsters
-- WHERE metadata_uri IS NOT NULL
-- AND metadata_uri NOT LIKE '%framefusion-genesis%'
-- AND (metadata_synced_onchain IS NULL OR metadata_synced_onchain = FALSE)
-- ORDER BY token_id;
