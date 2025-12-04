import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, contract_address, tx_hash, token_id, minted } = body;

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Update the most recent NFT for this FID
    const updateData: Record<string, unknown> = {
      minted: minted ?? true,
      updated_at: new Date().toISOString(),
    };

    if (contract_address) {
      updateData.contract_address = contract_address;
    }
    if (tx_hash) {
      updateData.tx_hash = tx_hash;
    }
    if (token_id !== undefined) {
      updateData.token_id = token_id.toString();
    }

    const { data, error } = await supabase
      .from('nfts')
      .update(updateData)
      .eq('fid', fid)
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update NFT mint status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, nft: data });
  } catch (error) {
    console.error('Update mint API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
