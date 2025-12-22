/**
 * $SHADOW Token Contract Integration
 * Handles on-chain balance checks, transfers, and minting payments
 */

import { parseUnits } from 'viem';

// $SHADOW Token Contract Configuration
export const SHADOW_TOKEN_CONTRACT = {
  address: '0xaac86f8c049cdcfd12075538fe5ce702cf07bb07', // Deployed via Clanker
  abi: [
    {
      inputs: [],
      name: 'name',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'transferFrom',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'amount', type: 'uint256' }],
      name: 'burn',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'amount', type: 'uint256' },
        { name: 'reason', type: 'string' }
      ],
      name: 'burnWithReason',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'account', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'burnFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'reason', type: 'string' }
      ],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'rewardType', type: 'string' }
      ],
      name: 'distributeReward',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'tokenInfo',
      outputs: [
        { name: 'name_', type: 'string' },
        { name: 'symbol_', type: 'string' },
        { name: 'decimals_', type: 'uint8' },
        { name: 'totalSupply_', type: 'uint256' },
        { name: 'maxSupply_', type: 'uint256' }
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
} as const;

// $SHADOW costs for minting (in token units, 18 decimals)
export const MONSTER_MINT_SHADOW_COST = parseUnits('100', 18); // 100 $SHADOW
export const WEAPON_MINT_SHADOW_COSTS = {
  COMMON: parseUnits('100', 18),      // 100 $SHADOW
  RARE: parseUnits('300', 18),        // 300 $SHADOW
  EPIC: parseUnits('800', 18),        // 800 $SHADOW
  LEGENDARY: parseUnits('2000', 18),  // 2000 $SHADOW
};

// Treasury address where spent $SHADOW tokens go
export const SHADOW_TREASURY_ADDRESS = '0x4e3636884008f3fafc845431c3f320f6430265f7' as const; // User's main treasury wallet

/**
 * Format $SHADOW amount for display (from wei to readable number)
 */
export function formatShadowAmount(amountInWei: bigint): string {
  const value = Number(amountInWei) / 1e18;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse $SHADOW amount from user input to wei (18 decimals)
 */
export function parseShadowAmount(amount: string | number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return parseUnits(amountStr, 18);
}
