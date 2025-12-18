# 🔧 Fix Database RLS Policies for Monster Minting

## Problem

Monster minting fails with error: **"Failed to save monster to database"**

This is most likely caused by **Row Level Security (RLS)** policies blocking database writes.

---

## 🎯 Quick Fix (Recommended for Testing)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/udungttagaihejqszcfk
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**

### Step 2: Disable RLS (Fast Solution)

Copy and paste this SQL:

```sql
-- Disable RLS on monsters table
ALTER TABLE monsters DISABLE ROW LEVEL SECURITY;
```

Click **"Run"** → Done! ✅

This will allow all operations on the `monsters` table without restrictions.

---

## 🔒 Production Fix (More Secure)

If you want to keep RLS enabled but allow service role access:

```sql
-- Enable RLS
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Service role full access" ON monsters;
DROP POLICY IF EXISTS "Public can view monsters" ON monsters;

-- Create new policies
CREATE POLICY "Service role full access" ON monsters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view monsters" ON monsters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert" ON monsters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 🧪 Test Database Access

After applying the fix, test if database writes work:

### Option 1: Via App Test Endpoint

Visit: `https://your-app.com/api/monsters/test-insert`

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ All database tests passed!",
  "tests": {
    "table_exists": true,
    "can_insert": true,
    "can_delete": true
  }
}
```

### Option 2: Via Supabase SQL Editor

```sql
-- Try manual insert
INSERT INTO monsters (
  id,
  monster_id,
  name,
  monster_type,
  element,
  rarity,
  level,
  power_level,
  image_url,
  metadata_uri,
  minted,
  is_wild,
  defeated_count
) VALUES (
  'test-123',
  123456789,
  'Test Monster',
  'Shadow Reaper',
  'Dark',
  'Common',
  1,
  100,
  'https://placeholder.com/test.png',
  'https://test.com/metadata/123',
  true,
  false,
  0
);

-- Check if it was inserted
SELECT * FROM monsters WHERE id = 'test-123';

-- Clean up
DELETE FROM monsters WHERE id = 'test-123';
```

If this works → Database is fine, problem is in code  
If this fails → Database has permission issues

---

## 🔍 Check Current RLS Status

To see if RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'monsters';
```

**Result:**
- `rowsecurity = true` → RLS is enabled
- `rowsecurity = false` → RLS is disabled

To see current policies:

```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'monsters';
```

---

## 📋 Troubleshooting Checklist

- [ ] RLS is disabled OR proper policies are set
- [ ] Service role key is correct in code
- [ ] Table `monsters` exists with correct schema
- [ ] Test insert via `/api/monsters/test-insert` works
- [ ] Manual SQL insert works in Supabase SQL Editor

---

## 🚀 After Fix

1. Run the SQL to disable RLS (or set policies)
2. Visit `/api/monsters/test-insert` to verify
3. Try minting monster again
4. Try backfill again
5. Should work! ✅

---

## 💡 Why This Happens

**Row Level Security (RLS)** is Supabase's way of controlling who can read/write data.

By default, RLS blocks all access unless you create specific policies.

When using **service role key**, you can either:
1. **Disable RLS** → Service role bypasses all checks
2. **Create policies** → Explicitly allow service role access

For this app, **disabling RLS is fine** because:
- Service role key is kept secret server-side
- Only your API routes can access the database
- No direct client-side database access

---

## 📞 Need Help?

If still not working after these fixes, check:
1. Browser console for detailed error messages
2. Vercel logs for server-side errors
3. Supabase logs in dashboard

The error will now show specific details like:
- Error code (e.g., `42501` = permission denied)
- Error message
- Hints from Supabase
