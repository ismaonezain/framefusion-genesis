-- Add weapon_name column to weapon_images table
-- Run this in your Supabase SQL Editor

-- Add weapon_name column
ALTER TABLE weapon_images
ADD COLUMN IF NOT EXISTS weapon_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weapon_images_weapon_name 
ON weapon_images(weapon_name);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'weapon_images'
ORDER BY ordinal_position;
