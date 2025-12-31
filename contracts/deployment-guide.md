hahaha
# FrameFusion Genesis V2 - Deployment Guide

## Contract Features
This new contract stores complete NFT metadata on-chain including:
- FID (Farcaster ID)
- Character Class & Description
- Gender
- Background & Description
- Color Palette & Vibe
- Clothing
- Accessories
- Items/Weapons
- Mint Timestamp

## Deployment Steps

### 1. Install Dependencies
```bash
npm install --save-dev @openzeppelin/contracts hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Setup Hardhat Config
Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY], // Add your private key to .env
      chainId: 8453
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    }
  }
};
```

### 3. Create Deployment Script
Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying FrameFusion Genesis V2...");

  const FrameFusionGenesisV2 = await hre.ethers.getContractFactory("FrameFusionGenesisV2");
  const contract = await FrameFusionGenesisV2.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("FrameFusion Genesis V2 deployed to:", address);
  console.log("\nUpdate src/lib/nft-contract-v2.ts with this address:");
  console.log(`export const NFT_CONTRACT_ADDRESS = '${address}';`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. Deploy to Base
```bash
# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network base

# OR deploy to Base Sepolia Testnet
npx hardhat run scripts/deploy.js --network baseSepolia
```

### 5. Verify Contract on BaseScan
```bash
npx hardhat verify --network base YOUR_CONTRACT_ADDRESS
```

### 6. Update Application
After deployment, update `src/lib/nft-contract-v2.ts` with the new contract address.

## Contract Address
After deployment, your contract address will be: `0x...`

Update this in the app to start using the new contract with full metadata storage!

## Gas Estimates
- Deployment: ~2-3M gas (~$5-10 depending on gas price)
- Minting with metadata: ~200-300k gas per mint (~$1-2 per mint)

## Benefits of V2
- ✅ All metadata stored on-chain (no dependency on IPFS for metadata)
- ✅ Queryable metadata directly from contract
- ✅ Better transparency and permanence
- ✅ Can build on-chain analytics and tools
- ✅ Character attributes readable by other contracts
