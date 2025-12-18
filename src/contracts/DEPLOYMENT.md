# FrameFusion Genesis V3 - Deployment Guide

## 📋 Contract Overview

**FrameFusion Genesis V3** is an upgraded NFT contract that enables:
- ✅ **Dynamic Metadata**: tokenURI can be updated to point to API endpoints with traits
- ✅ **V2 Migration**: Burn V2 NFTs and mint V3 with traits system
- ✅ **Traits System**: Metadata served via API with unlockable traits
- ✅ **OpenSea Compatible**: Traits visible on all marketplaces

## 🚀 Deployment Steps

### 1. Compile Contract

```bash
# Install dependencies
npm install --save-dev @openzeppelin/contracts

# Using Hardhat
npx hardhat compile

# Or using Foundry
forge build
```

### 2. Deploy to Base Network

**Constructor Parameters:**
- `_v2ContractAddress`: `0xD308c4734D9460717485040D07B7dE7e44718A11`

**Deployment Script Example (Hardhat):**

```javascript
const { ethers } = require("hardhat");

async function main() {
  const V2_CONTRACT = "0xD308c4734D9460717485040D07B7dE7e44718A11";
  
  const FrameFusionV3 = await ethers.getContractFactory("FrameFusionGenesisV3");
  const contract = await FrameFusionV3.deploy(V2_CONTRACT);
  
  await contract.deployed();
  
  console.log("FrameFusion Genesis V3 deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Deploy via Remix IDE:**
1. Go to [remix.ethereum.org](https://remix.ethereum.org/)
2. Create new file `FrameFusionGenesisV3.sol`
3. Paste contract code
4. Compile with Solidity 0.8.20+
5. Deploy to Base network:
   - Network: Base Mainnet (Chain ID: 8453)
   - Constructor param: `0xD308c4734D9460717485040D07B7dE7e44718A11`
6. Save deployed contract address

### 3. Verify Contract on BaseScan

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "0xD308c4734D9460717485040D07B7dE7e44718A11"
```

## 🔄 Migration Flow

### For Users:

```
1. User owns V2 NFT (Token ID: X, FID: Y)
   ↓
2. User approves V3 contract to transfer their V2 NFT
   ↓
3. User calls migrateFromV2(v2TokenId, fid, newTokenURI)
   ↓
4. V3 contract burns V2 NFT (sends to dead address)
   ↓
5. V3 contract mints new V3 NFT with same FID
   ↓
6. User now has V3 NFT with traits system!
```

### Smart Contract Functions:

#### **Approve V2 Transfer (User must call this first)**
```solidity
// On V2 Contract
function approve(address to, uint256 tokenId)
// User calls: approve(V3_CONTRACT_ADDRESS, their_v2_token_id)
```

#### **Migrate NFT**
```solidity
function migrateFromV2(
    uint256 _v2TokenId,    // V2 token ID to burn
    uint256 _fid,          // FID of the NFT
    string memory _tokenURI // New V3 metadata URI (API endpoint)
) external returns (uint256)
```

**Example:**
```javascript
// Step 1: Approve V3 contract on V2
await v2Contract.approve(V3_CONTRACT_ADDRESS, v2TokenId);

// Step 2: Migrate
await v3Contract.migrateFromV2(
  v2TokenId,
  fid,
  `https://yourdomain.com/api/nft/metadata/${fid}`
);
```

## 📊 Metadata API Structure

V3 tokenURI points to API endpoint that returns dynamic metadata:

**API Endpoint:** `https://yourdomain.com/api/nft/metadata/[fid]`

**Response Format (ERC-721 Standard):**
```json
{
  "name": "FrameFusion Genesis #123",
  "description": "AI-generated avatar with unlockable traits",
  "image": "ipfs://QmXxx.../image.png",
  "external_url": "https://yourdomain.com/nft/123",
  "attributes": [
    {
      "trait_type": "Character Class",
      "value": "Warrior"
    },
    {
      "trait_type": "Background",
      "value": "Cyber City"
    },
    {
      "trait_type": "Loyalty Tier",
      "value": "Gold",
      "display_type": "badge"
    },
    {
      "trait_type": "Check-in Streak",
      "value": 30,
      "display_type": "number"
    },
    {
      "trait_type": "Total $TRIA Claimed",
      "value": 1500000,
      "display_type": "number"
    },
    {
      "trait_type": "Rank",
      "value": 5,
      "display_type": "ranking"
    },
    {
      "trait_type": "Achievement",
      "value": "Early Adopter",
      "display_type": "badge"
    }
  ]
}
```

## 🎨 Traits System

### Base Traits (From Original NFT):
- Character Class
- Gender
- Background
- Color Palette
- Clothing
- Accessories
- Items

### Dynamic Traits (Earned via Engagement):

#### **Loyalty Tiers:**
- Bronze (Default)
- Silver (7 day streak)
- Gold (30 day streak)
- Diamond (100 day streak)

#### **Achievement Badges:**
- 🏆 Early Adopter (Minted in first 100)
- 💎 Diamond Hands (Never sold NFT)
- 🔥 Streak Legend (30+ consecutive check-ins)
- 🐋 Whale (1M+ $TRIA claimed)
- 👑 Community Leader (Top 10 leaderboard)

#### **Activity Metrics:**
- Check-in Streak
- Total $TRIA Claimed
- Leaderboard Rank
- Days Since Mint

## 🔧 Admin Functions

### Update Single Token Metadata
```solidity
function updateTokenURI(uint256 _tokenId, string memory _newTokenURI) external onlyOwner
```

### Batch Update Token Metadata
```solidity
function batchUpdateTokenURI(
    uint256[] memory _tokenIds,
    string[] memory _newTokenURIs
) external onlyOwner
```

### Update V2 Contract Reference
```solidity
function updateV2ContractAddress(address _newV2Address) external onlyOwner
```

## 💰 Gas Estimates

- **Deploy Contract:** ~2.5M gas (~$5-10 on Base)
- **Mint Fresh NFT:** ~150k gas (~$0.50)
- **Migrate from V2:** ~200k gas (~$0.70)
- **Update TokenURI:** ~50k gas (~$0.20)

## 📝 Post-Deployment Checklist

- [ ] Deploy V3 contract to Base mainnet
- [ ] Verify contract on BaseScan
- [ ] Create API endpoint for metadata: `/api/nft/metadata/[fid]`
- [ ] Create traits table in Supabase
- [ ] Build migration UI in admin panel
- [ ] Test migration flow with test NFTs
- [ ] Announce migration to community
- [ ] Update OpenSea collection metadata

## 🛡️ Security Features

1. **Ownership Verification**: Only V2 NFT owner can migrate
2. **Burn Mechanism**: V2 NFT sent to dead address (can't be recovered)
3. **One-time Migration**: Each V2 token can only migrate once
4. **FID Lock**: Each FID can only mint/migrate once
5. **Max Supply**: Hard cap at 3000 NFTs
6. **Owner Controls**: Only owner can update metadata endpoints

## 📞 Support

After deployment, update these addresses in your app:
- `src/lib/nft-contract-v3.ts` with new contract address
- API endpoint for metadata serving
- Migration UI components

## 🎯 Benefits of V3

✅ **For Users:**
- Keep same FID and original artwork
- Gain unlockable traits based on engagement
- Traits visible on OpenSea and all marketplaces
- Increase NFT value through activity
- No loss of ownership or history

✅ **For Project:**
- Dynamic gamification without new contract
- Update metadata without redeploying
- Better engagement tracking
- Professional NFT standard
- Future-proof for new features
