import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';

// TRIA Token Contract on Base
export const TRIA_CONTRACT_ADDRESS: Address = '0xd852713dd8ddf61316da19383d0c427adb85eb07';

// ABI for TRIA token transfer
const TRIA_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// FrameFusion NFT Contract on Base
export const NFT_CONTRACT_ADDRESS: Address = '0x22e0c2e1b8863a9b6946b85cbef4e045e5dc96d1';

// NFT ABI for balance check
const NFT_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export async function checkNFTBalance(address: Address): Promise<boolean> {
  try {
    const balance = await publicClient.readContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'balanceOf',
      args: [address]
    });
    
    return balance > 0n;
  } catch (error) {
    console.error('Error checking NFT balance:', error);
    return false;
  }
}

export async function checkTriaBalance(address: Address): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: TRIA_CONTRACT_ADDRESS,
      abi: TRIA_ABI,
      functionName: 'balanceOf',
      args: [address]
    });
    
    return balance;
  } catch (error) {
    console.error('Error checking TRIA balance:', error);
    return 0n;
  }
}
