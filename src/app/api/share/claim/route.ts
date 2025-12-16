import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    // Fetch user data from Supabase cache
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error } = await supabase
      .from('users_cache')
      .select('username, pfp_url, display_name')
      .eq('fid', parseInt(fid))
      .single();

    if (error || !userData) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ 
        error: 'User not found',
        fid: parseInt(fid),
        username: `fid-${fid}`,
        pfpUrl: null,
        displayName: `User ${fid}`
      });
    }

    return NextResponse.json({
      fid: parseInt(fid),
      username: userData.username || `fid-${fid}`,
      pfpUrl: userData.pfp_url || null,
      displayName: userData.display_name || userData.username || `User ${fid}`
    });

  } catch (error) {
    console.error('Error in share/claim API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
