# 🔧 Fix Weapon Images Database RLS

## Problem

Weapon image storage fails with error: **"Failed to store in database"**

This is caused by **Row Level Security (RLS)** policies blocking database writes to the `weapon_images` table.

---

## 🎯 Quick Fix (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### Step 2: Create weapon_images Table (if not exists)

Run this SQL first to ensure the table exists:

```sql
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
```

### Step 3: Disable RLS (Fast Solution)

```sql
-- Disable RLS on weapon_images table
ALTER TABLE weapon_images DISABLE ROW LEVEL SECURITY;
```

Click **"Run"** → Done! ✅

---

## 🔒 Production Fix (More Secure)

If you want to keep RLS enabled but allow service role access:

```sql
-- Enable RLS
ALTER TABLE weapon_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Service role full access" ON weapon_images;
DROP POLICY IF EXISTS "Public can view weapon images" ON weapon_images;

-- Create new policies
CREATE POLICY "Service role full access" ON weapon_images
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view weapon images" ON weapon_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert" ON weapon_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 🧪 Test Database Access

After applying the fix, test with a manual insert:

```sql
-- Try manual insert
INSERT INTO weapon_images (
  weapon_class,
  rarity,
  image_url,
  ipfs_uri,
  metadata_url,
  metadata_ipfs_uri,
  image_cid,
  metadata_cid
) VALUES (
  0,
  0,
  'https://test.com/image.png',
  'ipfs://test123',
  'https://test.com/metadata.json',
  'ipfs://meta123',
  'test123',
  'meta123'
);

-- Check if it was inserted
SELECT * FROM weapon_images WHERE weapon_class = 0 AND rarity = 0;

-- Clean up test data
DELETE FROM weapon_images WHERE weapon_class = 0 AND rarity = 0 AND image_cid = 'test123';
```

If this works → Database is fixed! ✅  
If this fails → Check error message for more details

---

## 🔍 Check Current RLS Status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'weapon_images';
```

**Result:**
- `rowsecurity = true` → RLS is enabled
- `rowsecurity = false` → RLS is disabled

To see current policies:

```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'weapon_images';
```

---

## 📋 Complete Setup Script

Run this complete script to set up everything:

```sql
-- 1. Create table (if not exists)
CREATE TABLE IF NOT EXISTS weapon_images (
  id BIGSERIAL PRIMARY KEY,
  weapon_class INTEGER NOT NULL CHECK (weapon_class BETWEEN 0 AND 19),
  rarity INTEGER NOT NULL CHECK (rarity BETWEEN 0 AND 3),
  image_url TEXT NOT NULL,
  ipfs_uri TEXT NOT NULL,
  image_cid TEXT,
  metadata_url TEXT NOT NULL,
  metadata_ipfs_uri TEXT NOT NULL,
  metadata_cid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (weapon_class, rarity)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_weapon_images_weapon_class ON weapon_images(weapon_class);
CREATE INDEX IF NOT EXISTS idx_weapon_images_rarity ON weapon_images(rarity);
CREATE INDEX IF NOT EXISTS idx_weapon_images_weapon_class_rarity ON weapon_images(weapon_class, rarity);

-- 3. Disable RLS (simplest solution)
ALTER TABLE weapon_images DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT ALL ON weapon_images TO postgres;
GRANT ALL ON weapon_images_id_seq TO postgres;

-- 5. Test insert
INSERT INTO weapon_images (
  weapon_class, rarity,
  image_url, ipfs_uri,
  metadata_url, metadata_ipfs_uri
) VALUES (
  99, 99,
  'https://test.com/test.png', 'ipfs://test',
  'https://test.com/test.json', 'ipfs://test-meta'
) ON CONFLICT (weapon_class, rarity) DO NOTHING;

-- 6. Verify and clean up
SELECT * FROM weapon_images WHERE weapon_class = 99;
DELETE FROM weapon_images WHERE weapon_class = 99;

-- If above works, you're all set! ✅
```

---

## 🚀 After Fix

1. Run the SQL script above in Supabase
2. Try generating weapon images again from the admin panel
3. Images should now store successfully! ✅

---

## 💡 Why This Happens

**Row Level Security (RLS)** blocks all database access by default unless you create specific policies or disable it.

For this app, **disabling RLS is fine** because:
- Service role key is kept secret on the server
- Only your API routes can access the database
- No direct client-side database access

---

## 📞 Still Having Issues?

If the error persists after running the script, check:

1. **Environment variables** are set correctly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Supabase dashboard logs** for detailed error messages

3. **Browser console** for client-side errors
