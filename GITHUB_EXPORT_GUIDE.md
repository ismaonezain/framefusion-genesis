# 📦 FrameFusion Genesis - Complete Export Guide

> **Complete codebase export untuk GitHub repository**
> Last updated: 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Quick Setup](#quick-setup)
4. [Environment Variables](#environment-variables)
5. [Project Structure](#project-structure)
6. [Key Features](#key-features)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [Smart Contracts](#smart-contracts)
10. [Deployment](#deployment)

---

## 🎯 Project Overview

**FrameFusion Genesis** adalah Farcaster Mini App untuk:
- ✅ Generate & mint AI art NFTs (max 3000)
- ✅ Daily check-in system dengan $TRIA rewards
- ✅ Leaderboard dengan user caching
- ✅ Notification system via Neynar API
- ✅ NFT metadata sync dari on-chain
- ✅ Contract funding management

---

## 🛠 Tech Stack

### **Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui components
- Farcaster Mini App SDK
- OnchainKit (Coinbase)

### **Backend:**
- Supabase (PostgreSQL database)
- Neynar API (notifications, user data)
- Viem (blockchain interaction)
- Wagmi (wallet connection)

### **Blockchain:**
- Base Network (Chain ID: 8453)
- NFT Contract V2: `0xD308c4734D9460717485040D07B7dE7e44718A11`
- TRIA Rewards Contract
- TRIA Token: Base ERC20

### **Storage:**
- Lighthouse Storage (IPFS)
- Vercel Blob Storage (images)

---

## ⚡ Quick Setup

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/framefusion-genesis.git
cd framefusion-genesis
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Variables**
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://udungttagaihejqszcfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Neynar API
NEYNAR_API_KEY=your_neynar_api_key

# Blockchain
NEXT_PUBLIC_CHAIN_ID=8453
CONTRACT_ADDRESS_V2=0xD308c4734D9460717485040D07B7dE7e44718A11

# Optional
ALCHEMY_API_KEY=your_alchemy_key
```

### **4. Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (admin) |
| `NEYNAR_API_KEY` | ✅ | Neynar API key untuk notifications |
| `NEXT_PUBLIC_CHAIN_ID` | ✅ | Blockchain chain ID (8453 = Base) |
| `CONTRACT_ADDRESS_V2` | ⚠️ | NFT contract address |
| `ALCHEMY_API_KEY` | ⚠️ | Alchemy RPC key (optional) |

---

## 📁 Project Structure

```
framefusion-genesis/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── admin/                # Admin endpoints
│   │   │   │   ├── sync-nfts/        # NFT sync from contract
│   │   │   │   ├── update-metadata/  # Metadata updater
│   │   │   │   └── ...
│   │   │   ├── checkin/              # Daily check-in
│   │   │   ├── claim/                # TRIA rewards claim
│   │   │   ├── leaderboard/          # Leaderboard data
│   │   │   ├── nft/                  # NFT CRUD operations
│   │   │   ├── notifications/        # Neynar notifications
│   │   │   │   ├── neynar-send/      # Send notifications
│   │   │   │   ├── neynar-tokens/    # Get notification tokens
│   │   │   │   └── ...
│   │   │   ├── users/                # User sync & cache
│   │   │   └── proxy/                # External API proxy
│   │   ├── layout.tsx                # Root layout (Farcaster metadata)
│   │   ├── page.tsx                  # Main app page
│   │   ├── globals.css               # Global styles
│   │   └── providers.tsx             # React providers
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components (50+ files)
│   │   ├── admin-panel.tsx           # Admin dashboard
│   │   ├── checkin-panel.tsx         # Check-in UI
│   │   ├── nft-generator.tsx         # NFT generation flow
│   │   ├── nft-display.tsx           # NFT viewer
│   │   ├── collection-stats.tsx      # Collection statistics
│   │   ├── notifications-admin-neynar.tsx  # Notifications admin
│   │   └── ...
│   │
│   ├── lib/                          # Core libraries
│   │   ├── supabase.ts               # Supabase client
│   │   ├── neynar.ts                 # Neynar API functions
│   │   ├── wagmi.ts                  # Wagmi configuration
│   │   ├── nft-contract.ts           # NFT contract utilities
│   │   ├── nft-contract-v2.ts        # V2 contract
│   │   ├── nft-contract-v3.ts        # V3 contract (migration)
│   │   ├── tria-rewards-contract.ts  # Rewards contract
│   │   ├── nft-generator.ts          # NFT prompt generation
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAddMiniApp.ts          # Add mini app to Farcaster
│   │   ├── useQuickAuth.tsx          # Quick authentication
│   │   ├── useIsInFarcaster.ts       # Detect Farcaster context
│   │   ├── useAutoConnectWallet.ts   # Auto wallet connection
│   │   └── ...
│   │
│   └── contracts/                    # Smart contract files
│       ├── FrameFusionGenesisV3.sol  # V3 NFT contract
│       ├── SUPABASE_SCHEMA.sql       # Database schema
│       ├── DEPLOYMENT.md             # Contract deployment guide
│       └── V3_MIGRATION_GUIDE.md     # Migration documentation
│
├── public/                           # Static assets
│   └── .well-known/
│       └── farcaster.json            # Farcaster manifest
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
└── README.md                         # Project README
```

---

## ✨ Key Features

### **1. NFT Generation & Minting**
- AI-generated art using FluxPro API
- Upload to IPFS via Lighthouse Storage
- On-chain minting to Base network
- 1 FID = 1 NFT (max 3000 supply)
- Follow @ismaone required to mint

**Files:**
- `src/components/nft-generator.tsx`
- `src/lib/nft-generator.ts`
- `src/fluxpro-api.ts`
- `src/lighthouse-storage.ts`

### **2. Daily Check-in & Rewards**
- Daily check-in system (24h cooldown)
- 50k $TRIA reward per check-in
- Streak tracking (on-chain + database)
- Claim rewards via smart contract

**Files:**
- `src/components/checkin-panel.tsx`
- `src/app/api/checkin/route.ts`
- `src/app/api/claim/route.ts`
- `src/lib/tria-rewards-contract.ts`

### **3. Notification System**
- Powered by Neynar API
- Send to all users or specific FIDs
- Advanced filters (following, score, location)
- Notification templates
- No database storage needed (Neynar handles tokens)

**Files:**
- `src/components/notifications-admin-neynar.tsx`
- `src/app/api/notifications/neynar-send/route.ts`
- `src/lib/neynar.ts`

### **4. Admin Panel**
- Contract funding management (deposit/withdraw TRIA)
- NFT metadata updater
- Sync NFTs from blockchain to database
- Check missing tokens
- Checkpoint-based resume system
- User cache sync

**Files:**
- `src/components/admin-panel.tsx`
- `src/app/api/admin/sync-nfts/route.ts`
- `src/app/api/admin/update-metadata/route.ts`
- `src/app/api/admin/check-missing-tokens/route.ts`

### **5. User Caching System**
- Cache user data from Neynar API
- Reduce API calls
- Fast leaderboard loading
- Manual sync option

**Files:**
- `src/lib/user-cache.ts`
- `src/app/api/users/sync/route.ts`
- `src/app/api/users/sync-from-nfts/route.ts`

### **6. Leaderboard**
- Streak-based rankings
- Claims-based rankings
- Real usernames & profile pictures
- Cached for performance

**Files:**
- `src/components/leaderboard.tsx` (if exists)
- `src/app/api/leaderboard/route.ts`
- `src/app/api/leaderboard-streaks/route.ts`

---

## 🗄️ Database Schema

### **Supabase Tables:**

#### **`nfts` table**
```sql
CREATE TABLE nfts (
  id TEXT PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  ipfs_uri TEXT NOT NULL,
  ipfs_gateway TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  token_id TEXT,
  contract_address TEXT,
  owner_address TEXT,
  minted BOOLEAN DEFAULT FALSE,
  migrated_to_v3 BOOLEAN DEFAULT FALSE,
  v3_token_id TEXT,
  v3_tx_hash TEXT,
  migrated_at TIMESTAMP,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- V3 Traits
  character_class TEXT,
  gender TEXT,
  background TEXT,
  color_palette TEXT,
  clothing TEXT,
  accessories TEXT,
  items TEXT
);
```

#### **`checkins` table**
```sql
CREATE TABLE checkins (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  streak INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(fid, check_in_date)
);
```

#### **`claims` table**
```sql
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  tx_hash TEXT,
  claimed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **`users` (cache table)**
```sql
CREATE TABLE users (
  fid INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  pfp_url TEXT,
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  cached_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **`sync_checkpoints` table**
```sql
CREATE TABLE sync_checkpoints (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  last_token_id INTEGER,
  last_processed INTEGER,
  status TEXT DEFAULT 'idle',
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

**Full schema:** See `src/contracts/SUPABASE_SCHEMA.sql`

---

## 🔌 API Routes

### **NFT Operations**
- `POST /api/nft/save` - Save NFT to database
- `GET /api/nft/check?fid=123` - Check if user has NFT
- `GET /api/nft/metadata/[fid]` - Get NFT metadata
- `POST /api/nft/update-mint` - Update mint status
- `GET /api/nft/stats` - Collection statistics

### **Check-in & Rewards**
- `POST /api/checkin` - Daily check-in
- `GET /api/checkin?fid=123` - Check-in status
- `POST /api/claim` - Claim TRIA rewards
- `GET /api/leaderboard?type=streak` - Leaderboard data
- `GET /api/leaderboard-streaks` - Streak leaderboard

### **Admin Operations**
- `POST /api/admin/sync-nfts` - Sync NFTs from blockchain (streaming)
- `GET /api/admin/sync-nfts/checkpoint` - Get last checkpoint
- `POST /api/admin/sync-nfts/checkpoint` - Update checkpoint
- `POST /api/admin/update-metadata` - Update NFT metadata
- `GET /api/admin/check-missing-tokens` - Find missing tokens
- `POST /api/admin/populate-traits` - Populate V3 traits

### **Notifications (Neynar)**
- `POST /api/notifications/neynar-send` - Send notification
- `GET /api/notifications/neynar-tokens` - Get enabled tokens
- `GET /api/notifications/signer-info` - Get signer info (deprecated for Mini Apps)

### **User Management**
- `POST /api/users/sync` - Sync specific users
- `POST /api/users/sync-from-nfts` - Sync all users from NFTs table

### **Utilities**
- `POST /api/proxy` - External API proxy
- `GET /api/health` - Health check
- `POST /api/logger` - Client-side logging
- `GET /api/check-follow?fid=123` - Check follow status
- `POST /api/analyze-pfp` - Analyze profile picture

---

## 🔗 Smart Contracts

### **NFT Contract V2 (Current)**
- **Address:** `0xD308c4734D9460717485040D07B7dE7e44718A11`
- **Network:** Base Mainnet
- **Functions:**
  - `mint(to, tokenURI)` - Mint new NFT
  - `tokenURI(tokenId)` - Get metadata URI
  - `ownerOf(tokenId)` - Get NFT owner
  - `totalSupply()` - Get total minted

### **NFT Contract V3 (Migration)**
- **Features:**
  - Dynamic metadata via API
  - V2 to V3 migration
  - Traits system
  - Multiple NFTs per user (via secondary market)
- **Deployment:** See `src/contracts/DEPLOYMENT.md`
- **Migration Guide:** See `src/contracts/V3_MIGRATION_GUIDE.md`

### **TRIA Rewards Contract**
- **Functions:**
  - `depositTokens(amount)` - Fund contract
  - `withdrawTokens(amount)` - Withdraw funds
  - `claimReward(fid, amount)` - User claims reward
  - `getUserStreak(address)` - Get on-chain streak
  - `getContractBalance()` - Check contract balance

**Contract ABIs:** See `src/lib/tria-rewards-contract.ts`

---

## 🚀 Deployment

### **1. Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### **2. Environment Variables (Vercel)**
Add all variables from `.env.local` to Vercel dashboard:
- Project Settings → Environment Variables
- Add all `NEXT_PUBLIC_*` and private variables

### **3. Update Farcaster Manifest**
Update `public/.well-known/farcaster.json` with production URL:
```json
{
  "frame": {
    "version": "1",
    "name": "FrameFusion Genesis",
    "homeUrl": "https://your-production-url.vercel.app",
    "imageUrl": "https://your-production-url.vercel.app/og-image.png"
  }
}
```

### **4. Supabase Setup**
1. Create project at [supabase.com](https://supabase.com)
2. Run SQL schema from `src/contracts/SUPABASE_SCHEMA.sql`
3. Enable RLS policies if needed
4. Copy connection strings to `.env.local`

### **5. Neynar Setup**
1. Sign up at [dev.neynar.com](https://dev.neynar.com)
2. Create app
3. Copy API key to `NEYNAR_API_KEY`
4. Configure webhook URL (optional)

---

## 📚 Additional Documentation

### **Important Files to Read:**
- `src/contracts/DEPLOYMENT.md` - Contract deployment guide
- `src/contracts/V3_MIGRATION_GUIDE.md` - V3 migration documentation
- `src/contracts/SUPABASE_SCHEMA.sql` - Complete database schema
- `src/lib/neynar.ts` - Neynar API documentation

### **Key Components:**
All UI components in `src/components/ui/` are from [shadcn/ui](https://ui.shadcn.com/).
If any component is missing, regenerate using:
```bash
npx shadcn@latest add [component-name]
```

### **Dependencies:**
See `package.json` for complete list. Key dependencies:
- `@farcaster/miniapp-sdk` - Farcaster Mini App
- `@coinbase/onchainkit` - OnchainKit wallet
- `@supabase/supabase-js` - Supabase client
- `@neynar/nodejs-sdk` - Neynar API (if used)
- `viem` - Ethereum interactions
- `wagmi` - React hooks for Ethereum
- `next` - Next.js framework
- `react` - React library
- `tailwindcss` - Styling

---

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. Notification 0 sent, 0 failed**
- Users need to enable notifications first
- Check Neynar API key is correct
- Use `following_fid` filter to target specific audience

#### **2. NFT Sync Failing**
- Check contract address is correct
- Ensure Alchemy/RPC endpoint is working
- Verify checkpoint table exists
- Check batch size (default 100)

#### **3. Check-in Not Working**
- Verify user has minted NFT
- Check 24h cooldown
- Ensure rewards contract has TRIA balance
- Verify wallet address in database

#### **4. Build Errors**
- Run `npm install` to ensure all deps installed
- Check TypeScript errors with `npm run build`
- Verify all environment variables are set

---

## 📝 Notes

- **Admin Key:** `rahasia123` (change in production!)
- **Owner FID:** `235940` (ismaone) - bypasses follow check
- **Max NFT Supply:** 3000
- **Daily TRIA Reward:** 50,000 per check-in
- **Notification Limits:** Check Neynar API docs

---

## 🔒 Security Considerations

1. **Change admin keys** in production
2. **Enable RLS** on Supabase tables
3. **Rate limit** API endpoints
4. **Verify transactions** before updating DB
5. **Validate user inputs** on all endpoints
6. **Use environment variables** for sensitive data
7. **Enable CORS** only for trusted domains

---

## 🎉 Credits

- Built by [@ismaone](https://warpcast.com/ismaone)
- Powered by [Farcaster](https://www.farcaster.xyz/), [Base](https://base.org/), [Neynar](https://neynar.com/)
- AI Art by FluxPro
- Storage by Lighthouse IPFS

---

## 📞 Support

- **Warpcast:** [@ismaone](https://warpcast.com/ismaone)
- **GitHub Issues:** Create an issue in this repository
- **Farcaster:** Message on Warpcast

---

**Happy Building! 🚀**
