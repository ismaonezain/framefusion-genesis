import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maxTokenId = parseInt(searchParams.get('maxTokenId') || '3000', 10);

    console.log(`🔍 Checking database for missing tokens from #1 to #${maxTokenId}...`);

    // Fetch all NFTs with token_id from database
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select('token_id')
      .not('token_id', 'is', null)
      .order('token_id', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create set of existing token IDs
    const existingTokenIds = new Set(nfts?.map((nft: { token_id: string }) => parseInt(nft.token_id, 10)) || []);

    console.log(`📊 Found ${existingTokenIds.size} tokens in database`);

    // Find missing token IDs
    const missingTokenIds: number[] = [];
    for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
      if (!existingTokenIds.has(tokenId)) {
        missingTokenIds.push(tokenId);
      }
    }

    console.log(`❌ Found ${missingTokenIds.length} missing tokens`);

    // Convert to ranges for better readability
    const ranges: string[] = [];
    if (missingTokenIds.length > 0) {
      let rangeStart = missingTokenIds[0];
      let rangeEnd = missingTokenIds[0];

      for (let i = 1; i < missingTokenIds.length; i++) {
        if (missingTokenIds[i] === rangeEnd + 1) {
          // Continue range
          rangeEnd = missingTokenIds[i];
        } else {
          // End current range, start new one
          if (rangeStart === rangeEnd) {
            ranges.push(`#${rangeStart}`);
          } else {
            ranges.push(`#${rangeStart}-${rangeEnd}`);
          }
          rangeStart = missingTokenIds[i];
          rangeEnd = missingTokenIds[i];
        }
      }

      // Add last range
      if (rangeStart === rangeEnd) {
        ranges.push(`#${rangeStart}`);
      } else {
        ranges.push(`#${rangeStart}-${rangeEnd}`);
      }
    }

    const result = {
      totalChecked: maxTokenId,
      existingCount: existingTokenIds.size,
      missingCount: missingTokenIds.length,
      missingTokenIds: missingTokenIds,
      missingRanges: ranges,
      firstMissing: missingTokenIds.length > 0 ? missingTokenIds[0] : null,
      percentComplete: ((existingTokenIds.size / maxTokenId) * 100).toFixed(2),
    };

    console.log(`✅ Check complete: ${result.percentComplete}% complete`);
    console.log(`📋 Missing ranges: ${ranges.join(', ') || 'None'}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error checking missing tokens:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
