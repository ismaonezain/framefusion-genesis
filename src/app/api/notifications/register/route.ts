import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = '';
const supabaseServiceKey = '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { fid, token, url } = body;

    // Validate required fields
    if (!fid || !token || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, token, url' },
        { status: 400 }
      );
    }

    console.log(`[Register Token] Manually registering token for FID ${fid}`);

    // Check if token already exists
    const { data: existing, error: selectError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('fid', fid)
      .eq('token', token)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('[Register Token] Error checking existing token:', selectError);
      return NextResponse.json(
        { error: 'Database error checking existing token' },
        { status: 500 }
      );
    }

    if (existing) {
      console.log(`[Register Token] Token already exists for FID ${fid}, updating...`);
      
      // Update existing token
      const { error: updateError } = await supabase
        .from('notification_tokens')
        .update({
          enabled: true,
          url: url,
          updated_at: new Date().toISOString()
        })
        .eq('fid', fid)
        .eq('token', token);

      if (updateError) {
        console.error('[Register Token] Error updating token:', updateError);
        return NextResponse.json(
          { error: 'Failed to update notification token' },
          { status: 500 }
        );
      }

      console.log(`[Register Token] Successfully updated token for FID ${fid}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Notification token updated successfully',
        action: 'updated'
      });
    } else {
      console.log(`[Register Token] Creating new token for FID ${fid}...`);
      
      // Insert new token
      const { error: insertError } = await supabase
        .from('notification_tokens')
        .insert({
          fid: fid,
          token: token,
          url: url,
          enabled: true
        });

      if (insertError) {
        console.error('[Register Token] Error inserting token:', insertError);
        return NextResponse.json(
          { error: 'Failed to save notification token' },
          { status: 500 }
        );
      }

      console.log(`[Register Token] Successfully created token for FID ${fid}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Notification token registered successfully',
        action: 'created'
      });
    }
  } catch (error) {
    console.error('[Register Token] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
