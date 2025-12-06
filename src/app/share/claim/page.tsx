import { Metadata } from 'next';
import { headers } from 'next/headers';

type UserData = {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
};

async function getUserData(): Promise<UserData | null> {
  try {
    // In Mini App context, get user from session/auth
    // For now, we'll fetch from API that uses Quick Auth
    const headersList = headers();
    const host = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    // This would normally come from Quick Auth session
    // For the embed, we'll need to pass FID as query param initially
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partly-happily-279.app.ohara.ai';
  
  return {
    title: 'FrameFusion Genesis - $TRIA Claim Success',
    description: 'Just claimed 50,000 $TRIA tokens!',
    openGraph: {
      title: 'FrameFusion Genesis - $TRIA Claim Success',
      description: 'Just claimed 50,000 $TRIA tokens!',
      images: [`${baseUrl}/api/frame/claim-image`],
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: '0.1',
        name: 'FrameFusion Genesis',
        iconUrl: `${baseUrl}/icon.png`,
        homeUrl: baseUrl,
        imageUrl: `${baseUrl}/api/frame/claim-image`,
        buttonTitle: 'Check in and Claim Now!',
        splashImageUrl: `${baseUrl}/splash.png`,
        splashBackgroundColor: '#8b5cf6',
        webhookUrl: `${baseUrl}/api/webhook`,
      }),
    },
  };
}

export default function ClaimSharePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900">
          $TRIA Claimed!
        </h1>
        <p className="text-gray-600">
          Successfully claimed 50,000 $TRIA tokens!
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Check in and Claim Now!
          </a>
        </div>
      </div>
    </div>
  );
}
