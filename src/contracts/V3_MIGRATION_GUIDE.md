# FrameFusion Genesis V3 - Migration Guide

## 🎯 Multi-NFT Support

V3 contract **fully supports users owning multiple NFTs**, including NFTs purchased from secondary markets like OpenSea!

---

## 📊 Common Scenarios

### **Scenario 1: Original Minter**
```
User A (FID 123) → Mints NFT #123 in V2
    ↓
User A migrates → Gets V3 NFT with FID 123
✅ Works perfectly
```

### **Scenario 2: Buyer from OpenSea**
```
User A (FID 123) → Mints NFT #123
User B (FID 456) → Mints NFT #456
    ↓
User B buys NFT #123 from OpenSea
User B now owns: NFT #123 (FID 123) + NFT #456 (FID 456)
    ↓
User B migrates both NFTs:
  1. Migrate NFT #123 → V3 NFT with FID 123 ✅
  2. Migrate NFT #456 → V3 NFT with FID 456 ✅
    ↓
User B now has 2 V3 NFTs with different FIDs!
✅ Both migrations work!
```

### **Scenario 3: Collector with Many NFTs**
```
User C buys 10 NFTs from OpenSea
Each NFT has different original FID
    ↓
User C can migrate ALL 10 NFTs
Each V3 NFT keeps its original FID and traits
✅ No restrictions!
```

---

## 🔧 How It Works

### **V2 Contract (Original):**
- Each FID can only mint ONCE
- NFTs are tradeable on OpenSea after mint
- FID stored in NFT metadata (immutable)

### **V3 Contract (New):**
- **No FID restrictions for migration!**
- Each V2 token can only migrate ONCE (prevents double-migration)
- Owner verification: Only current V2 NFT owner can migrate
- V3 NFT keeps original FID from V2 (for traits/metadata)

### **Key Contract Changes:**

**Removed:**
```solidity
❌ mapping(uint256 => bool) public hasMinted; // FID => has minted
❌ require(!hasMinted[_fid], "FID already minted in V3");
```

**Kept:**
```solidity
✅ mapping(uint256 => uint256) public v2ToV3TokenId; // V2 Token ID => V3 Token ID
✅ require(v2ToV3TokenId[_v2TokenId] == 0, "V2 token already migrated");
✅ require(v2Contract.ownerOf(_v2TokenId) == msg.sender, "Not owner");
```

---

## 💡 Benefits

### **For Users:**
✅ **Buy NFTs freely** on OpenSea without migration worries
✅ **Collect multiple NFTs** from different FIDs
✅ **Each NFT keeps original identity** (FID, artwork, traits)
✅ **No artificial restrictions** on ownership

### **For Project:**
✅ **Encourages secondary market trading** (good for volume/royalties)
✅ **Collectors can own multiple pieces** (better engagement)
✅ **Professional NFT standard** (no weird restrictions)
✅ **Future-proof design** (scales with community)

---

## 📋 Migration Flow

### **Step 1: User Owns V2 NFT(s)**
User can own 1 or multiple V2 NFTs (original mint or purchased)

### **Step 2: Approve V3 Contract**
For each NFT, user approves V3 contract to transfer it:
```solidity
v2Contract.approve(v3ContractAddress, tokenId);
```

### **Step 3: Migrate Each NFT**
User calls migration for each NFT they own:
```solidity
v3Contract.migrateFromV2(v2TokenId, fid, tokenURI);
```

**Contract checks:**
- ✅ User owns V2 NFT
- ✅ V2 NFT not already migrated
- ✅ Max supply not reached

**Contract executes:**
- Burns V2 NFT (transfer to dead address)
- Mints V3 NFT to user with same FID
- Records migration to prevent double-migration

### **Step 4: Enjoy V3 Benefits**
- Dynamic metadata with traits
- Engagement-based achievements
- Visible on OpenSea & all marketplaces

---

## 🎨 Metadata & Traits

### **Each V3 NFT maintains:**

**Original Traits** (from FID):
- Character Class
- Gender
- Background
- Color Palette
- Clothing
- Accessories

**Dynamic Traits** (from current owner's engagement):
- Loyalty Tier (based on check-in streak)
- Total $TRIA Claimed
- Achievements earned
- Leaderboard ranking

**Example:**
```
User B owns NFT with FID 123 (bought from User A)
    ↓
V3 Metadata API returns:
- Base Traits: Character/Background from FID 123 (original)
- Dynamic Traits: Loyalty/Achievements from User B (current owner)
```

This way NFT **artwork/identity stays consistent**, but **engagement rewards go to current owner**!

---

## 🚀 Gas Costs (Base Network)

**Per NFT Migration:**
- Approve: ~50k gas (~$0.20)
- Migrate: ~200k gas (~$0.70)
- **Total: ~$0.90 per NFT**

**Example for 5 NFTs:**
- Total cost: ~$4.50
- Still cheaper than minting fresh on Ethereum mainnet!

---

## 📊 Contract Deployment Checklist

### **Before Deploy:**
- [ ] Test contract on Base Sepolia testnet
- [ ] Verify multi-NFT migration scenarios
- [ ] Test with multiple FIDs per user
- [ ] Verify metadata API endpoints

### **Deploy Steps:**
1. Deploy V3 contract with V2 address: `0xD308c4734D9460717485040D07B7dE7e44718A11`
2. Verify contract on BaseScan
3. Update `NFT_CONTRACT_ADDRESS_V3` in codebase
4. Test migration with 1 NFT
5. Test migration with multiple NFTs from same user
6. Announce to community

### **After Deploy:**
- [ ] Update frontend with V3 contract address
- [ ] Test migration UI with multiple NFTs
- [ ] Monitor first migrations for issues
- [ ] Track analytics (migration rate, multi-NFT users)

---

## ✅ Summary

**V3 Migration System:**
- ✅ Supports unlimited NFTs per user
- ✅ Each V2 token migrates only once
- ✅ Original FID & traits preserved
- ✅ Current owner gets engagement rewards
- ✅ OpenSea trading fully supported
- ✅ No artificial restrictions
- ✅ Gas-efficient on Base network

**Perfect for collectors and secondary market trading!** 🎉
