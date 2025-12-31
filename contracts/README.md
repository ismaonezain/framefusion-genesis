hahahaha
# FrameFusion Genesis V2 - On-Chain Metadata Storage

## 🆕 What's New in V2?

### V1 (Current Contract)
- ✅ Basic NFT with FID mapping
- ✅ Token URI stored (points to IPFS metadata)
- ❌ Metadata only on IPFS/Supabase (off-chain)

### V2 (New Contract with Full Metadata)
- ✅ Everything from V1
- ✅ **Character Class stored on-chain** (e.g., "Swordmaster", "Tech Hacker")
- ✅ **Background stored on-chain** (e.g., "Crystal Palace", "Cyberpunk City")
- ✅ **Color Palette stored on-chain** (e.g., "Crimson Abyss", "Azure Depths")
- ✅ **Clothing stored on-chain** (e.g., "armored jacket", "cyber jacket")
- ✅ **Accessories stored on-chain** (e.g., "golden wings", "floating magic circles")
- ✅ **Items/Weapons stored on-chain** (e.g., "dual swords", "holographic tablet")
- ✅ **Gender stored on-chain** (male/female)
- ✅ **Mint Timestamp stored on-chain**

## 📊 Comparison

| Feature | V1 | V2 |
|---------|----|----|
| FID Mapping | ✅ | ✅ |
| Token URI | ✅ | ✅ |
| Character Class | ❌ | ✅ |
| Background | ❌ | ✅ |
| Color Palette | ❌ | ✅ |
| Clothing | ❌ | ✅ |
| Accessories | ❌ | ✅ |
| Items/Weapons | ❌ | ✅ |
| Gender | ❌ | ✅ |
| On-Chain Queries | Limited | Full |
| Gas Cost per Mint | ~150k | ~250-300k |

## 🚀 Quick Start

### Step 1: Deploy Contract
```bash
# Install dependencies
npm install --save-dev @openzeppelin/contracts hardhat

# Deploy to Base
npx hardhat run scripts/deploy.js --network base
```

### Step 2: Update Contract Address
After deployment, copy the contract address and update:
```typescript
// src/lib/nft-contract-v2.ts
export const NFT_CONTRACT_ADDRESS_V2 = 'YOUR_NEW_CONTRACT_ADDRESS';
```

### Step 3: Use V2 in Your App
```typescript
// Import V2 component instead of V1
import { MintNFTButtonV2 } from '@/components/mint-nft-button-v2';

// Use it in your page
<MintNFTButtonV2 
  nft={nft} 
  fid={fid} 
  onMintSuccess={handleMintSuccess} 
/>
```

## 🔍 Querying Metadata

With V2, you can query metadata directly from the blockchain:

```typescript
import { useReadContract } from 'wagmi';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';

// Get full metadata for a token
const { data: metadata } = useReadContract({
  address: NFT_CONTRACT_ADDRESS_V2,
  abi: NFT_CONTRACT_ABI_V2,
  functionName: 'getMetadata',
  args: [tokenId],
});

// Access metadata
console.log(metadata.characterClass); // "Swordmaster"
console.log(metadata.background); // "Crystal Palace"
console.log(metadata.colorPalette); // "Crimson Abyss"
console.log(metadata.clothing); // "armored jacket with leather straps"
console.log(metadata.accessories); // "floating sword aura"
```

## 💰 Gas Cost Estimates

**Deployment:**
- V1: ~1.5M gas (~$3-5)
- V2: ~2.5M gas (~$5-10)

**Per Mint:**
- V1: ~150k gas (~$0.30-0.50)
- V2: ~250-300k gas (~$0.50-1.00)

*Costs vary based on Base gas prices*

## 🎯 Benefits of V2

1. **True On-Chain Storage**: All character attributes permanently stored on blockchain
2. **Verifiable Rarity**: Anyone can query and verify character traits directly
3. **Composability**: Other contracts can read and use your NFT's attributes
4. **No IPFS Dependency**: Metadata accessible even if IPFS goes down
5. **Analytics**: Easy to build on-chain analytics and rarity tools
6. **Transparency**: Complete transparency of all character data

## 📝 Contract Structure

```solidity
struct NFTMetadata {
    uint256 fid;
    string characterClass;
    string classDescription;
    string gender;
    string background;
    string backgroundDescription;
    string colorPalette;
    string colorVibe;
    string clothing;
    string accessories;
    string items;
    uint256 mintedAt;
}
```

## 🔧 Functions

### Minting
```solidity
function safeMint(
    address _to,
    string memory _tokenURI,
    uint256 _fid,
    string memory _characterClass,
    string memory _classDescription,
    string memory _gender,
    string memory _background,
    string memory _backgroundDescription,
    string memory _colorPalette,
    string memory _colorVibe,
    string memory _clothing,
    string memory _accessories,
    string memory _items
) public returns (uint256)
```

### Querying
```solidity
function getMetadata(uint256 _tokenId) public view returns (NFTMetadata memory)
function hasMinted(uint256 _fid) public view returns (bool)
function getTokenIdByFid(uint256 _fid) public view returns (uint256)
function getFidByTokenId(uint256 _tokenId) public view returns (uint256)
```

## 🎮 Use Cases

- **Rarity Tools**: Build tools to analyze character distribution
- **Games**: Use on-chain attributes in other games/apps
- **Trading**: Filter and trade based on specific traits
- **Analytics**: Create dashboards showing class/background distribution
- **Cross-App**: Use character data across multiple applications

## 🔐 Security

- ✅ Inherits from OpenZeppelin's secure ERC721 implementation
- ✅ Ownable for admin functions
- ✅ One mint per FID restriction
- ✅ Max supply cap at 3000
- ✅ Safe mint with receiver check

## 📚 Learn More

- [OpenZeppelin ERC721 Docs](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [Base Network Docs](https://docs.base.org/)
- [Hardhat Docs](https://hardhat.org/docs)

## 🤝 Support

For deployment help or questions, check:
- Deployment Guide: `contracts/deployment-guide.md`
- Solidity Contract: `contracts/FrameFusionGenesisV2.sol`
