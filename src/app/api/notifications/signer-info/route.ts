import { NextResponse } from 'next/server';

/**
 * Get information about the notification signer
 * This helps admins understand which account users need to follow
 */
export async function GET(): Promise<NextResponse> {
  const signerUuid = process.env.NEYNAR_SIGNER_UUID;
  const neynarApiKey = '';

  if (!signerUuid) {
    return NextResponse.json({
      configured: false,
      message: 'NEYNAR_SIGNER_UUID not configured',
      warning: 'Notifications may fail without signer UUID',
      action: 'Set NEYNAR_SIGNER_UUID environment variable',
    });
  }

  try {
    // Try to get signer info from Neynar
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`,
      {
        headers: {
          'x-api-key': neynarApiKey,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        configured: true,
        signerUuid,
        warning: 'Could not fetch signer details',
        message: 'Signer UUID is set but details unavailable',
      });
    }

    const signerData = await response.json();

    return NextResponse.json({
      configured: true,
      signerUuid,
      fid: signerData.fid,
      message: `Users must follow FID ${signerData.fid} to receive notifications`,
      followUrl: `https://warpcast.com/~/profiles/${signerData.fid}`,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      signerUuid,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Signer UUID is configured but could not fetch details',
    });
  }
}
