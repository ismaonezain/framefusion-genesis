import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/sync-nfts/checkpoint
 * Returns the last synced token_id from checkpoint
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sync_checkpoints')
      .select('*')
      .eq('checkpoint_type', 'nft_sync_token_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No checkpoint found
        return NextResponse.json({ lastTokenId: null });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ lastTokenId: null });
    }
    
    const lastTokenId = (data.checkpoint_data as { lastTokenId: number }).lastTokenId;
    return NextResponse.json({ lastTokenId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load checkpoint' },
      { status: 500 }
    );
  }
}
