# 🚀 Quick Export to GitHub - Step by Step

## 📋 Super Simple Steps to Copy This Project to GitHub

### **Option 1: Via UI (Easiest)**

1. **Download Code:**
   - Klik tab **"Configure"** di Ohara UI
   - View & copy semua files manual
   - Save to local folder

2. **Create GitHub Repo:**
   ```bash
   # Di local folder kamu
   git init
   git add .
   git commit -m "Initial commit: FrameFusion Genesis"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/framefusion-genesis.git
   git push -u origin main
   ```

---

### **Option 2: File List for Manual Copy-Paste**

Copy these files one by one dari Configure tab ke GitHub:

#### **📁 Root Files**
- ✅ `package.json`
- ✅ `tsconfig.json`  
- ✅ `next.config.js` (atau `next.config.mjs`)
- ✅ `tailwind.config.ts`
- ✅ `postcss.config.js`
- ✅ `.gitignore`
- ✅ `README.md`
- ✅ `GITHUB_EXPORT_GUIDE.md` (this file)

#### **📁 src/app/**
- ✅ `src/app/layout.tsx` ⭐ **IMPORTANT**
- ✅ `src/app/page.tsx` ⭐ **IMPORTANT**
- ✅ `src/app/globals.css`
- ✅ `src/app/providers.tsx`
- ✅ `src/app/config/onchainkit.ts`
- ✅ `src/app/types/api.ts`

#### **📁 src/app/api/** (40+ API routes)
Copy entire folder structure. Priority routes:

**Admin:**
- ✅ `src/app/api/admin/sync-nfts/route.ts`
- ✅ `src/app/api/admin/sync-nfts/checkpoint/route.ts`
- ✅ `src/app/api/admin/update-metadata/route.ts`
- ✅ `src/app/api/admin/check-missing-tokens/route.ts`
- ✅ `src/app/api/admin/populate-traits/route.ts`

**Core:**
- ✅ `src/app/api/checkin/route.ts`
- ✅ `src/app/api/claim/route.ts`
- ✅ `src/app/api/leaderboard/route.ts`
- ✅ `src/app/api/leaderboard-streaks/route.ts`

**NFT:**
- ✅ `src/app/api/nft/check/route.ts`
- ✅ `src/app/api/nft/save/route.ts`
- ✅ `src/app/api/nft/metadata/[fid]/route.ts`
- ✅ `src/app/api/nft/update-mint/route.ts`
- ✅ `src/app/api/nft/stats/route.ts`

**Notifications:**
- ✅ `src/app/api/notifications/neynar-send/route.ts` ⭐
- ✅ `src/app/api/notifications/neynar-tokens/route.ts` ⭐
- ✅ `src/app/api/notifications/register/route.ts`
- ✅ `src/app/api/notifications/send/route.ts`

**Users:**
- ✅ `src/app/api/users/sync/route.ts`
- ✅ `src/app/api/users/sync-from-nfts/route.ts`

**Utilities:**
- ✅ `src/app/api/proxy/route.ts` (DO NOT MODIFY)
- ✅ `src/app/api/health/route.ts`
- ✅ `src/app/api/check-follow/route.ts`
- ✅ `src/app/api/analyze-pfp/route.ts`
- ✅ `src/app/api/logger/route.ts`
- ✅ `src/app/api/webhook/route.ts`
- ✅ `src/app/api/me/route.ts`

#### **📁 src/components/**
**Main Components:** (Priority)
- ✅ `src/components/admin-panel.tsx` ⭐
- ✅ `src/components/nft-generator.tsx` ⭐
- ✅ `src/components/nft-display.tsx`
- ✅ `src/components/checkin-panel.tsx`
- ✅ `src/components/collection-stats.tsx`
- ✅ `src/components/notifications-admin-neynar.tsx` ⭐
- ✅ `src/components/notifications-admin.tsx`
- ✅ `src/components/migrate-nft-v3-button.tsx`
- ✅ `src/components/mint-nft-button.tsx`
- ✅ `src/components/mint-nft-button-v2.tsx`

**Farcaster Components:**
- ✅ `src/components/FarcasterWrapper.tsx`
- ✅ `src/components/FarcasterManifestSigner.tsx`
- ✅ `src/components/FarcasterToastManager.tsx`
- ✅ `src/components/ready-notifier.tsx`
- ✅ `src/components/response-logger.tsx`

**UI Components:** (50+ files from shadcn/ui)
- Copy entire `src/components/ui/` folder OR regenerate using:
  ```bash
  npx shadcn@latest add button card input label ...
  ```

#### **📁 src/lib/**
- ✅ `src/lib/supabase.ts` ⭐
- ✅ `src/lib/neynar.ts` ⭐
- ✅ `src/lib/wagmi.ts` ⭐
- ✅ `src/lib/utils.ts`
- ✅ `src/lib/nft-contract.ts`
- ✅ `src/lib/nft-contract-v2.ts`
- ✅ `src/lib/nft-contract-v3.ts`
- ✅ `src/lib/tria-contract.ts`
- ✅ `src/lib/tria-rewards-contract.ts`
- ✅ `src/lib/nft-generator.ts`
- ✅ `src/lib/prepare-nft-metadata.ts`
- ✅ `src/lib/user-cache.ts`
- ✅ `src/lib/logger.ts`
- ✅ `src/lib/color-extractor.ts`

#### **📁 src/hooks/**
- ✅ `src/hooks/useAddMiniApp.ts`
- ✅ `src/hooks/useAddMiniAppNeynar.ts`
- ✅ `src/hooks/useQuickAuth.tsx`
- ✅ `src/hooks/useIsInFarcaster.ts`
- ✅ `src/hooks/useAutoConnectWallet.ts`
- ✅ `src/hooks/useManifestStatus.ts`
- ✅ `src/hooks/usePlatformDetection.ts`
- ✅ `src/hooks/use-mobile.tsx`

#### **📁 src/contracts/**
- ✅ `src/contracts/FrameFusionGenesisV3.sol`
- ✅ `src/contracts/SUPABASE_SCHEMA.sql` ⭐
- ✅ `src/contracts/SUPABASE_SYNC_CHECKPOINTS.sql`
- ✅ `src/contracts/SUPABASE_USERS_CACHE.sql`
- ✅ `src/contracts/SUPABASE_V3_TRAITS_MIGRATION.sql`
- ✅ `src/contracts/DEPLOYMENT.md`
- ✅ `src/contracts/V3_MIGRATION_GUIDE.md`

#### **📁 src/utils/**
- ✅ `src/utils/manifestStatus.ts`

#### **📁 Root TypeScript Files**
- ✅ `src/fluxpro-api.ts`
- ✅ `src/lighthouse-storage.ts`
- ✅ `src/pinata-media-api.ts`
- ✅ `src/thirdweb-storage.ts`
- ✅ `src/middleware.ts`

#### **📁 public/**
- ✅ `public/.well-known/farcaster.json` ⭐ **IMPORTANT**
- ✅ `public/favicon.ico`
- ✅ Any images in `public/`

---

## 🎯 Priority Files (Must Have)

If kamu cuma punya waktu terbatas, copy files ini dulu:

### **Critical (Top 10):**
1. ✅ `src/app/layout.tsx`
2. ✅ `src/app/page.tsx`
3. ✅ `src/lib/supabase.ts`
4. ✅ `src/lib/neynar.ts`
5. ✅ `src/lib/wagmi.ts`
6. ✅ `src/components/admin-panel.tsx`
7. ✅ `src/components/notifications-admin-neynar.tsx`
8. ✅ `src/app/api/notifications/neynar-send/route.ts`
9. ✅ `src/contracts/SUPABASE_SCHEMA.sql`
10. ✅ `public/.well-known/farcaster.json`

### **Configuration (Top 5):**
1. ✅ `package.json`
2. ✅ `tsconfig.json`
3. ✅ `tailwind.config.ts`
4. ✅ `.env.local` (CREATE THIS - jangan commit ke GitHub!)
5. ✅ `.gitignore`

---

## 📦 Dependencies (package.json)

Pastikan `package.json` include dependencies ini:

```json
{
  "dependencies": {
    "@coinbase/onchainkit": "latest",
    "@farcaster/miniapp-sdk": "latest",
    "@farcaster/miniapp-wagmi-connector": "latest",
    "@farcaster/quick-auth": "latest",
    "@hookform/resolvers": "latest",
    "@neynar/react": "latest",
    "@radix-ui/*": "latest",
    "@supabase/supabase-js": "latest",
    "@tanstack/react-query": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "date-fns": "latest",
    "framer-motion": "latest",
    "lucide-react": "latest",
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "react-hook-form": "latest",
    "sonner": "latest",
    "tailwind-merge": "latest",
    "tailwindcss-animate": "latest",
    "viem": "latest",
    "wagmi": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  }
}
```

---

## 🔧 After Copy-Paste

### **1. Install Dependencies**
```bash
npm install
```

### **2. Setup Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEYNAR_API_KEY=your_neynar_key
NEXT_PUBLIC_CHAIN_ID=8453
```

### **3. Setup Supabase Database**
```bash
# Run SQL schema
psql -h your-db.supabase.co -U postgres < src/contracts/SUPABASE_SCHEMA.sql
```

Or paste SQL ke Supabase SQL Editor.

### **4. Test Locally**
```bash
npm run dev
```

Open http://localhost:3000

### **5. Deploy to Vercel**
```bash
vercel --prod
```

---

## 🔥 Quick Clone Command (Future Use)

Setelah kamu push ke GitHub, orang lain bisa clone dengan:

```bash
git clone https://github.com/YOUR_USERNAME/framefusion-genesis.git
cd framefusion-genesis
npm install
cp .env.example .env.local  # Edit dengan credentials
npm run dev
```

---

## 📝 Checklist

- [ ] Copy all root config files
- [ ] Copy `src/app/` structure
- [ ] Copy all API routes
- [ ] Copy main components
- [ ] Copy UI components (or regenerate)
- [ ] Copy lib files
- [ ] Copy hooks
- [ ] Copy contracts & SQL
- [ ] Copy public files
- [ ] Create `.env.local`
- [ ] Run `npm install`
- [ ] Setup Supabase database
- [ ] Test locally
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Update Farcaster manifest
- [ ] Test production deployment

---

## 🎉 Done!

Your project is now on GitHub! Share the repo link:
```
https://github.com/YOUR_USERNAME/framefusion-genesis
```

---

## 💡 Tips

1. **DO NOT commit `.env.local`** to GitHub (it's in `.gitignore`)
2. **Create `.env.example`** with variable names (no values) untuk dokumentasi
3. **Add README.md** dengan setup instructions
4. **Use GitHub Secrets** untuk Vercel deployment variables
5. **Keep ADMIN_KEY secret** - change dari `rahasia123` di production

---

**Good luck! 🚀**
