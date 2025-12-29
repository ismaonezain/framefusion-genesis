# 📦 Supabase Setup Guide for FrameFusion Genesis

Follow these steps to set up your Supabase database for the NFT collection app.

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `FrameFusion Genesis` (or any name you like)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** and wait ~2 minutes

---

## Step 2: Create Database Table

1. In your Supabase project dashboard, go to **"Table Editor"** (left sidebar)
2. Click **"Create a new table"**
3. Use these settings:

### Table Configuration:
- **Name**: `nfts`
- **Description**: NFT collection records
- **Enable Row Level Security (RLS)**: ❌ **DISABLED** (uncheck this for now)

### Columns:

| Column Name | Type | Default Value | Primary | Nullable | Unique |
|------------|------|---------------|---------|----------|--------|
| `id` | `text` | - | ✅ Yes | ❌ No | ✅ Yes |
| `fid` | `int8` | - | ❌ No | ❌ No | ✅ Yes |
| `name` | `text` | - | ❌ No | ❌ No | ❌ No |
| `image_url` | `text` | - | ❌ No | ❌ No | ❌ No |
| `ipfs_uri` | `text` | - | ❌ No | ❌ No | ❌ No |
| `ipfs_gateway` | `text` | - | ❌ No | ❌ No | ❌ No |
| `metadata_uri` | `text` | - | ❌ No | ❌ No | ❌ No |
| `minted` | `bool` | `false` | ❌ No | ❌ No | ❌ No |
| `contract_address` | `text` | `NULL` | ❌ No | ✅ Yes | ❌ No |
| `token_id` | `text` | `NULL` | ❌ No | ✅ Yes | ❌ No |
| `created_at` | `timestamptz` | `now()` | ❌ No | ❌ No | ❌ No |

4. Click **"Save"** to create the table

---

## Step 3: SQL Schema (Alternative Method)

If you prefer SQL, go to **"SQL Editor"** and run this:

```sql
-- Create NFTs table
CREATE TABLE nfts (
  id TEXT PRIMARY KEY,
  fid BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  ipfs_uri TEXT NOT NULL,
  ipfs_gateway TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  minted BOOLEAN DEFAULT false NOT NULL,
  contract_address TEXT,
  token_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster FID lookups
CREATE INDEX idx_nfts_fid ON nfts(fid);

-- Create index for created_at for stats queries
CREATE INDEX idx_nfts_created_at ON nfts(created_at DESC);
```

---

## Step 4: Get Your API Credentials

1. Go to **"Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys**:
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Copy both keys** - you'll need them!

---

## Step 5: Update Your App Code

1. Open `src/lib/supabase.ts` in your project
2. Replace the placeholder values:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'; // 👈 Paste your Project URL
const supabaseAnonKey = 'YOUR_ANON_KEY'; // 👈 Paste your anon/public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Example:**
```typescript
const supabaseUrl = 'https://abcdefghijk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQwMDAwMDAsImV4cCI6MTg1MTg1MDAwMH0.xxx';
```

---

## Step 6: Test Your Setup

1. Save your changes to `supabase.ts`
2. Deploy or test your app
3. Try generating an NFT
4. Go back to Supabase **"Table Editor"** → **nfts** table
5. You should see a new row with your NFT data! ✅

---

## 🔒 Security Notes

- **RLS is disabled** for simplicity. For production, enable Row Level Security with proper policies.
- **Never commit** your `service_role` key to Git (we're using `anon` key only).
- The `anon` key is safe to expose client-side.

---

## 📊 What Data Gets Stored?

Each time someone generates an NFT, this data is saved:

- `id`: Unique identifier (FID + timestamp)
- `fid`: Farcaster ID of the user
- `name`: NFT name (e.g., "FrameFusion Genesis #12345")
- `image_url`: Generated AI art URL (from Pinata IPFS)
- `ipfs_uri`: IPFS URI (e.g., `ipfs://Qm...`)
- `ipfs_gateway`: IPFS gateway URL for viewing
- `metadata_uri`: NFT metadata JSON on IPFS
- `minted`: Whether the NFT has been minted on-chain (boolean)
- `contract_address`: Contract address (after minting)
- `token_id`: Token ID (after minting)
- `created_at`: Timestamp of creation

---

## ✅ You're Done!

Your Supabase database is now ready to store FrameFusion Genesis NFTs! 🎉

**Next Step**: Deploy your smart contract (see CONTRACT-DEPLOY.md)
