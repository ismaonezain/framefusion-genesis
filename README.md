# 🎨 FrameFusion Genesis - NFT Collection Mini App

Transform your Farcaster identity into exclusive AI-generated NFT art! Limited to 3000 unique pieces.

---

## 🌟 Features

✅ **AI-Generated Art** - Unique artwork created from your Farcaster profile picture  
✅ **Limited Edition** - Maximum supply of 3000 NFTs  
✅ **One Per Person** - 1 FID = 1 NFT generation  
✅ **IPFS Storage** - Permanently stored on decentralized storage  
✅ **Multi-Platform** - Works on Farcaster & Base apps  
✅ **Social Sharing** - Share directly to Warpcast or Base  
✅ **Follow Gate** - Must follow @ismaone to generate  
✅ **OpenSea Ready** - NFT contract deployable to Base blockchain  

---

## 🚀 Quick Start

### 1. **Setup Supabase Database**
📖 **Full guide**: See `SUPABASE-SETUP.md`

Quick steps:
1. Create Supabase project at https://supabase.com
2. Create `nfts` table (see SUPABASE-SETUP.md for schema)
3. Get your API credentials from Supabase dashboard
4. Update `src/lib/supabase.ts` with your credentials:
   ```typescript
   const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
   const supabaseAnonKey = 'YOUR_ANON_KEY';
   ```

### 2. **Deploy Smart Contract** (Optional)
📖 **Full guide**: See `CONTRACT-DEPLOY.md`

Quick steps:
1. Open Remix IDE: https://remix.ethereum.org
2. Copy contract from `contracts/FrameFusionGenesis.sol`
3. Compile with Solidity 0.8.20+
4. Deploy to Base network (Chain ID: 8453)
5. Update `src/lib/nft-contract.ts` with your contract address

### 3. **Publish Your App**
1. Click **"Publish"** button in your dashboard
2. Your app will be deployed to production
3. Share the URL in Farcaster or Base!

---

## 📊 What Gets Stored in Supabase?

Each generated NFT stores:
- **FID** - Farcaster ID (unique constraint)
- **Name** - e.g., "FrameFusion Genesis #12345"
- **Image URL** - AI-generated artwork on IPFS
- **Metadata URI** - NFT metadata JSON on IPFS
- **Contract info** - Contract address & token ID (after minting)
- **Timestamps** - Creation date

---

## 🎨 NFT Collection Details

### Collection Name
**FrameFusion Genesis** - Merging "Frame" (Farcaster frames) with "Fusion" (AI art generation)

### NFT Naming Convention
`FrameFusion Genesis #[FID]`

Example: `FrameFusion Genesis #12345`

### Max Supply
3000 NFTs (first come, first served)

### Generation Method
- AI generates unique art based on user's Farcaster profile
- Uses Flux Pro for high-quality image generation
- Stored on IPFS via Pinata
- NFT metadata follows OpenSea standards

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Blockchain**: Base (Ethereum L2)
- **Wallet**: Coinbase Smart Wallet via OnchainKit
- **AI Generation**: Flux Pro
- **Storage**: IPFS via Pinata
- **Database**: Supabase (PostgreSQL)
- **Smart Contract**: ERC-721 (Solidity)
- **Farcaster SDK**: @farcaster/miniapp-sdk
- **Styling**: Tailwind CSS v4

---

## 📁 Project Structure

```
mini-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── check-follow/route.ts  # Follow verification
│   │   │   └── nft/
│   │   │       ├── check/route.ts      # Check if FID already minted
│   │   │       ├── save/route.ts       # Save NFT to database
│   │   │       └── stats/route.ts      # Collection statistics
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Main app page
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── nft-generator.tsx           # NFT generation UI
│   │   ├── nft-display.tsx             # Display generated NFT
│   │   └── collection-stats.tsx        # Collection stats card
│   ├── hooks/
│   │   └── usePlatformDetection.ts     # Detect Farcaster/Base
│   └── lib/
│       ├── supabase.ts                 # Supabase client
│       └── nft-contract.ts             # Contract config
├── contracts/
│   └── FrameFusionGenesis.sol          # ERC-721 NFT contract
├── SUPABASE-SETUP.md                   # Database setup guide
├── CONTRACT-DEPLOY.md                  # Contract deployment guide
└── README.md                           # This file
```

---

## 🔧 Configuration Files

### Supabase (`src/lib/supabase.ts`)
```typescript
const supabaseUrl = 'YOUR_PROJECT_URL';
const supabaseAnonKey = 'YOUR_ANON_KEY';
```

### NFT Contract (`src/lib/nft-contract.ts`)
```typescript
export const NFT_CONTRACT_ADDRESS = '0xYOUR_CONTRACT_ADDRESS';
export const NFT_COLLECTION_NAME = 'FrameFusion Genesis';
export const MAX_SUPPLY = 3000;
```

---

## 🎯 How It Works

1. **User opens app** in Farcaster or Base
2. **Connects wallet** (Coinbase Smart Wallet)
3. **Follow check** - Must follow @ismaone
4. **Generate button** - Click to start AI generation
5. **AI creates art** - Flux Pro generates unique artwork based on PFP
6. **Upload to IPFS** - Image & metadata saved permanently
7. **Save to database** - Record stored in Supabase
8. **Display NFT** - Show generated art with share buttons
9. **Share** - Post to Warpcast or Base with credit
10. **(Optional) Mint** - Deploy contract and mint on-chain

---

## 🎨 UI/UX Features

- **Hero Section** with animated gradient logo
- **Collection Stats** with real-time progress
- **Platform Detection** - Adapts UI for Farcaster/Base
- **Follow Gate Alert** - Clear CTA to follow @ismaone
- **Loading States** - Beautiful animated progress indicators
- **Hover Effects** - Interactive cards with scale transforms
- **Responsive Design** - Mobile-first with proper spacing
- **Color Palette** - Purple, pink, blue gradients throughout

---

## 🔒 Security & Requirements

- **Follow Required**: Users must follow @ismaone to generate
- **One Per FID**: Each Farcaster ID can only generate once
- **Max Supply**: Hard cap of 3000 NFTs
- **IPFS Permanent**: Images can't be deleted or changed
- **Wallet Required**: Must connect Coinbase Smart Wallet

---

## 🆘 Troubleshooting

### "Failed to generate image"
- Check Flux Pro API is working
- Ensure user has valid Farcaster profile

### "Failed to save NFT"
- Verify Supabase credentials in `src/lib/supabase.ts`
- Check `nfts` table exists with correct schema
- Ensure FID hasn't already minted (unique constraint)

### "Follow Required" won't go away
- User must actually follow @ismaone on Warpcast
- Refresh the page after following
- Check `/api/check-follow` API route is working

### Contract minting fails
- Ensure contract is deployed to Base
- Update `NFT_CONTRACT_ADDRESS` in `src/lib/nft-contract.ts`
- Verify user has ETH on Base for gas fees

---

## 📚 Additional Resources

- **Supabase Setup**: See `SUPABASE-SETUP.md`
- **Contract Deployment**: See `CONTRACT-DEPLOY.md`
- **Farcaster Docs**: https://docs.farcaster.xyz
- **Base Docs**: https://docs.base.org
- **OnchainKit Docs**: https://onchainkit.xyz
- **Pinata Docs**: https://docs.pinata.cloud

---

## 🙏 Credits

**Created by [@ismaone.farcaster.eth](https://warpcast.com/ismaone)**

Powered by:
- Farcaster & Base Mini App
- AI & IPFS
- Built on Base blockchain

---

## 📝 License

MIT License - Feel free to fork and customize!

---

## 🎉 Launch Checklist

Before going live:

- [ ] Setup Supabase database with `nfts` table
- [ ] Update Supabase credentials in `src/lib/supabase.ts`
- [ ] (Optional) Deploy NFT contract to Base
- [ ] (Optional) Update contract address in `src/lib/nft-contract.ts`
- [ ] Test NFT generation end-to-end
- [ ] Verify follow check works
- [ ] Test social sharing on both platforms
- [ ] Click Publish button
- [ ] Share your collection URL!

**Ready to launch FrameFusion Genesis? Let's go! 🚀✨**
