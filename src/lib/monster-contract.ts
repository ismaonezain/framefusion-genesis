/**
 * FrameShadows Monster Contract Integration
 * Handles minting and interaction with FrameShadows.sol smart contract
 */

import { parseEther } from 'viem';

// FrameShadows Contract Configuration
export const FRAMESHADOWS_CONTRACT = {
  address: '0xC53B19ea5EE1fa5dFCe12CdAD71813bee27f4B31', // FrameShadows deployed on Base
  abi: [
    {
      inputs: [
        { name: '_monsterId', type: 'uint256' },
        { name: '_powerLevel', type: 'uint256' },
        { name: '_tokenURI', type: 'string' },
        { name: '_isWild', type: 'bool' }
      ],
      name: 'mintMonster',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_monsterId', type: 'uint256' },
        { name: '_powerLevel', type: 'uint256' },
        { name: '_tokenURI', type: 'string' },
        { name: '_isWild', type: 'bool' }
      ],
      name: 'ownerMint',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_tokenId', type: 'uint256' },
        { name: '_newTokenURI', type: 'string' }
      ],
      name: 'updateTokenURI',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_tokenIds', type: 'uint256[]' },
        { name: '_newTokenURIs', type: 'string[]' }
      ],
      name: 'batchUpdateTokenURI',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'withdraw',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: '_amount', type: 'uint256' }],
      name: 'withdrawAmount',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getContractBalance',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '_tokenId', type: 'uint256' }],
      name: 'getMonsterStats',
      outputs: [
        { name: 'monsterId', type: 'uint256' },
        { name: 'powerLevel', type: 'uint256' },
        { name: 'level', type: 'uint256' },
        { name: 'defeatedTimes', type: 'uint256' },
        { name: 'wild', type: 'bool' }
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '_tokenId', type: 'uint256' }],
      name: 'getMonsterIdByTokenId',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '_tokenId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', type: 'string' }],
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
      inputs: [],
      name: 'MAX_SUPPLY',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'MINT_PRICE',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'tokensOfOwner',
      outputs: [{ name: '', type: 'uint256[]' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
} as const;

// Monster minting now uses $SHADOW tokens ON-CHAIN
// ETH payment reduced to minimal gas amount
export const MONSTER_MINT_SHADOW_COST = 100; // 100 $SHADOW (display only)
export const MONSTER_MINT_PRICE = parseEther('0'); // No ETH payment

export type MonsterMintParams = {
  to: string;
  monsterId: number;
  powerLevel: number;
  tokenURI: string;
  isWild: boolean;
};

export type MonsterStats = {
  monsterId: bigint;
  powerLevel: bigint;
  level: bigint;
  defeatedTimes: bigint;
  wild: boolean;
};
