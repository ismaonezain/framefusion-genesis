# Weapon NFT System Deployment Guide

## Overview

The Weapon NFT system provides 20 unique weapon types matching the FrameFusion character classes. Players can mint weapons, upgrade them (with risk of breaking at higher levels), and equip them to their FrameFusions for battle bonuses.

## Features

- **20 Weapon Types**: One weapon type for each FrameFusion character class
- **4 Rarity Tiers**: Common, Rare, Epic, Legendary
- **Class Match Bonus**: +30% battle power when weapon class matches FrameFusion class
- **Upgrade System**: Level 1-10 with increasing difficulty and rewards
- **Breaking Mechanic**: Level 6+ upgrades have 30% chance to break weapon on failure
- **Reserve Funding**: All mint costs and upgrade fees go to reserve address
- **OpenSea Compatible**: Standard ERC-721 with full metadata support

---

## Deployment Steps

### 1. Deploy Smart Contract

Deploy `WeaponNFT.sol` to Base blockchain:

```bash
# Using Hardhat/Foundry
forge create WeaponNFT \
  --constructor-args <RESERVE_ADDRESS> \
  --rpc-url https://mainnet.base.org \
  --private-key <DEPLOYER_PRIVATE_KEY>
```

**Constructor Parameter:**
- `_reserveAddress`: Address where all mint fees and upgrade costs are sent

**Note the deployed contract address** and update in `src/lib/weapon-contract.ts`:

```typescript
export const WEAPON_NFT_CONTRACT = {
  address: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS',
  // ...rest of config
};
```

---

### 2. Setup Database Schema

Run the SQL schema in your Supabase dashboard:

```bash
# In Supabase SQL Editor, run:
# src/contracts/WEAPONS_SCHEMA.sql
```

This creates:
- `weapons` table (stores all minted weapons)
- `weapon_upgrade_history` table (tracks upgrade attempts)
- `weapon_equipment_history` table (tracks equipment changes)
- Views for stats and leaderboards
- Triggers for auto-updating stats

---

### 3. Configure Mint Costs (Optional)

Default mint costs (adjustable via contract owner):

| Rarity | Cost (wei) | $SHADOW Equivalent |
|--------|------------|-------------------|
| Common | 0.0001 ether | 100 $SHADOW |
| Rare | 0.0003 ether | 300 $SHADOW |
| Epic | 0.0008 ether | 800 $SHADOW |
| Legendary | 0.002 ether | 2000 $SHADOW |

To update costs:

```solidity
// Call as contract owner
weaponNFT.updateMintCost(Rarity.Common, 0.0002 ether);
```

---

### 4. Verify Contract on Basescan

```bash
forge verify-contract \
  --chain-id 8453 \
  --constructor-args $(cast abi-encode "constructor(address)" <RESERVE_ADDRESS>) \
  <CONTRACT_ADDRESS> \
  src/contracts/WeaponNFT.sol:WeaponNFT \
  --etherscan-api-key <BASESCAN_API_KEY>
```

---

## Weapon Types & Class Mapping

| Class ID | FrameFusion Class | Weapon Type |
|----------|-------------------|-------------|
| 0 | Swordmaster | Twin Legendary Blades |
| 1 | Shadow Assassin | Obsidian Daggers |
| 2 | Holy Knight | Blessed Longsword |
| 3 | Battle Mage | Enchanted Staff-Sword |
| 4 | Archer Ranger | Composite Bow |
| 5 | Tech Hacker | Holographic Terminal |
| 6 | Street Fighter | Combat Gloves |
| 7 | Musician Bard | Electric Guitar |
| 8 | Chef Artisan | Chef's Knife Set |
| 9 | Photographer Scout | Pro Camera |
| 10 | Gunslinger | Dual Pistols |
| 11 | Medic Healer | Medical Kit |
| 12 | Engineer Builder | High-Tech Toolkit |
| 13 | Detective Investigator | Magnifying Glass |
| 14 | Athlete Champion | Sports Equipment |
| 15 | Beast Tamer | Summoning Orb |
| 16 | Alchemist Sage | Alchemy Vials |
| 17 | Samurai Duelist | Katana Blade |
| 18 | Ninja Operative | Kunai Set |
| 19 | Dragon Knight | Flame Spear |

---

## Upgrade Economics

### Success Rates by Level

| From → To | Success Rate | Cost ($SHADOW) | Break Risk |
|-----------|--------------|----------------|------------|
| 1 → 2 | 100% | 10 | 0% |
| 2 → 3 | 95% | 20 | 0% |
| 3 → 4 | 90% | 40 | 0% |
| 4 → 5 | 85% | 80 | 0% |
| 5 → 6 | 80% | 160 | 0% |
| 6 → 7 | 75% | 320 | 30% (on fail) |
| 7 → 8 | 70% | 640 | 30% (on fail) |
| 8 → 9 | 65% | 1,280 | 30% (on fail) |
| 9 → 10 | 60% | 2,560 | 30% (on fail) |

**Breaking Mechanic:**
- Level 6+ upgrades have **30% chance** to **destroy** the weapon if the upgrade **fails**
- Broken weapons are **burned** (removed from circulation)
- Creates scarcity and risk/reward dynamics

---

## Battle Power Calculation

When a weapon is equipped to a FrameFusion:

```typescript
totalBonus = classMatchBonus + rarityBonus + levelBonus;

// Class match bonus
classMatchBonus = weaponClass === frameFusionClass ? 30% : 0%;

// Rarity bonus
rarityBonus = {
  Common: 10%,
  Rare: 15%,
  Epic: 20%,
  Legendary: 30%
};

// Level bonus
levelBonus = (weaponLevel - 1) × 5%;

// Example: Legendary weapon (Level 5) equipped to matching class
totalBonus = 30% + 30% + 20% = 80% battle power increase
```

---

## API Endpoints

### Mint Weapon
`POST /api/weapons/mint`
```json
{
  "weaponClass": 0,
  "rarity": 3,
  "walletAddress": "0x..."
}
```

### Upgrade Weapon
`POST /api/weapons/upgrade`
```json
{
  "weaponTokenId": 123,
  "walletAddress": "0x..."
}
```

### List Weapons
`GET /api/weapons/list?address=0x...`

### Equip Weapon
`POST /api/weapons/equip`
```json
{
  "weaponTokenId": 123,
  "frameFusionTokenId": 456,
  "walletAddress": "0x..."
}
```

### Metadata (OpenSea)
`GET /api/weapons/metadata/[tokenId]`

---

## Admin Functions

### Update Mint Cost
```solidity
function updateMintCost(Rarity _rarity, uint256 _newCost) external onlyOwner
```

### Update Reserve Address
```solidity
function updateReserveAddress(address _newReserve) external onlyOwner
```

### Emergency Pause
```solidity
function pause() external onlyOwner
function unpause() external onlyOwner
```

### Manual Weapon Break (Admin Only)
```solidity
function breakWeapon(uint256 _tokenId) external onlyOwner
```

### Update Weapon Stats (Admin Only)
```solidity
function updateWeaponStats(
  uint256 _tokenId,
  uint8 _newLevel,
  uint256 _newAttackPower
) external onlyOwner
```

---

## Testing Checklist

- [ ] Deploy contract to testnet first
- [ ] Test minting all 20 weapon types
- [ ] Test all 4 rarity tiers
- [ ] Verify reserve receives mint payments
- [ ] Test equipment/unequipment
- [ ] Test upgrade success (level 1-5)
- [ ] Test upgrade failure with breaking (level 6+)
- [ ] Verify broken weapons are burned
- [ ] Test metadata endpoint for OpenSea
- [ ] Verify weapons are tradeable on OpenSea testnet
- [ ] Test database triggers and views
- [ ] Test leaderboards and stats views

---

## Economic Impact

**Weekly Projections (1000 active players):**

### Token Sink (to Reserve)
- Weapon mints: ~150,000 $SHADOW/week
- Weapon upgrades: ~45,000 $SHADOW/week
- **Total sink**: ~195,000 $SHADOW/week

### Token Creation
- None (weapons don't generate tokens)

**Net Effect:** Strong deflationary pressure on $SHADOW token supply

---

## Support & Maintenance

### Common Issues

**Q: Weapon not appearing on OpenSea?**
A: Check that metadata endpoint (`/api/weapons/metadata/[tokenId]`) returns valid JSON

**Q: Upgrade failed but cost was charged?**
A: All upgrade costs go to reserve regardless of success (this is intentional game design)

**Q: Can broken weapons be restored?**
A: No, broken weapons are permanently burned (this is intentional for scarcity)

**Q: How to generate weapon images?**
A: Use Flux connection to generate weapon art based on class and rarity

---

## Next Steps

After deployment:

1. Generate weapon artwork for all 20 types × 4 rarities (80 images total)
2. Upload images to Pinata/IPFS
3. Update metadata URIs
4. Test mint flow end-to-end
5. Launch marketing campaign
6. Monitor reserve balance and economic metrics
7. Adjust costs if needed based on player behavior

---

## License

MIT License - FrameFusion Genesis Weapon System
