haha
# TRIARewards Smart Contract Deployment Guide

## ⚠️ Important: OpenZeppelin v5.0+ Compatibility

This contract uses **OpenZeppelin v5.0+** which requires passing `msg.sender` to the Ownable constructor. The constructor has been properly configured:

```solidity
constructor(address _triaToken, address _nftContract) Ownable(msg.sender) {
    // Contract initialization
}
```

If you're using an older version of OpenZeppelin, you may need to update your dependencies or remove the `Ownable(msg.sender)` parameter.

---

## 📋 Contract Overview

**TRIARewards** is a daily check-in and claim system for FrameFusion Genesis NFT holders.

**Features:**
- Daily check-in with streak tracking
- 50,000 TRIA tokens per claim
- Max 300 claimers per day
- Automatic daily reset at 00:00 UTC
- NFT holder validation
- On-chain streak tracking

---

## 🛠️ Prerequisites

1. **TRIA Token Address**: `0xd852713dd8ddf61316da19383d0c427adb85eb07` (Base)
2. **FrameFusion Genesis NFT Address**: Get from your deployed NFT contract
3. **Deployer Wallet**: Must have ETH for gas fees on Base
4. **TRIA Tokens**: Sufficient TRIA tokens to fund the contract (recommended: 15M TRIA for 300 users/day)

---

## 📦 Installation

### Option 1: Remix IDE (Easiest)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create new file `TRIARewards.sol`
3. Paste the contract code from `contracts/TRIARewards.sol`
4. Install OpenZeppelin dependencies:
   - In Remix, the imports will auto-resolve from GitHub

### Option 2: Hardhat

```bash
# Install dependencies
npm install --save-dev hardhat
npm install @openzeppelin/contracts

# Create Hardhat project
npx hardhat

# Copy TRIARewards.sol to contracts/ folder
```

### Option 3: Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize project
forge init tria-rewards
cd tria-rewards

# Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# Copy TRIARewards.sol to src/ folder
```

---

## 🚀 Deployment Steps

### Using Remix (Recommended for Beginners)

1. **Compile Contract**:
   - Select Solidity Compiler (0.8.20+)
   - Click "Compile TRIARewards.sol"

2. **Deploy to Base**:
   - Go to "Deploy & Run Transactions"
   - Select "Injected Provider - MetaMask"
   - Switch MetaMask to Base network
   - Constructor parameters:
     - `_triaToken`: `0xd852713dd8ddf61316da19383d0c427adb85eb07`
     - `_nftContract`: `YOUR_NFT_CONTRACT_ADDRESS`
   - Click "Deploy"
   - Confirm transaction in MetaMask

3. **Verify Contract** (Optional but recommended):
   - Go to [BaseScan](https://basescan.org/)
   - Find your deployed contract
   - Click "Verify and Publish"
   - Follow verification steps

### Using Hardhat

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const TRIA_TOKEN = "0xd852713dd8ddf61316da19383d0c427adb85eb07";
  const NFT_CONTRACT = "YOUR_NFT_CONTRACT_ADDRESS";
  
  const TRIARewards = await hre.ethers.getContractFactory("TRIARewards");
  const rewards = await TRIARewards.deploy(TRIA_TOKEN, NFT_CONTRACT);
  
  await rewards.deployed();
  
  console.log("TRIARewards deployed to:", rewards.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```bash
# Deploy
npx hardhat run scripts/deploy.js --network base
```

### Using Foundry

```bash
# Deploy
forge create src/TRIARewards.sol:TRIARewards \
  --rpc-url https://mainnet.base.org \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args 0xd852713dd8ddf61316da19383d0c427adb85eb07 YOUR_NFT_CONTRACT_ADDRESS
```

---

## 💰 Fund the Contract

After deployment, you need to fund the contract with TRIA tokens:

```javascript
// Using ethers.js
const triaToken = await ethers.getContractAt("IERC20", TRIA_TOKEN_ADDRESS);
const rewardsContract = await ethers.getContractAt("TRIARewards", REWARDS_CONTRACT_ADDRESS);

// Approve rewards contract to spend your TRIA
await triaToken.approve(rewardsContract.address, ethers.utils.parseEther("15000000")); // 15M TRIA

// Deposit TRIA to rewards contract
await rewardsContract.depositTokens(ethers.utils.parseEther("15000000"));
```

**Recommended Funding:**
- 50k TRIA per user
- 300 users per day
- 30 days = 450M TRIA
- Start with 15M TRIA (enough for 10 days)

---

## ✅ Post-Deployment Checklist

1. ✓ Contract deployed successfully
2. ✓ Contract verified on BaseScan
3. ✓ TRIA tokens deposited to contract
4. ✓ Test check-in function
5. ✓ Test claim function
6. ✓ Update frontend with contract address
7. ✓ Monitor contract balance regularly

---

## 🔧 Contract Functions

### User Functions:
- `checkIn()` - User checks in for today
- `claim()` - User claims TRIA tokens (after check-in)
- `hasCheckedInToday(address)` - Check if user checked in today
- `hasClaimedToday(address)` - Check if user claimed today
- `getUserStreak(address)` - Get user's current streak
- `getRemainingSlots()` - Get remaining claim slots today
- `holdsNFT(address)` - Check if user holds NFT

### Owner Functions:
- `depositTokens(uint256)` - Deposit TRIA to contract
- `withdrawTokens(uint256)` - Withdraw TRIA from contract
- `getContractBalance()` - Check contract TRIA balance
- `updateTriaToken(address)` - Update TRIA token address (emergency)
- `updateNftContract(address)` - Update NFT contract address (emergency)

---

## 📊 Monitoring

Monitor your contract regularly:

```javascript
// Check contract balance
await rewardsContract.getContractBalance();

// Check remaining slots
await rewardsContract.getRemainingSlots();

// Check specific user
await rewardsContract.getUserStreak(userAddress);
await rewardsContract.hasCheckedInToday(userAddress);
await rewardsContract.hasClaimedToday(userAddress);
```

---

## ⚠️ Important Notes

1. **Gas Fees**: Users pay gas fees for check-in and claim transactions
2. **Daily Reset**: Automatically resets at 00:00 UTC (based on block timestamp)
3. **Streak Logic**: Missing a day resets streak to 1
4. **NFT Validation**: User must hold NFT at time of claim
5. **Contract Balance**: Monitor and refill regularly to avoid running out

---

## 🔐 Security Considerations

1. Contract uses OpenZeppelin audited libraries
2. ReentrancyGuard protects against reentrancy attacks
3. Owner-only functions for critical operations
4. No upgradeable proxy (immutable logic)
5. Consider multi-sig wallet for owner operations

---

## 📞 Support

After deployment, update the frontend with:
- New contract address
- ABI (from compilation artifacts)

Contract Address: `PASTE_YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE`

Network: Base (Chain ID: 8453)
