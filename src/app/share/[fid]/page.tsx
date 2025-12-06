import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Props = {
  params: { fid: string };
  searchParams: { streak?: string; amount?: string };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { fid } = params;
  const streak = searchParams.streak || '0';
  const amount = searchParams.amount || '50000';

  // Fetch user data
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData } = await supabase
    .from('users_cache')
    .select('username, pfp_url, display_name')
    .eq('fid', parseInt(fid))
    .single();

  const username = userData?.username || `fid-${fid}`;
  const displayName = userData?.display_name || username;
  const pfpUrl = userData?.pfp_url || '';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partly-happily-279.app.ohara.ai';
  const imageUrl = `${baseUrl}/api/frame/claim-image?username=${encodeURIComponent(username)}&pfp=${encodeURIComponent(pfpUrl)}&streak=${streak}&amount=${amount}`;

  const title = `${displayName} just claimed 50,000 $TRIA!`;
  const description = parseInt(streak) > 0 
    ? `🔥 ${streak} day streak! Daily rewards for FrameFusion Genesis NFT holders.`
    : 'Daily rewards for FrameFusion Genesis NFT holders.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 800,
          alt: `${displayName} claimed $TRIA`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': 'Check in and Claim Now!',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': baseUrl,
    },
  };
}

export default function SharePage({ params }: Props) {
  // Redirect to main app
  redirect('/');
}
