# BattleArena Contract Deployment Guide

## Overview

The BattleArena contract implements **fully on-chain battle verification** for FrameFusion Genesis with **role-based access control** for secure treasury management.

## ✅ Key Features

### 1. **On-Chain Battle Logic**
- Class vs Element advantages (deterministic)
- Power multipliers based on monster rarity
- Weapon bonuses (rarity, level, class match)
- Transparent event logging
- Immutable battle history

### 2. **Role-Based Treasury Management** 🔐
- **No Private Keys in Backend!**
- **BATTLE_OPERATOR_ROLE**: Can execute battles (backend service account)
- **TREASURY_MANAGER_ROLE**: Can update treasury/raffle wallets
- **DEFAULT_ADMIN_ROLE**: Emergency controls only
- Backend CANNOT drain funds or withdraw tokens

### 3. **Security Features**
- ReentrancyGuard prevents reentrancy attacks
- Pausable for emergency stops
- Daily battle limits enforced on-chain
- All transfers verified and logged

## 📋 Deployment Steps

### Step 1: Deploy Contracts (if needed)

If you haven't deployed $SHADOW token yet:

```bash
# 1. Deploy ShadowToken first
forge create src/contracts/ShadowToken.sol:ShadowToken \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --verify

# Save the deployed address!
SHADOW_TOKEN_ADDRESS=<deployed_address>
```

### Step 2: Deploy BattleArena

```bash
# Deploy BattleArena contract
forge create src/contracts/BattleArena.sol:BattleArena \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args \
    $SHADOW_TOKEN_ADDRESS \
    0xC53B19ea5EE1fa5dFCe12CdAD71813bee27f4B31 \
    0xEE24F39b5C8a444e46F26Dc858D61374cb7c9b1c \
    $TREASURY_WALLET_ADDRESS \
    $RAFFLE_POOL_WALLET_ADDRESS \
  --verify

# Save this address!
BATTLE_ARENA_ADDRESS=<deployed_address>
```

Constructor parameters:
1. **$SHADOW Token Address**: Address of deployed ShadowToken.sol
2. **FrameShadows NFT**: `0xC53B19ea5EE1fa5dFCe12CdAD71813bee27f4B31` (already deployed)
3. **WeaponNFT**: `0xEE24F39b5C8a444e46F26Dc858D61374cb7c9b1c` (already deployed)
4. **Treasury Wallet**: Your treasury address (can be updated later)
5. **Raffle Pool Wallet**: Your raffle pool address (can be updated later)

### Step 3: Grant Roles

The deployer automatically gets all roles. Now grant backend service role:

```bash
# Grant BATTLE_OPERATOR_ROLE to backend service account
# This account can ONLY execute battles, cannot withdraw funds
cast send $BATTLE_ARENA_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "BATTLE_OPERATOR_ROLE") \
  $BACKEND_SERVICE_ADDRESS \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Step 4: Setup $SHADOW Allowance

The BattleArena needs to be able to transfer $SHADOW on behalf of users:

**Option A: Users approve before battle** (Recommended)
- Frontend requests user approval for specific battle amount
- Most secure, user controls every transaction

**Option B: Pre-approve maximum**
- User approves large amount once
- Convenient but less secure

### Step 5: Update Config Files

```typescript
// src/lib/battle-arena-contract.ts
export const BATTLE_ARENA_CONTRACT = {
  address: '<BATTLE_ARENA_ADDRESS>', // Update this!
  abi: [ /* ... */ ],
} as const;

// src/lib/shadow-contract.ts
export const SHADOW_TOKEN_CONTRACT = {
  address: '<SHADOW_TOKEN_ADDRESS>', // Update this!
  abi: [ /* ... */ ],
} as const;
```

## 🔐 Role-Based Access Explanation

### Why This is Secure:

**Problem with Private Keys:**
```
❌ Backend stores private key → Anyone with access can drain ALL funds
❌ Single point of failure → Hack = total loss
❌ No audit trail → Can't track who did what
```

**Solution with Roles:**
```
✅ Backend has BATTLE_OPERATOR_ROLE → Can ONLY execute battles
✅ Cannot call emergencyWithdraw() → Funds are safe
✅ Cannot change treasury addresses → Requires TREASURY_MANAGER_ROLE
✅ All actions logged on-chain → Full transparency
✅ Role can be revoked if compromised → Instant security
```

### Role Permissions:

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **BATTLE_OPERATOR** | Execute battles, validate fights | Withdraw funds, change config |
| **TREASURY_MANAGER** | Update treasury/raffle wallets | Execute battles, withdraw |
| **DEFAULT_ADMIN** | Emergency pause, grant/revoke roles | Normal operations |

### Backend Service Account Setup:

1. Create a **separate wallet** for backend service
2. Fund it with small amount for gas fees only
3. Grant BATTLE_OPERATOR_ROLE to this wallet
4. Store private key in backend (but it's limited power!)
5. Even if hacked, attacker can only pay gas for battles

## 🚀 Battle Flow

### User-Signed Approach (Most Secure):

```typescript
// 1. Frontend: User approves $SHADOW spending
const approveTx = await shadowContract.write.approve([
  BATTLE_ARENA_ADDRESS,
  entryAmount
]);

// 2. Frontend: User signs battle transaction
const battleTx = await battleArenaContract.write.executeBattle([
  monsterTokenId,
  frameFusionClass,
  monsterElement,
  entryAmount,
  weaponTokenId || 0
]);

// 3. Backend: Just records result in database for caching
await fetch('/api/battle/record', {
  method: 'POST',
  body: JSON.stringify({ txHash: battleTx.hash })
});
```

### Backend-Validated Approach:

```typescript
// 1. Frontend: Request battle validation
const validation = await fetch('/api/battle/validate', {
  method: 'POST',
  body: JSON.stringify({
    monsterTokenId,
    frameFusionClass,
    entryAmount
  })
});

// 2. Backend validates:
// - Daily limit not exceeded (read from contract)
// - User has sufficient $SHADOW balance
// - Monster ownership is valid
// - Returns: { canBattle: true, gasEstimate: xxx }

// 3. Frontend: User approves + executes
// (Same as above)
```

## 📊 Monitoring & Analytics

### Read Battle Data:

```bash
# Get user's remaining battles
cast call $BATTLE_ARENA_ADDRESS \
  "getRemainingBattles(address)" \
  $USER_ADDRESS \
  --rpc-url $BASE_RPC_URL

# Get battle details
cast call $BATTLE_ARENA_ADDRESS \
  "getBattle(bytes32)" \
  $BATTLE_ID \
  --rpc-url $BASE_RPC_URL

# Get total battles
cast call $BATTLE_ARENA_ADDRESS \
  "totalBattles()" \
  --rpc-url $BASE_RPC_URL
```

### Listen to Events:

```typescript
// Listen for BattleExecuted events
const filter = await battleArenaContract.createEventFilter.BattleExecuted();
const events = await battleArenaContract.getEvents.BattleExecuted();

// Update database with on-chain battle results
for (const event of events) {
  await database.battles.create({
    battleId: event.args.battleId,
    frameFusionOwner: event.args.frameFusionOwner,
    monsterOwner: event.args.monsterOwner,
    // ...
  });
}
```

## 🔧 Maintenance

### Update Treasury Wallet:

```bash
# Only works if caller has TREASURY_MANAGER_ROLE
cast send $BATTLE_ARENA_ADDRESS \
  "updateTreasuryWallet(address)" \
  $NEW_TREASURY_ADDRESS \
  --rpc-url $BASE_RPC_URL \
  --private-key $TREASURY_MANAGER_KEY
```

### Pause Contract (Emergency):

```bash
# Only DEFAULT_ADMIN_ROLE can pause
cast send $BATTLE_ARENA_ADDRESS \
  "pause()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $ADMIN_KEY
```

### Revoke Compromised Role:

```bash
# If backend service account is compromised:
cast send $BATTLE_ARENA_ADDRESS \
  "revokeRole(bytes32,address)" \
  $(cast keccak "BATTLE_OPERATOR_ROLE") \
  $COMPROMISED_ADDRESS \
  --rpc-url $BASE_RPC_URL \
  --private-key $ADMIN_KEY
```

## ✅ Testing Checklist

Before mainnet deployment:

- [ ] Deploy to testnet (Base Sepolia)
- [ ] Test battle with free tier
- [ ] Test battle with standard tier
- [ ] Test battle with premium tier
- [ ] Test daily limit (3 battles)
- [ ] Test with equipped weapon
- [ ] Test with no weapon
- [ ] Verify reward calculations match off-chain logic
- [ ] Test role permissions (try unauthorized actions)
- [ ] Test pause/unpause functionality
- [ ] Monitor gas costs
- [ ] Verify all events emit correctly

## 🎯 Next Steps

After deployment:

1. **Update Frontend**: Integrate with battle UI
2. **Update API**: Replace off-chain battle logic with on-chain calls
3. **Database Migration**: Sync existing battles to on-chain format
4. **User Communication**: Announce on-chain battles
5. **Monitor**: Watch for any issues in first week

## 📝 Contract Addresses

Update these after deployment:

```
BattleArena: 0x___________________
ShadowToken: 0x___________________
FrameShadows: 0xC53B19ea5EE1fa5dFCe12CdAD71813bee27f4B31 (existing)
WeaponNFT: 0xEE24F39b5C8a444e46F26Dc858D61374cb7c9b1c (existing)
```

## 🛡️ Security Considerations

1. **Multisig for Admin Role**: Use Gnosis Safe for DEFAULT_ADMIN_ROLE
2. **Role Rotation**: Periodically rotate BATTLE_OPERATOR keys
3. **Monitor Events**: Set up alerts for suspicious activity
4. **Rate Limiting**: Backend should still rate-limit requests
5. **Gas Price Monitoring**: Watch for gas price spikes
6. **Upgrade Path**: Consider using proxy pattern for future upgrades

## 💡 Benefits vs Off-Chain

| Feature | Off-Chain | On-Chain |
|---------|-----------|----------|
| **Transparency** | ❌ Database can be modified | ✅ Immutable blockchain |
| **Trust** | ❌ Users trust backend | ✅ Trust code, not operators |
| **Verifiability** | ❌ No public verification | ✅ Anyone can verify |
| **Security** | ❌ Single DB compromise | ✅ Multi-role access control |
| **Composability** | ❌ Isolated system | ✅ Other contracts can integrate |

## 🎮 Game Economy Impact

With on-chain battles:
- Players can verify all rewards are fair
- Third-party analytics tools can track economy
- Potential for player-run tournaments
- Integration with other DeFi protocols possible
- NFT battle history increases value

---

**Ready to deploy? Let's make FrameFusion Genesis fully on-chain! 🚀**
