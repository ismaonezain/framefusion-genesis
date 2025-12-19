# 🔧 Monster Database Error - Quick Fix Guide

## ❌ Problem: "Failed to save monster to database"

User sudah bayar 0.0001 ETH dan monster ke-mint, tapi gagal save ke database Supabase.

---

## 🎯 Root Cause: Missing SUPABASE_SERVICE_ROLE_KEY

Your API route (`/api/monsters/save`) needs **SERVICE ROLE KEY** to write to database, but it's not configured in environment variables.

**Check file: `src/app/api/monsters/save/route.ts` line 6:**
```typescript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

This environment variable is **NOT SET** ❌

---

## ✅ Solution 1: Set Service Role Key (RECOMMENDED)

### **Step 1: Get Your Service Role Key**

1. Open Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `udungttagaihejqszcfk`
3. Go to **Settings** → **API**
4. Find **"service_role" key** (NOT the anon key!)
5. Copy the key (starts with `eyJ...`)

### **Step 2: Add to Environment Variables**

#### **If using Vercel (Deployed app):**

1. Open Vercel dashboard
2. Go to your project
3. **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJ...` (your service role key)
   - **Environment**: Production, Preview, Development
5. Click **Save**
6. **Redeploy** your app

#### **If testing locally:**

Create/update `.env.local` file in project root:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://udungttagaihejqszcfk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...YOUR_SERVICE_ROLE_KEY_HERE
```

**⚠️ IMPORTANT:** 
- Use `SUPABASE_SERVICE_ROLE_KEY` (NOT `NEXT_PUBLIC_...`)
- Service role key should NEVER be exposed to client
- Restart dev server after adding

---

## ✅ Solution 2: Disable RLS (Quick Test Only)

If you just want to test quickly, disable Row Level Security:

### **Run in Supabase SQL Editor:**

```sql
-- Disable RLS on monsters table
ALTER TABLE monsters DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** This makes your table publicly writable! Only use for testing.

---

## ✅ Solution 3: Proper RLS Policies (Production)

For production, keep RLS enabled and configure policies:

### **Run in Supabase SQL Editor:**

```sql
-- Enable RLS
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can do anything
CREATE POLICY "service_role_all_access"
ON monsters
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 2: Anyone can view monsters
CREATE POLICY "public_read_monsters"
ON monsters
FOR SELECT
USING (true);

-- Policy 3: Authenticated users can insert
CREATE POLICY "authenticated_insert_monsters"
ON monsters
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

---

## 🔍 How to Verify Fix

### **Test 1: Check Environment Variable**

Create test API route: `src/app/api/test-env/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({ 
    hasServiceKey: hasKey,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  });
}
```

Visit: `https://your-app.com/api/test-env`

Should return:
```json
{
  "hasServiceKey": true,
  "keyLength": 200+ 
}
```

### **Test 2: Try Minting Again**

After setting the service key:
1. Redeploy app (if on Vercel)
2. Try minting monster again
3. Check browser console for detailed logs
4. Should see: `[Monsters API] Monster saved successfully`

---

## 📊 Troubleshooting Checklist

- [ ] Service role key added to Vercel environment variables
- [ ] App redeployed after adding env variable
- [ ] Key starts with `eyJ` (JWT format)
- [ ] Key is at least 150+ characters
- [ ] Using `SUPABASE_SERVICE_ROLE_KEY` not `NEXT_PUBLIC_...`
- [ ] Table `monsters` exists in Supabase
- [ ] Columns match schema in `FRAMESHADOWS_SCHEMA.sql`

---

## 🎉 Expected Result After Fix

```
1. User clicks "Mint Monster" (0.0001 ETH)
2. Transaction confirms ✅
3. Monster saves to database ✅
4. Message: "Monster saved! Now generating artwork..." ✅
5. FluxPro generates anime image ✅
6. Monster appears in Monsters tab ✅
```

---

## 🆘 Still Not Working?

Check browser console logs:
```
[Monster Generator] Saving monster to database: monster-xxxxx
[Monsters API] Saving monster: { ... }
[Monsters API] Supabase error: { ... }  // ← Look for error details here
```

Copy the error message and check:
- Error code `42501` = Permission denied → Check RLS policies
- Error code `23505` = Duplicate key → Monster already exists
- Error code `23503` = Foreign key error → Check table relations
- "Internal server error" = Service key not set → Add env variable

---

## 💡 Quick Summary

**Most likely issue:** Service role key not set in Vercel environment variables.

**Fastest fix:** 
1. Get service role key from Supabase dashboard
2. Add to Vercel env variables as `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy
4. Mint again → Should work! ✅
