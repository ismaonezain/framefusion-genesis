import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
  const urlValue = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return NextResponse.json({
    config: {
      hasUrl,
      hasServiceKey,
      keyLength,
      urlValue: hasUrl ? urlValue : 'NOT SET',
    },
    status: hasUrl && hasServiceKey ? 'READY ✅' : 'NOT CONFIGURED ❌',
    issues: [
      ...(!hasUrl ? ['NEXT_PUBLIC_SUPABASE_URL not set'] : []),
      ...(!hasServiceKey ? ['SUPABASE_SERVICE_ROLE_KEY not set'] : []),
      ...(keyLength > 0 && keyLength < 100 ? ['Service key seems too short'] : []),
    ],
    instructions: hasServiceKey
      ? 'Configuration looks good! Try minting a monster.'
      : 'Please add SUPABASE_SERVICE_ROLE_KEY to environment variables. See MONSTER_DATABASE_FIX.md for instructions.',
  });
}
