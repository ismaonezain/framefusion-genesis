# 🚀 Smart Contract Deployment Guide

This guide will help you deploy the FrameFusion Genesis NFT contract to Base blockchain.

---

## 📋 What You'll Need

- **Wallet with ETH on Base**: Get some ETH for gas fees
- **Remix IDE**: We'll use this free tool to deploy
- **Base RPC**: Already configured in Remix

---

## Step 1: Prepare the Contract

The smart contract is ready in this file: **`contracts/FrameFusionGenesis.sol`**

### Key Features:
- ✅ ERC-721 standard (compatible with OpenSea)
- ✅ Max supply: 3000 NFTs
- ✅ Named: "FrameFusion Genesis #[FID]"
- ✅ Minting with metadata URI (IPFS)
- ✅ Owner can mint for users

---

## Step 2: Deploy Using Remix

### 2.1 Open Remix IDE
1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. You'll see the Remix interface

### 2.2 Create Contract File
1. In the left panel, click **"File Explorer"** (📁 icon)
2. Click **"contracts"** folder
3. Right-click → **"New File"**
4. Name it: `FrameFusionGenesis.sol`
5. Copy the contract code from `contracts/FrameFusionGenesis.sol` in this project
6. Paste it into Remix

### 2.3 Compile the Contract
1. Click **"Solidity Compiler"** (2nd icon in left sidebar)
2. Select compiler version: **0.8.20** or higher
3. Click **"Compile FrameFusionGenesis.sol"**
4. You should see a green checkmark ✅

### 2.4 Connect Your Wallet
1. Click **"Deploy & Run Transactions"** (3rd icon in left sidebar)
2. In **"Environment"** dropdown, select: **"Injected Provider - MetaMask"**
3. Your wallet (MetaMask/Coinbase Wallet) will pop up
4. Make sure you're connected to **Base** network
   - Network: Base
   - Chain ID: 8453
   - RPC: https://mainnet.base.org

### 2.5 Deploy the Contract
1. In the **"CONTRACT"** dropdown, select: **FrameFusionGenesis**
2. Click the orange **"Deploy"** button
3. Confirm the transaction in your wallet
4. Wait ~5-10 seconds for deployment

### 2.6 Copy Contract Address
1. After deployment, you'll see the contract under **"Deployed Contracts"**
2. Click the copy icon next to the contract address
3. It will look like: `0x1234567890abcdef...`
4. **Save this address!** ✅

---

## Step 3: Update Your App

1. Open `src/lib/nft-contract.ts` in your project
2. Replace this line:
   ```typescript
   export const NFT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
   ```
   
   With your actual contract address:
   ```typescript
   export const NFT_CONTRACT_ADDRESS = '0xYOUR_CONTRACT_ADDRESS_HERE';
   ```

3. Save the file

---

## Step 4: Verify on BaseScan (Optional but Recommended)

1. Go to [https://basescan.org](https://basescan.org)
2. Paste your contract address in the search bar
3. Click on your contract
4. Click **"Contract"** tab → **"Verify and Publish"**
5. Fill in:
   - Compiler: 0.8.20+
   - License: MIT
   - Paste the contract code
6. Click **"Verify"**

This makes your contract visible and trustworthy on BaseScan!

---

## Step 5: Test Minting (Optional)

### Via Remix:
1. In Remix, under **"Deployed Contracts"**, expand your contract
2. Find the **"safeMint"** function
3. Fill in:
   - `_to`: Your wallet address
   - `_tokenURI`: Your IPFS metadata URI (e.g., `ipfs://Qm...`)
4. Click **"transact"**
5. Confirm in wallet
6. Check BaseScan or OpenSea to see your NFT!

---

## 📝 Contract Functions

Your deployed contract has these main functions:

### Public Functions:
- **`safeMint(address _to, string _tokenURI)`**: Mint a new NFT
  - Only owner can call this
  - Requires: total supply < 3000
  - Returns: token ID

- **`totalSupply()`**: Get current number of minted NFTs

- **`tokenURI(uint256 tokenId)`**: Get metadata URI for a token

- **`ownerOf(uint256 tokenId)`**: Get owner of a token

### Owner-Only Functions:
- **`transferOwnership(address newOwner)`**: Transfer contract ownership

---

## 🔧 Integration with Your App

After deploying, your app will:
1. Generate AI art from user's PFP
2. Upload to IPFS via Pinata
3. Call **`safeMint(userAddress, ipfsMetadataURI)`** on your contract
4. Store the token ID in Supabase
5. User can view on OpenSea!

---

## 📍 Important Addresses

After deployment, save these:

- **Contract Address**: `0xYOUR_CONTRACT_ADDRESS`
- **Base Network**: Chain ID 8453
- **BaseScan URL**: `https://basescan.org/address/0xYOUR_CONTRACT_ADDRESS`
- **OpenSea Collection**: `https://opensea.io/collection/framefusion-genesis`

---

## ✅ You're Done!

Your smart contract is now deployed on Base! 🎉

**Next Steps:**
1. Update `NFT_CONTRACT_ADDRESS` in your app
2. Test minting an NFT
3. Share your collection!

---

## 🆘 Need Help?

**Common Issues:**

1. **"Out of gas" error**: Increase gas limit in wallet
2. **"Max supply reached"**: You've minted 3000 NFTs already!
3. **"Only owner can mint"**: Make sure you're using the wallet that deployed the contract
4. **Network wrong**: Switch to Base (Chain ID: 8453)

**Resources:**
- Base Docs: https://docs.base.org
- Remix Tutorial: https://remix.ethereum.org/tutorials
- OpenSea Help: https://support.opensea.io
