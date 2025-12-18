# FrameShadows - Deployment Guide (Updated Version)

## 🆕 What's New in This Version?

**Major Updates:**
- ✅ **Payable Mint Function** - Users pay 0.0001 ETH to mint
- ✅ **Withdraw Function** - Owner can withdraw collected ETH
- ✅ **Public Minting** - Anyone can mint (not onlyOwner)
- ✅ **Owner Mint** - Admin can mint for free (testing/airdrops)
- ✅ **Contract Balance View** - Check total ETH collected
- ✅ **Refund Excess** - Auto-refund if user pays too much

---

## 🚨 Why New Version?

**Problem with Old Contract (0xd376663E063A6E1A115b0ad4B3ABA70353e46f0f):**
- ❌ `safeMint()` is `onlyOwner` (not public)
- ❌ No `payable` modifier (can't receive ETH)
- ❌ No `withdraw()` function (can't get ETH out)
- ❌ Can't collect 0.0001 ETH from users

**New Contract Solution:**
- ✅ `mintMonster()` is public and payable
- ✅ `withdraw()` and `withdrawAmount()` functions
- ✅ `receive()` and `fallback()` for ETH handling
- ✅ Proper payment collection and withdrawal

---

## 📋 Deployment Steps

### 1. Compile Contract

```bash
npx hardhat compile
```

### 2. Create Deployment Script

Create `scripts/deploy-frameshadows.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying FrameShadows...");

  const FrameShadows = await hre.ethers.getContractFactory("FrameShadows");
  const frameshadows = await FrameShadows.deploy();

  await frameshadows.waitForDeployment();

  const address = await frameshadows.getAddress();
  console.log("FrameShadows deployed to:", address);
  
  // Verify mint price
  const mintPrice = await frameshadows.MINT_PRICE();
  console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "ETH");
  
  // Verify max supply
  const maxSupply = await frameshadows.MAX_SUPPLY();
  console.log("Max Supply:", maxSupply.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-frameshadows.js --network base-mainnet
```

Expected output:
```
Deploying FrameShadows...
FrameShadows deployed to: 0xB2df433b8d15fF25C6157c193C8a11817AfA788E ✅
Mint Price: 0.0001 ETH
Max Supply: 300
```

### 4. Verify on BaseScan

```bash
npx hardhat verify --network base-mainnet 0xB2df433b8d15fF25C6157c193C8a11817AfA788E
```

**Contract Verified:** ✅ https://basescan.org/address/0xB2df433b8d15fF25C6157c193C8a11817AfA788E

### 5. Update App Configuration

Update `src/lib/monster-contract.ts` with new contract address and ABI.

---

## 💰 How Payment Works

### User Minting Flow:
```
User clicks "Mint Monster"
     ↓
Wallet prompt: Pay 0.0001 ETH
     ↓
Call mintMonster() with 0.0001 ETH
     ↓
Contract receives ETH
     ↓
NFT minted to user
     ↓
Excess payment refunded (if any)
```

### Owner Withdrawal Flow:
```
Owner calls withdraw() on Basescan
     ↓
Contract sends all ETH to owner wallet
     ↓
ETH received in owner wallet
     ↓
Contract balance = 0
```

---

## 🔧 Key Functions

### **1. mintMonster() - Public Payable**
```solidity
function mintMonster(
    uint256 _monsterId,
    uint256 _powerLevel,
    string memory _tokenURI,
    bool _isWild
) public payable returns (uint256)
```

**Usage:**
- Anyone can call this function
- Must send 0.0001 ETH with transaction
- Returns new token ID
- Auto-refunds excess payment

### **2. withdraw() - Owner Only**
```solidity
function withdraw() external onlyOwner
```

**Usage:**
- Withdraws ALL ETH from contract
- Only owner can call
- ETH sent to owner wallet

### **3. withdrawAmount() - Owner Only**
```solidity
function withdrawAmount(uint256 _amount) external onlyOwner
```

**Usage:**
- Withdraw specific amount
- Useful for partial withdrawals
- Must have sufficient balance

### **4. getContractBalance() - Public View**
```solidity
function getContractBalance() external view returns (uint256)
```

**Usage:**
- Check total ETH in contract
- Anyone can view
- Returns balance in wei

### **5. ownerMint() - Owner Only (Free)**
```solidity
function ownerMint(
    address _to,
    uint256 _monsterId,
    uint256 _powerLevel,
    string memory _tokenURI,
    bool _isWild
) public onlyOwner returns (uint256)
```

**Usage:**
- Free minting for admin/testing
- Useful for airdrops or giveaways
- No payment required

---

## 🔍 Testing the Contract

### 1. Check Mint Price
```javascript
const mintPrice = await contract.MINT_PRICE();
console.log(ethers.formatEther(mintPrice)); // "0.0001"
```

### 2. Mint a Monster
```javascript
const tx = await contract.mintMonster(
  12345, // monsterId
  5000, // powerLevel
  "https://app.com/api/monsters/metadata/12345", // tokenURI
  true, // isWild
  { value: ethers.parseEther("0.0001") }
);
await tx.wait();
```

### 3. Check Contract Balance
```javascript
const balance = await contract.getContractBalance();
console.log(ethers.formatEther(balance)); // e.g., "0.0005" (5 mints)
```

### 4. Withdraw Funds (Owner)
```javascript
const tx = await contract.withdraw();
await tx.wait();
console.log("All funds withdrawn!");
```

### 5. Partial Withdrawal (Owner)
```javascript
const amount = ethers.parseEther("0.0003"); // Withdraw 0.0003 ETH
const tx = await contract.withdrawAmount(amount);
await tx.wait();
console.log("Partial withdrawal successful!");
```

---

## 📊 Basescan Interaction

### Via Basescan (Easiest for Withdrawals):

1. **Open Contract on Basescan**
   ```
   https://basescan.org/address/<YOUR_CONTRACT_ADDRESS>
   ```

2. **Connect Wallet**
   - Click "Contract" tab
   - Click "Write Contract"
   - Connect owner wallet

3. **View Balance**
   - Click "Read Contract"
   - Find `getContractBalance`
   - Click "Query"
   - See total ETH in contract

4. **Withdraw All Funds**
   - Click "Write Contract"
   - Find `withdraw`
   - Click "Write"
   - Confirm transaction
   - ✅ All ETH sent to owner wallet!

5. **Withdraw Specific Amount**
   - Click "Write Contract"
   - Find `withdrawAmount`
   - Enter amount in wei (e.g., 100000000000000 = 0.0001 ETH)
   - Click "Write"
   - Confirm transaction

---

## 💡 Migration from Old Contract

### Option 1: Start Fresh (Recommended)
1. Deploy new contract
2. Update app to use new address
3. All new mints go to new contract
4. Old contract remains as-is (no harm)

### Option 2: Hybrid Approach
1. Deploy new contract for new mints
2. Keep old contract data in database
3. Display both old and new monsters in app
4. New contract gets all future mints with payment

---

## ⚠️ Important Notes

### **1. Cannot Migrate Old Tokens**
- Old tokens stay in old contract
- Cannot move them to new contract
- Both contracts can coexist

### **2. Update App Code**
- Change contract address in `monster-contract.ts`
- Update ABI with new functions
- Update mint component to use `mintMonster()`

### **3. Gas Costs**
- Mint: ~0.00015 ETH total (0.0001 mint + 0.00005 gas)
- Withdraw: ~$0.01-0.02 in gas
- Check balance: Free (view function)

### **4. Security**
- Only owner can withdraw
- Auto-refund prevents overpayment
- Max supply enforced (300)
- Reentrancy protection with OpenZeppelin

---

## 🎯 Quick Start Checklist

- [ ] Compile contract: `npx hardhat compile`
- [ ] Deploy to Base: `npx hardhat run scripts/deploy-frameshadows.js --network base-mainnet`
- [ ] Verify on Basescan: `npx hardhat verify --network base-mainnet <ADDRESS>`
- [ ] Update `src/lib/monster-contract.ts` with new address
- [ ] Update contract ABI in `monster-contract.ts`
- [ ] Test mint with 0.0001 ETH
- [ ] Verify balance on Basescan
- [ ] Test withdraw function
- [ ] Update docs and notify users

---

## 📞 Troubleshooting

### "Insufficient payment" Error
- User didn't send 0.0001 ETH
- Increase value to at least 0.0001 ETH

### "No funds to withdraw" Error
- Contract balance is 0
- Mint some monsters first to collect ETH

### "Withdrawal failed" Error
- Not owner wallet calling withdraw
- Connect correct owner wallet

### Function not found
- Wrong contract address
- Update ABI in app
- Redeploy if needed

---

## 🎉 Summary

**Key Features:**
- ✅ Users can mint by paying 0.0001 ETH
- ✅ Owner can withdraw collected ETH anytime
- ✅ Proper payment handling and refunds
- ✅ Easy withdrawal via Basescan
- ✅ Contract balance tracking

**Ready to deploy!** 🚀
