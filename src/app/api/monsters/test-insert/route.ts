import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseServiceKey = '';

export async function GET(request: NextRequest) {
  console.log('[Test Insert] Starting database test...');

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Test Insert] Supabase client created');

    // Test 1: Check if table exists
    console.log('[Test Insert] Test 1: Checking if monsters table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('monsters')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('[Test Insert] Table check error:', tableError);
      return NextResponse.json({
        success: false,
        test: 'table_check',
        error: tableError.message,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      }, { status: 500 });
    }

    console.log('[Test Insert] Table exists! Current rows:', tableCheck?.length || 0);

    // Test 2: Try to insert a test monster
    console.log('[Test Insert] Test 2: Attempting to insert test monster...');
    
    const testMonster = {
      id: `test-${Date.now()}`,
      monster_id: 999999999,
      name: 'Test Monster',
      monster_type: 'Shadow Reaper',
      element: 'Dark',
      rarity: 'Common',
      level: 1,
      power_level: 100,
      image_url: 'https://placeholder.com/test.png',
      ipfs_uri: null,
      ipfs_gateway: null,
      metadata_uri: 'https://test.com/metadata/999999999',
      minted: true,
      is_wild: false,
      defeated_count: 0
    };

    console.log('[Test Insert] Inserting:', testMonster);

    const { data: insertData, error: insertError } = await supabase
      .from('monsters')
      .insert(testMonster)
      .select();

    if (insertError) {
      console.error('[Test Insert] Insert error:', insertError);
      return NextResponse.json({
        success: false,
        test: 'insert',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testData: testMonster
      }, { status: 500 });
    }

    console.log('[Test Insert] Insert successful!', insertData);

    // Test 3: Clean up - delete test monster
    console.log('[Test Insert] Test 3: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('monsters')
      .delete()
      .eq('id', testMonster.id);

    if (deleteError) {
      console.error('[Test Insert] Delete error:', deleteError);
    } else {
      console.log('[Test Insert] Test data cleaned up successfully');
    }

    return NextResponse.json({
      success: true,
      message: '✅ All database tests passed!',
      tests: {
        table_exists: true,
        can_insert: true,
        can_delete: !deleteError
      },
      inserted: insertData
    });

  } catch (error: any) {
    console.error('[Test Insert] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      test: 'unexpected',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
