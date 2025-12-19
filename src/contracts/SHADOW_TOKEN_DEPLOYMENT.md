# $SHADOW Token Deployment Guide

## Overview
$SHADOW is the native ERC20 token for FrameFusion Genesis ecosystem. This guide explains how to deploy and integrate it.

## Contract Details

### Source: `ShadowToken.sol`
- **Standard**: ERC20 with Burnable extension
- **Initial Supply**: 100,000,000 $SHADOW (100 million)
- **Max Supply**: 1,000,000,000 $SHADOW (1 billion)
- **Decimals**: 18 (standard ERC20)
- **Features**: 
  - Owner-only minting (capped at max supply)
  - Public burning with reason tracking
  - Batch minting for airdrops/rewards
  - Event logging for all operations

## Deployment Steps

### 1. Deploy $SHADOW Token Contract

```bash
# Using Hardhat or Forge
forge create src/contracts/ShadowToken.sol:ShadowToken \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --verify
```

### 2. Update Contract Address

After deployment, update the address in `src/lib/shadow-contract.ts`:

```typescript
export const SHADOW_TOKEN_CONTRACT = {
  address: '0xYOUR_DEPLOYED_SHADOW_TOKEN_ADDRESS', // Update this!
  // ... rest of config
};
```

### 3. Initial Token Distribution

Distribute initial $SHADOW supply:

```typescript
// Example distribution plan:
// - 40% (40M): Community rewards & staking
// - 20% (20M): Team & development
// - 20% (20M): Marketing & partnerships
// - 15% (15M): Initial liquidity
// - 5% (5M): Reserve

// Owner calls mint() to distribute:
await shadowToken.mint(
  treasuryAddress,
  parseUnits('40000000', 18),
  'Community rewards pool'
);

await shadowToken.mint(
  teamAddress,
  parseUnits('20000000', 18),
  'Team allocation'
);

// ... etc
```

### 4. Setup Treasury Address

Update treasury address in `src/lib/shadow-contract.ts`:

```typescript
export const SHADOW_TREASURY_ADDRESS = '0xYOUR_TREASURY_ADDRESS';
```

This is where all minting payment $SHADOW tokens will go.

## Integration with Existing Contracts

### Monster NFT Contract (FrameShadows)

The monster minting flow now:
1. User approves $SHADOW spending to FrameShadows contract
2. User calls `mintMonster(...)` with 0 ETH
3. Frontend transfers 100 $SHADOW to treasury
4. Monster NFT is minted

**No smart contract changes needed** - payment is handled in frontend.

### Weapon NFT Contract (WeaponNFT)

Same flow as Monster NFT:
1. User approves $SHADOW spending
2. User calls `mintWeapon(...)` with 0 ETH
3. Frontend transfers $SHADOW (amount varies by rarity)
4. Weapon NFT is minted

## Verifying Integration

After deployment:

1. **Check balance on blockchain**:
   ```typescript
   const balance = await shadowToken.balanceOf(userAddress);
   console.log('Balance:', formatUnits(balance, 18), '$SHADOW');
   ```

2. **Test approval flow**:
   ```typescript
   // Approve spending
   await shadowToken.approve(
     frameShadowsAddress,
     parseUnits('100', 18)
   );
   
   // Check allowance
   const allowance = await shadowToken.allowance(
     userAddress,
     frameShadowsAddress
   );
   console.log('Approved:', formatUnits(allowance, 18), '$SHADOW');
   ```

3. **Test transfer**:
   ```typescript
   await shadowToken.transfer(
     treasuryAddress,
     parseUnits('100', 18)
   );
   ```

## Frontend Integration Status

✅ **Already integrated** in:
- `src/components/monster-generator.tsx` - Monster minting with $SHADOW
- `src/lib/shadow-contract.ts` - $SHADOW token utilities

🔄 **Needs update**:
- `src/components/weapon-mint-panel.tsx` - Weapon minting (similar to monster)
- Any other components that use $SHADOW

## Migration from Database Balance

**Before deployment**:
- User $SHADOW balances were stored in Supabase `shadow_balances` table
- API endpoints read/write from database

**After deployment**:
- User $SHADOW balances are on-chain (ERC20 balanceOf)
- Approval + transfer pattern replaces database deduction
- Database tables can be kept for transaction history/analytics

**Migration script** (if needed):
```typescript
// Airdrop on-chain $SHADOW to match database balances
const users = await supabase
  .from('shadow_balances')
  .select('*');

for (const user of users.data) {
  // Get user's wallet address from FID
  const address = await getAddressFromFID(user.fid);
  
  // Mint $SHADOW to their address
  await shadowToken.mint(
    address,
    parseUnits(user.balance.toString(), 18),
    'Database migration'
  );
}
```

## Security Considerations

1. **Owner Private Key**: Keep deployer/owner private key secure - it can mint new tokens
2. **Max Supply**: Hard capped at 1 billion - no one can exceed this
3. **Approval Pattern**: Users must explicitly approve spending before transfers
4. **Treasury Security**: Use multi-sig or secure wallet for treasury address

## Testing Checklist

- [ ] Deploy $SHADOW contract to testnet (Base Sepolia)
- [ ] Verify on block explorer (BaseScan)
- [ ] Test minting by owner
- [ ] Test user approve + transfer flow
- [ ] Test monster minting with $SHADOW payment
- [ ] Test weapon minting with $SHADOW payment
- [ ] Deploy to mainnet (Base)
- [ ] Update all frontend addresses
- [ ] Verify production integration

## Useful Commands

```bash
# Check total supply
cast call $SHADOW_ADDRESS "totalSupply()(uint256)" --rpc-url $BASE_RPC

# Check balance
cast call $SHADOW_ADDRESS "balanceOf(address)(uint256)" $USER_ADDRESS --rpc-url $BASE_RPC

# Transfer (owner)
cast send $SHADOW_ADDRESS "transfer(address,uint256)" $TO_ADDRESS $AMOUNT --private-key $PK --rpc-url $BASE_RPC
```

## Support

For issues or questions:
- Check contract on BaseScan: https://basescan.org/address/YOUR_ADDRESS
- Review transaction logs for detailed error messages
- Ensure users have sufficient $SHADOW balance before minting
