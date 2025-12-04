import { NextRequest, NextResponse } from 'next/server';
import { supabase, type NFTRecord } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const nftData: NFTRecord = await request.json();

    const { data: existingNFT } = await supabase
      .from('nfts')
      .select('*')
      .eq('fid', nftData.fid)
      .single();

    if (existingNFT) {
      return NextResponse.json(
        { error: 'This FID has already generated an NFT' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('nfts')
      .insert([nftData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving NFT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
