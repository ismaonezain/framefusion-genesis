# 💰 FrameShadows Monster Payment Flow

## Overview
Sistem pembayaran monster NFT menggunakan smart contract untuk receive dan manage ETH dari minting.

---

## 💸 Payment Flow

### 1. **User Mint Monster (0.0001 ETH)**
```
User clicks "Mint Monster" button
     ↓
Wallet prompt: Pay 0.0001 ETH
     ↓
Transaction sent to contract
     ↓
ETH masuk ke contract address
```

### 2. **Where Does the ETH Go?**

**Contract Address:** `0xd376663E063A6E1A115b0ad4B3ABA70353e46f0f` (Base Network)

Semua pembayaran 0.0001 ETH dari minting **langsung masuk ke smart contract address** ini.

ETH tersebut akan **tersimpan di dalam contract** sampai owner withdraw.

---

## 🔐 Withdrawal Process

### **Only Contract Owner Can Withdraw**

Owner contract (yang deploy contract) bisa withdraw ETH kapan saja dengan cara:

#### Option 1: Via Etherscan (Easiest)
1. Buka [Basescan](https://basescan.org/address/0xd376663E063A6E1A115b0ad4B3ABA70353e46f0f)
2. Connect wallet (harus wallet yang deploy contract)
3. Cari function `withdraw()`
4. Execute → ETH akan transfer ke owner wallet

#### Option 2: Via Code (Programmatically)
```typescript
import { writeContract } from '@wagmi/core';

const withdrawFunds = async () => {
  await writeContract({
    address: '0xd376663E063A6E1A115b0ad4B3ABA70353e46f0f',
    abi: FRAMESHADOWS_CONTRACT.abi,
    functionName: 'withdraw',
    args: [],
  });
};
```

---

## 📊 Tracking Payments

### Check Contract Balance
```bash
# Via Basescan
https://basescan.org/address/0xd376663E063A6E1A115b0ad4B3ABA70353e46f0f

# Shows:
# - Balance: Total ETH in contract
# - Transactions: List of all mints
```

### Calculate Expected Balance
```
Total Mints × 0.0001 ETH = Expected Balance

Example:
- 10 monsters minted = 0.001 ETH
- 50 monsters minted = 0.005 ETH
- 100 monsters minted = 0.01 ETH
```

---

## 🛡️ Security Features

### **1. Owner-Only Withdrawal**
- Hanya wallet yang deploy contract bisa withdraw
- Tidak ada orang lain yang bisa ambil ETH

### **2. All ETH Goes to Contract**
- ETH tidak langsung masuk ke owner wallet
- Semua payment tracked on-chain
- Transparent dan auditable

### **3. Contract Address is Immutable**
- Address tidak bisa diubah setelah deploy
- ETH aman tersimpan di contract

---

## 💡 Best Practices

### **1. Regular Withdrawals**
- Withdraw ETH secara berkala untuk keamanan
- Jangan simpan terlalu banyak ETH di contract

### **2. Track Your Mints**
- Monitor Basescan untuk lihat semua transactions
- Cross-check dengan database monsters

### **3. Test Withdrawals**
- Test withdraw dengan small amount dulu
- Pastikan wallet owner correct

---

## 🔍 Example Scenario

```
Day 1:
- User A mints monster → 0.0001 ETH masuk contract
- User B mints monster → 0.0001 ETH masuk contract
- Contract balance: 0.0002 ETH

Day 2:
- Owner withdraw → 0.0002 ETH masuk owner wallet
- Contract balance: 0 ETH

Day 3:
- User C mints monster → 0.0001 ETH masuk contract
- User D mints monster → 0.0001 ETH masuk contract  
- Contract balance: 0.0002 ETH

...and so on
```

---

## ⚠️ Important Notes

1. **ETH masuk ke contract, bukan owner wallet langsung**
2. **Owner harus manual withdraw** (tidak auto)
3. **Gas fees apply** untuk withdraw (minimal ~$0.01)
4. **Check Basescan** untuk verify balance sebelum withdraw
5. **Only owner wallet** yang bisa withdraw

---

## 📞 Troubleshooting

### "Insufficient funds" Error
- User tidak punya cukup ETH di wallet
- Need minimum: 0.0001 ETH + gas fees (~0.00005 ETH)

### "Withdrawal failed"
- Pastikan wallet yang connect adalah owner wallet
- Pastikan ada balance di contract

### "Transaction reverted"
- Contract balance mungkin 0
- Atau bukan owner yang call withdraw

---

## 🎯 Summary

```
1. User pays 0.0001 ETH → Contract receives ETH
2. ETH stored in contract → Safe and tracked
3. Owner withdraws → ETH goes to owner wallet
```

Simple, secure, transparent! ✅
