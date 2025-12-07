# FrameShadows Monster NFT Contract Deployment Guide

## Contract Overview
FrameShadows is an ERC-721 NFT contract for monster characters that serve as opponents for FrameFusion Genesis characters. Each monster has unique traits, elements, and can be leveled up through battles.

## Key Features
- **Max Supply**: 300 monsters
- **Mint Price**: 0.0001 ETH per monster
- **Lazy Image Generation**: NFTs are minted instantly with placeholder metadata, then artwork is generated asynchronously using FluxPro
- **Anime Art Style**: All monsters are generated in high-quality anime/manga style
- **Level System**: Monsters start at level 1 and can be upgraded
- **Element System**: Fire, Ice, Dark, Lightning, Poison, Chaos, Metal, Nature, Arcane
- **Rarity Tiers**: Common, Uncommon, Rare, Epic, Legendary

## Deployment Steps

### 1. Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### 2. Compile Contract
```bash
npx hardhat compile
```

### 3. Deploy to Base Sepolia (Testnet)
```bash
npx hardhat run scripts/deploy-frameshadows.js --network base-sepolia
```

### 4. Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-frameshadows.js --network base-mainnet
```

### 5. Update Contract Address
After deployment, update the contract address in:
- `src/lib/monster-contract.ts` → Update `FRAMESHADOWS_CONTRACT.address`

### 6. Verify Contract on BaseScan
```bash
npx hardhat verify --network base-mainnet <CONTRACT_ADDRESS>
```

## Mint Flow

### User Experience
1. **User clicks "Mint Monster"** → Pays 0.0001 ETH
2. **NFT is minted instantly** → With placeholder image and basic metadata
3. **Artwork generates asynchronously** → Using FluxPro (anime style)
4. **Metadata updated** → When artwork is ready (1-2 minutes)
5. **User can view** → Monster in their collection immediately

### Technical Flow
```
Client (monster-generator.tsx)
  ↓
  1. Generate monster attributes (deterministic from ID)
  ↓
  2. Save to Supabase with placeholder
  ↓
  3. Call contract.safeMint() [0.0001 ETH]
  ↓
  4. Wait for tx confirmation
  ↓
  5. Trigger async image generation (/api/monsters/generate-image)
  ↓
  6. Return success (user sees "Generating artwork...")

Background (generate-image API)
  ↓
  1. Generate anime prompt
  ↓
  2. Submit to FluxPro
  ↓
  3. Poll for completion
  ↓
  4. Upload to IPFS (Lighthouse)
  ↓
  5. Update Supabase with real image
  ↓
  6. Call contract.updateTokenURI() (optional)
```

## Contract Functions

### Public Functions
- `safeMint(address to, uint256 monsterId, uint256 powerLevel, string tokenURI, bool isWild)` - Mint new monster (owner only)
- `getMonsterStats(uint256 tokenId)` - Get monster stats
- `tokensOfOwner(address owner)` - Get all tokens owned by address
- `totalSupply()` - Get current supply
- `MAX_SUPPLY()` - Returns 300

### Owner Functions
- `updateTokenURI(uint256 tokenId, string newURI)` - Update metadata after image generation
- `updatePowerLevel(uint256 tokenId, uint256 newPowerLevel)` - Update from battle system
- `updateMonsterLevel(uint256 tokenId, uint256 newLevel)` - Level up monster
- `recordDefeat(uint256 monsterTokenId, uint256 characterTokenId, address winner)` - Record battle result

## Database Schema
See `FRAMESHADOWS_SCHEMA.sql` for complete Supabase setup including:
- `monsters` table - All monster data
- `battle_history` table - Character vs Monster battles
- `monster_traits` table - Special abilities and traits
- Views for stats and leaderboards

## Anime Art Generation
All monsters are generated using FluxPro 1.1 with anime-specific prompts:
- Japanese anime/manga art style
- Sharp anime linework and clean shading
- Dark fantasy and horror anime aesthetics
- Demon Slayer, Attack on Titan, Dark Souls anime inspiration
- Professional 2D anime illustration quality
- NOT realistic, NOT 3D, pure anime style

## Monster Traits
Each monster has deterministic traits based on monster ID:
- **Monster Type**: 20 unique types (Shadow Reaper, Inferno Demon, etc.)
- **Element**: 9 elements (Fire, Ice, Dark, Lightning, etc.)
- **Rarity**: 5 tiers (Common to Legendary)
- **Color Palette**: 15 dark palettes
- **Environment**: 15 unique backgrounds
- **Art Style**: 5 anime styles

## Integration with FrameFusion Genesis
Monsters are designed to be opponents for FrameFusion Genesis characters:
- Battle system uses power levels
- Element matchups affect combat
- Defeating monsters earns $TRIA tokens
- Victory unlocks special traits and badges

## Cost Analysis
- **Gas Cost**: ~0.0002 ETH (mint) + ~0.0001 ETH (metadata update)
- **Mint Price**: 0.0001 ETH (revenue)
- **FluxPro Cost**: ~$0.04 per image (paid by app)
- **IPFS Storage**: ~$0.001 per image (Lighthouse)

## Support
For issues or questions:
- Check transaction on BaseScan
- View logs in Supabase
- Monitor FluxPro generation in API logs
- Contact support if image generation fails
