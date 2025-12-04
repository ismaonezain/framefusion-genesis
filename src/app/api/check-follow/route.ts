import { NextRequest, NextResponse } from 'next/server';

const ISMAONE_FID = 235940; // Your FID from the manifest

// POST endpoint to mark user as "followed" (no API verification, just formality)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid } = body;

    if (!fid) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    // Just return success - this is purely formality
    // User clicked "Follow" button, so we mark them as followed
    console.log(`✅ FID ${fid} marked as followed @ismaone (formality check)`);
    
    return NextResponse.json({ 
      isFollowing: true,
      message: 'Follow verified successfully'
    });
  } catch (error) {
    console.error('Error marking follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint - just returns followed status from client
// No API calls, no verification, pure formality
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');

    if (!fidParam) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    const userFid = parseInt(fidParam, 10);

    // Bypass for ismaone
    if (userFid === ISMAONE_FID) {
      return NextResponse.json({ isFollowing: true, checked: true });
    }

    // For all other users, return not followed by default
    // Client will handle the "clicked follow" state in localStorage
    return NextResponse.json({ 
      isFollowing: false,
      checked: true 
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error', isFollowing: false },
      { status: 500 }
    );
  }
}
