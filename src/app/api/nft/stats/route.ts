import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_SUPPLY } from '@/lib/nft-contract-v2';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';

export async function GET() {
  try {
    // Count total generated NFTs (unlimited)
    const { count: totalGenerated, error: generatedError } = await supabase
      .from('nfts')
      .select('*', { count: 'exact', head: true });

    if (generatedError) {
      console.error('Supabase error:', generatedError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get actual on-chain minted count from the smart contract
    let minted = 0;
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      const totalSupply = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS_V2,
        abi: NFT_CONTRACT_ABI_V2,
        functionName: 'totalSupply',
      });

      minted = Number(totalSupply);
    } catch (contractError) {
      console.error('Error reading from contract:', contractError);
      // Fallback to database count if contract read fails
      const { count: totalMinted, error: mintedError } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('minted', true);

      if (!mintedError) {
        minted = totalMinted || 0;
      }
    }

    const generated = totalGenerated || 0;
    const availableToMint = MAX_SUPPLY - minted;
    const percentage = Math.round((minted / MAX_SUPPLY) * 100);

    return NextResponse.json({
      totalGenerated: generated,
      totalMinted: minted,
      maxSupply: MAX_SUPPLY,
      availableToMint,
      remaining: availableToMint,
      percentage,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
