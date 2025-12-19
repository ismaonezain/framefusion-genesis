/**
 * BattleArena Contract Integration
 * On-chain battle system with role-based access control
 */

import { parseUnits } from 'viem';

// BattleArena Contract Configuration
export const BATTLE_ARENA_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  abi: [
    {
      inputs: [
        { name: 'monsterTokenId', type: 'uint256' },
        { name: 'frameFusionClass', type: 'uint8' },
        { name: 'monsterElement', type: 'uint8' },
        { name: 'entryFee', type: 'uint256' },
        { name: 'weaponTokenId', type: 'uint256' }
      ],
      name: 'executeBattle',
      outputs: [{ name: '', type: 'bytes32' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'user', type: 'address' }],
      name: 'getRemainingBattles',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'battleId', type: 'bytes32' }],
      name: 'getBattle',
      outputs: [
        {
          components: [
            { name: 'frameFusionOwner', type: 'address' },
            { name: 'monsterOwner', type: 'address' },
            { name: 'monsterTokenId', type: 'uint256' },
            { name: 'entryFee', type: 'uint256' },
            { name: 'frameFusionReward', type: 'uint256' },
            { name: 'monsterOwnerReward', type: 'uint256' },
            { name: 'treasuryAmount', type: 'uint256' },
            { name: 'raffleAmount', type: 'uint256' },
            { name: 'frameFusionClass', type: 'uint8' },
            { name: 'monsterElement', type: 'uint8' },
            { name: 'powerMultiplier', type: 'uint16' },
            { name: 'elementMultiplier', type: 'uint16' },
            { name: 'weaponMultiplier', type: 'uint16' },
            { name: 'timestamp', type: 'uint256' }
          ],
          name: '',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalBattles',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'MAX_DAILY_BATTLES',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'FREE_REWARD',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'STANDARD_MIN',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'STANDARD_MAX',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'PREMIUM_MIN',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'PREMIUM_MAX',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'battleId', type: 'bytes32' },
        { indexed: true, name: 'frameFusionOwner', type: 'address' },
        { indexed: true, name: 'monsterOwner', type: 'address' },
        { indexed: false, name: 'entryFee', type: 'uint256' },
        { indexed: false, name: 'frameFusionReward', type: 'uint256' }
      ],
      name: 'BattleExecuted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'battleId', type: 'bytes32' },
        { indexed: false, name: 'frameFusionReward', type: 'uint256' },
        { indexed: false, name: 'monsterOwnerReward', type: 'uint256' },
        { indexed: false, name: 'treasuryAmount', type: 'uint256' },
        { indexed: false, name: 'raffleAmount', type: 'uint256' }
      ],
      name: 'RewardsDistributed',
      type: 'event',
    },
  ],
} as const;

// Entry tier types
export type EntryTier = 'free' | 'standard' | 'premium';

// Battle entry parameters
export interface BattleEntryParams {
  monsterTokenId: number;
  frameFusionClass: number; // 0-19 class enum
  monsterElement: number;   // 0-8 element enum
  entryFee: bigint;         // In wei
  weaponTokenId: number;    // 0 if no weapon
}

// Battle result from contract
export interface OnChainBattleResult {
  frameFusionOwner: `0x${string}`;
  monsterOwner: `0x${string}`;
  monsterTokenId: bigint;
  entryFee: bigint;
  frameFusionReward: bigint;
  monsterOwnerReward: bigint;
  treasuryAmount: bigint;
  raffleAmount: bigint;
  frameFusionClass: number;
  monsterElement: number;
  powerMultiplier: number;
  elementMultiplier: number;
  weaponMultiplier: number;
  timestamp: bigint;
}

// FrameFusion class names to enum mapping
export const CLASS_NAME_TO_ENUM: Record<string, number> = {
  'Swordmaster': 0,
  'Shadow Assassin': 1,
  'Holy Knight': 2,
  'Battle Mage': 3,
  'Archer Ranger': 4,
  'Tech Hacker': 5,
  'Street Fighter': 6,
  'Musician Bard': 7,
  'Chef Artisan': 8,
  'Photographer Scout': 9,
  'Gunslinger': 10,
  'Medic Healer': 11,
  'Engineer Builder': 12,
  'Detective Investigator': 13,
  'Athlete Champion': 14,
  'Beast Tamer': 15,
  'Alchemist Sage': 16,
  'Samurai Duelist': 17,
  'Ninja Operative': 18,
  'Dragon Knight': 19,
};

// Element names to enum mapping
export const ELEMENT_NAME_TO_ENUM: Record<string, number> = {
  'Fire': 0,
  'Ice': 1,
  'Dark': 2,
  'Lightning': 3,
  'Poison': 4,
  'Nature': 5,
  'Metal': 6,
  'Arcane': 7,
  'Chaos': 8,
};

// Reverse mappings
export const ENUM_TO_CLASS_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(CLASS_NAME_TO_ENUM).map(([k, v]) => [v, k])
);

export const ENUM_TO_ELEMENT_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(ELEMENT_NAME_TO_ENUM).map(([k, v]) => [v, k])
);

// Entry tier limits
export const ENTRY_TIER_LIMITS = {
  free: {
    min: 0n,
    max: 0n,
    reward: parseUnits('100', 18), // 100 SHADOW
  },
  standard: {
    min: parseUnits('5000', 18),
    max: parseUnits('500000', 18),
  },
  premium: {
    min: parseUnits('500000', 18),
    max: parseUnits('5000000', 18),
  },
} as const;

/**
 * Validate entry fee for tier
 */
export function validateEntryFee(tier: EntryTier, amount: bigint): boolean {
  const limits = ENTRY_TIER_LIMITS[tier];
  if (tier === 'free') {
    return amount === 0n;
  }
  return amount >= limits.min && amount <= limits.max;
}

/**
 * Format battle result for display
 */
export function formatBattleResult(result: OnChainBattleResult) {
  return {
    frameFusionOwner: result.frameFusionOwner,
    monsterOwner: result.monsterOwner,
    monsterTokenId: Number(result.monsterTokenId),
    entryFee: Number(result.entryFee) / 1e18,
    frameFusionReward: Number(result.frameFusionReward) / 1e18,
    monsterOwnerReward: Number(result.monsterOwnerReward) / 1e18,
    treasuryAmount: Number(result.treasuryAmount) / 1e18,
    raffleAmount: Number(result.raffleAmount) / 1e18,
    frameFusionClass: ENUM_TO_CLASS_NAME[result.frameFusionClass] || 'Unknown',
    monsterElement: ENUM_TO_ELEMENT_NAME[result.monsterElement] || 'Unknown',
    powerMultiplier: result.powerMultiplier / 100,
    elementMultiplier: result.elementMultiplier / 100,
    weaponMultiplier: result.weaponMultiplier / 100,
    timestamp: new Date(Number(result.timestamp) * 1000),
  };
}

/**
 * Calculate expected rewards (for UI preview)
 * This mirrors the contract logic
 */
export function calculateExpectedRewards(
  entryFee: bigint,
  powerMultiplier: number,
  elementMultiplier: number,
  weaponMultiplier: number,
  isPremium: boolean
): {
  frameFusionReward: bigint;
  monsterOwnerReward: bigint;
  treasuryAmount: bigint;
  raffleAmount: bigint;
} {
  if (entryFee === 0n) {
    return {
      frameFusionReward: parseUnits('100', 18), // Free tier: 100 SHADOW
      monsterOwnerReward: 0n,
      treasuryAmount: 0n,
      raffleAmount: 0n,
    };
  }

  // Fee distribution (basis points)
  const FEE_WINNER = 5000n;        // 50%
  const FEE_MONSTER_OWNER = 2500n; // 25%
  const FEE_TREASURY = 1500n;      // 15%
  const FEE_RAFFLE = 1000n;        // 10%

  // Base pool (50% of entry fee)
  const basePool = (entryFee * FEE_WINNER) / 10000n;

  // Apply multipliers (basis points: 100 = 1x, 150 = 1.5x, etc.)
  let frameFusionReward = (basePool * BigInt(powerMultiplier) * BigInt(elementMultiplier) * BigInt(weaponMultiplier)) / 1000000n;

  // Premium bonus (120% = 1.2x)
  if (isPremium) {
    frameFusionReward = (frameFusionReward * 120n) / 100n;
  }

  // Fixed distributions
  const monsterOwnerReward = (entryFee * FEE_MONSTER_OWNER) / 10000n;
  const treasuryAmount = (entryFee * FEE_TREASURY) / 10000n;
  const raffleAmount = (entryFee * FEE_RAFFLE) / 10000n;

  return {
    frameFusionReward,
    monsterOwnerReward,
    treasuryAmount,
    raffleAmount,
  };
}

/**
 * Get class enum from class name
 */
export function getClassEnum(className: string): number {
  return CLASS_NAME_TO_ENUM[className] ?? 0;
}

/**
 * Get element enum from element name
 */
export function getElementEnum(elementName: string): number {
  return ELEMENT_NAME_TO_ENUM[elementName] ?? 0;
}
