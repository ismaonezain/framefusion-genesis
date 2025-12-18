# FrameShadows Monster NFT - Troubleshooting Guide

## Common Database Errors & Solutions

### Error: "Failed to save monster to database"

This error occurs when the monster data cannot be saved to Supabase. Here are common causes and solutions:

---

### 1. **RLS (Row Level Security) Policies Not Configured**

**Symptoms:**
- Error message: "Database permission denied"
- Error code: `42501`
- Console shows: "permission denied for table monsters"

**Solution:**

Open Supabase SQL Editor and run:

```sql
-- Disable RLS for testing (or configure proper policies)
ALTER TABLE monsters DISABLE ROW LEVEL SECURITY;
ALTER TABLE monster_traits DISABLE ROW LEVEL SECURITY;
ALTER TABLE battle_history DISABLE ROW LEVEL SECURITY;

-- OR configure proper RLS policies:
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

-- Allow service role to do anything
CREATE POLICY "Service role can do anything" ON monsters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all monsters
CREATE POLICY "Anyone can view monsters" ON monsters
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert monsters
CREATE POLICY "Authenticated users can insert monsters" ON monsters
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
```

---

### 2. **Foreign Key Constraint Violation**

**Symptoms:**
- Error message: "Foreign key constraint violation"
- Error code: `23503`
- References table that doesn't exist or missing data

**Solution:**

The `battle_history` table has a foreign key to `nfts(fid)`. This is optional for monsters.

Option A - Remove the constraint:
```sql
ALTER TABLE battle_history
DROP CONSTRAINT IF EXISTS battle_history_character_fid_fkey;
```

Option B - Make it nullable:
```sql
ALTER TABLE battle_history
ALTER COLUMN character_fid DROP NOT NULL;
```

---

### 3. **Missing Supabase Environment Variables**

**Symptoms:**
- Error: "Supabase credentials not configured"
- 500 Internal Server Error

**Solution:**

Check your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Use the **SERVICE ROLE KEY**, not the anon key!

---

### 4. **Table Doesn't Exist**

**Symptoms:**
- Error: "relation 'monsters' does not exist"
- 42P01 error code

**Solution:**

Run the schema SQL file in Supabase:
```sql
-- Copy and paste from src/contracts/FRAMESHADOWS_SCHEMA.sql
-- Run in Supabase SQL Editor
```

---

### 5. **Duplicate Primary Key**

**Symptoms:**
- Error: "Monster already exists"
- Error code: `23505`
- Duplicate key value violates unique constraint

**Solution:**

This is expected behavior if trying to mint the same monster ID twice. The system should generate unique IDs automatically.

If this happens frequently, check:
- Monster ID generation logic uses unique seeds
- No concurrent minting of same ID

---

## Debugging Steps

### Step 1: Check Supabase Connection

```typescript
// Test in browser console
const testSupabase = async () => {
  const response = await fetch('/api/monsters/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-123',
      monster_id: 999999,
      name: 'Test Monster',
      monster_type: 'Common Shadow Demon',
      element: 'Dark',
      rarity: 'Common',
      level: 1,
      power_level: 100,
      image_url: 'https://placehold.co/512',
      ipfs_uri: '',
      metadata_uri: '',
      is_wild: true,
      created_at: new Date().toISOString(),
    }),
  });
  
  const result = await response.json();
  console.log('Result:', result);
};

testSupabase();
```

### Step 2: Check Database Table Structure

In Supabase Dashboard → Table Editor:
1. Verify `monsters` table exists
2. Check all columns match schema
3. Verify RLS policies are disabled or configured

### Step 3: Check Server Logs

In Vercel/your deployment:
1. Open Functions logs
2. Look for `[Monsters API]` logs
3. Check for Supabase error details

### Step 4: Test Direct Supabase Insert

In Supabase SQL Editor:
```sql
INSERT INTO monsters (
  id, monster_id, name, monster_type, element, rarity, 
  level, power_level, image_url, ipfs_uri, metadata_uri, 
  minted, is_wild, defeated_count
) VALUES (
  'test-manual-001',
  999998,
  'Test Monster',
  'Common Shadow Demon',
  'Dark',
  'Common',
  1,
  100,
  'https://placehold.co/512',
  '',
  '',
  false,
  true,
  0
);
```

If this works, the problem is in the API/code.
If this fails, the problem is in database schema/permissions.

---

## Quick Fix Checklist

- [ ] Supabase environment variables configured
- [ ] Using SERVICE ROLE KEY (not anon key)
- [ ] `monsters` table exists
- [ ] RLS policies disabled or properly configured
- [ ] No foreign key constraint issues
- [ ] Browser console shows detailed error message

---

## Getting Detailed Error Messages

After the recent update, you should now see detailed error messages in:

1. **Browser Console** - Full error details with error codes
2. **Server Logs** - Supabase error codes and hints
3. **UI Alert** - User-friendly error message

Example error messages you might see:
- "Failed to save monster to database: Database permission denied"
- "Failed to save monster to database: Foreign key constraint violation"
- "Failed to save monster to database: Monster already exists"

---

## Still Having Issues?

1. Check browser console for `[Monster Generator]` logs
2. Check server logs for `[Monsters API]` logs
3. Verify Supabase credentials are correct
4. Test direct database insert via SQL editor
5. Disable RLS temporarily to test if it's a permissions issue

---

## Contact Support

If you've tried all solutions above and still having issues, provide:
1. Full error message from browser console
2. Supabase error code
3. Screenshot of Supabase table structure
4. Environment variable configuration (redacted)
