import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NFTMetadataV3, NFTTrait } from '@/lib/nft-contract-v3';
import { getLoyaltyTier, LOYALTY_TIERS, ACHIEVEMENTS } from '@/lib/nft-contract-v3';

// Supabase client with service key for unrestricted access
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

type RouteParams = {
  params: Promise<{
    fid: string;
  }>;
};

/**
 * GET /api/nft/metadata/[fid]
 * Returns ERC-721 compliant metadata with dynamic traits
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { fid: fidParam } = await params;
    const fid = parseInt(fidParam, 10);

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch NFT data from database
    const { data: nftData, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('fid', fid)
      .single();

    if (nftError || !nftData) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Fetch user engagement data for dynamic traits
    const { data: userData, error: userError } = await supabase
      .from('user_engagement')
      .select('*')
      .eq('fid', fid)
      .single();

    // Fetch leaderboard position
    const { data: leaderboardData } = await supabase
      .from('leaderboard')
      .select('fid, rank')
      .order('total_tria', { ascending: false });

    const userRank = leaderboardData?.findIndex((entry: { fid: number }) => entry.fid === fid) + 1 || 0;

    // Calculate traits
    const checkInStreak = userData?.check_in_streak || 0;
    const totalTria = userData?.total_tria || 0;
    const loyaltyTier = getLoyaltyTier(checkInStreak);
    const mintNumber = nftData.token_id || 0;

    // Build base traits from original metadata
    const baseTraits: NFTTrait[] = [
      {
        trait_type: 'Character Class',
        value: nftData.character_class || 'Unknown',
      },
      {
        trait_type: 'Gender',
        value: nftData.gender || 'Unknown',
      },
      {
        trait_type: 'Background',
        value: nftData.background || 'Unknown',
      },
      {
        trait_type: 'Color Palette',
        value: nftData.color_palette || 'Unknown',
      },
      {
        trait_type: 'Clothing',
        value: nftData.clothing || 'Unknown',
      },
      {
        trait_type: 'Accessories',
        value: nftData.accessories || 'None',
      },
    ];

    // Build dynamic engagement traits
    const engagementTraits: NFTTrait[] = [
      {
        trait_type: 'Loyalty Tier',
        value: LOYALTY_TIERS[loyaltyTier].name,
        display_type: 'badge',
      },
      {
        trait_type: 'Check-in Streak',
        value: checkInStreak,
        display_type: 'number',
      },
      {
        trait_type: 'Total $TRIA Claimed',
        value: totalTria,
        display_type: 'number',
      },
    ];

    // Add rank if in top 100
    if (userRank > 0 && userRank <= 100) {
      engagementTraits.push({
        trait_type: 'Leaderboard Rank',
        value: userRank,
        display_type: 'ranking',
        max_value: 100,
      });
    }

    // Build achievement badges
    const achievementTraits: NFTTrait[] = [];

    // Early Adopter (first 100 mints)
    if (mintNumber <= 100) {
      achievementTraits.push({
        trait_type: 'Achievement',
        value: ACHIEVEMENTS.EARLY_ADOPTER.name,
        display_type: 'badge',
      });
    }

    // Streak Legend
    if (checkInStreak >= 30) {
      achievementTraits.push({
        trait_type: 'Achievement',
        value: ACHIEVEMENTS.STREAK_LEGEND.name,
        display_type: 'badge',
      });
    }

    // Whale
    if (totalTria >= 1000000) {
      achievementTraits.push({
        trait_type: 'Achievement',
        value: ACHIEVEMENTS.WHALE.name,
        display_type: 'badge',
      });
    }

    // Community Leader
    if (userRank > 0 && userRank <= 10) {
      achievementTraits.push({
        trait_type: 'Achievement',
        value: ACHIEVEMENTS.COMMUNITY_LEADER.name,
        display_type: 'badge',
      });
    }

    // V3 Pioneer (migrated from V2)
    if (nftData.migrated_to_v3) {
      achievementTraits.push({
        trait_type: 'Achievement',
        value: ACHIEVEMENTS.MIGRATED_V3.name,
        display_type: 'badge',
      });
    }

    // Combine all traits
    const allTraits = [...baseTraits, ...engagementTraits, ...achievementTraits];

    // Build ERC-721 compliant metadata
    const metadata: NFTMetadataV3 = {
      name: `FrameFusion Genesis #${fid}`,
      description: `AI-generated avatar NFT with dynamic traits earned through community engagement. Loyalty Tier: ${LOYALTY_TIERS[loyaltyTier].name}`,
      image: nftData.image_url,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/nft/${fid}`,
      attributes: allTraits,
    };

    // Return with proper headers for NFT metadata
    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[NFT Metadata API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
