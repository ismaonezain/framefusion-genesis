-- ===================================================
-- SYNC CHECKPOINTS TABLE
-- For saving NFT sync progress to resume from interruptions
-- ===================================================

-- Create sync_checkpoints table
CREATE TABLE IF NOT EXISTS public.sync_checkpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkpoint_type TEXT NOT NULL,
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookup by checkpoint_type
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_type 
ON public.sync_checkpoints(checkpoint_type);

-- Create index for faster lookup by created_at (for cache freshness check)
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_created_at 
ON public.sync_checkpoints(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.sync_checkpoints ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read checkpoints (for sync resume)
CREATE POLICY "Allow read access for everyone"
ON public.sync_checkpoints
FOR SELECT
USING (true);

-- Allow anyone to insert checkpoints (for saving progress)
CREATE POLICY "Allow insert for everyone"
ON public.sync_checkpoints
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update checkpoints (for updating progress)
CREATE POLICY "Allow update for everyone"
ON public.sync_checkpoints
FOR UPDATE
USING (true);

-- Allow anyone to delete old checkpoints (for cleanup)
CREATE POLICY "Allow delete for everyone"
ON public.sync_checkpoints
FOR DELETE
USING (true);

-- ===================================================
-- USAGE NOTES
-- ===================================================
-- This table stores sync progress/checkpoints so that long-running
-- sync operations (like reading all NFTs from blockchain) can be
-- resumed from where they left off if interrupted.
--
-- checkpoint_type: identifier for the sync operation (e.g., 'nft_sync_fids')
-- checkpoint_data: JSON data containing progress (e.g., array of FIDs)
-- created_at: when the checkpoint was first created
-- updated_at: when the checkpoint was last updated
--
-- Example usage:
-- 1. Save FIDs list: INSERT INTO sync_checkpoints (checkpoint_type, checkpoint_data) 
--    VALUES ('nft_sync_fids', '[1,2,3,4,5]'::jsonb);
-- 2. Load FIDs list: SELECT * FROM sync_checkpoints 
--    WHERE checkpoint_type = 'nft_sync_fids' 
--    ORDER BY created_at DESC LIMIT 1;
-- 3. Check cache age: Check if NOW() - created_at < INTERVAL '1 hour'
-- ===================================================
