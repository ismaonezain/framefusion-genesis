import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prepareNFTMetadata } from '@/lib/prepare-nft-metadata';

/**
 * Admin API to manually update NFT metadata for already minted NFTs
 * This will regenerate metadata with proper OpenSea traits format
 */

interface MetadataAttributes {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: MetadataAttributes[];
}

/**
 * Upload metadata JSON to Lighthouse Storage
 */
async function uploadMetadataToLighthouse(metadata: NFTMetadata): Promise<string> {
  const response = await fetch('https://node.lighthouse.storage/api/v0/add', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIGHTHOUSE_API_KEY}`,
    },
    body: JSON.stringify({
      file: Buffer.from(JSON.stringify(metadata)).toString('base64'),
      fileName: `metadata_${Date.now()}.json`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload to Lighthouse');
  }

  const result = await response.json();
  return `https://gateway.lighthouse.storage/ipfs/${result.Hash}`;
}

/**
 * Generate proper OpenSea-compatible metadata
 */
function generateOpenSeaMetadata(
  fid: number,
  tokenId: number,
  imageUrl: string,
  generation: number
): NFTMetadata {
  const metadata = prepareNFTMetadata(fid);

  return {
    name: `FrameFusion Genesis #${tokenId}`,
    description: `A unique FrameFusion Genesis character generated for FID ${fid}. ${metadata.classDescription} wielding ${metadata.items}.`,
    image: imageUrl,
    external_url: 'https://framefusion.vercel.app',
    attributes: [
      { trait_type: 'Collection', value: 'FrameFusion Genesis' },
      { trait_type: 'FID', value: fid.toString() },
      { trait_type: 'Generation', value: generation.toString() },
      { trait_type: 'Character Class', value: metadata.characterClass },
      { trait_type: 'Class Description', value: metadata.classDescription },
      { trait_type: 'Gender', value: metadata.gender },
      { trait_type: 'Background', value: metadata.background },
      { trait_type: 'Background Description', value: metadata.backgroundDescription },
      { trait_type: 'Color Palette', value: metadata.colorPalette },
      { trait_type: 'Color Vibe', value: metadata.colorVibe },
      { trait_type: 'Clothing', value: metadata.clothing },
      { trait_type: 'Accessories', value: metadata.accessories },
      { trait_type: 'Items', value: metadata.items },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, adminKey } = body as { tokenId?: number; adminKey?: string };

    // Simple admin authentication - hardcoded for convenience
    const ADMIN_KEY = 'rahasia123';
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - wrong admin key' },
        { status: 401 }
      );
    }

    // If tokenId provided, update single NFT
    if (tokenId !== undefined) {
      const { data: nft, error: fetchError } = await supabase
        .from('nfts')
        .select('*')
        .eq('token_id', tokenId)
        .single();

      if (fetchError || !nft) {
        return NextResponse.json(
          { error: 'NFT not found' },
          { status: 404 }
        );
      }

      // Generate new metadata
      const newMetadata = generateOpenSeaMetadata(
        nft.fid,
        nft.token_id,
        nft.image_url,
        nft.generation
      );

      // Upload to Lighthouse
      const metadataUrl = await uploadMetadataToLighthouse(newMetadata);

      // Update database
      const { error: updateError } = await supabase
        .from('nfts')
        .update({ metadata_url: metadataUrl })
        .eq('token_id', tokenId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update database' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        tokenId,
        metadataUrl,
        message: 'Metadata updated successfully',
      });
    }

    // Update all minted NFTs
    const { data: nfts, error: fetchError } = await supabase
      .from('nfts')
      .select('*')
      .not('token_id', 'is', null)
      .order('token_id', { ascending: true });

    if (fetchError || !nfts) {
      return NextResponse.json(
        { error: 'Failed to fetch NFTs' },
        { status: 500 }
      );
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Update each NFT
    for (const nft of nfts) {
      try {
        // Generate new metadata
        const newMetadata = generateOpenSeaMetadata(
          nft.fid,
          nft.token_id,
          nft.image_url,
          nft.generation
        );

        // Upload to Lighthouse
        const metadataUrl = await uploadMetadataToLighthouse(newMetadata);

        // Update database
        const { error: updateError } = await supabase
          .from('nfts')
          .update({ metadata_url: metadataUrl })
          .eq('token_id', nft.token_id);

        if (updateError) {
          throw updateError;
        }

        results.push({
          tokenId: nft.token_id,
          success: true,
          metadataUrl,
        });
        successCount++;

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          tokenId: nft.token_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: nfts.length,
      successCount,
      failCount,
      results,
      message: `Updated ${successCount} NFTs successfully, ${failCount} failed`,
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'tokenId required' },
        { status: 400 }
      );
    }

    const { data: nft, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('token_id', parseInt(tokenId))
      .single();

    if (error || !nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Generate what the metadata would look like
    const metadata = generateOpenSeaMetadata(
      nft.fid,
      nft.token_id,
      nft.image_url,
      nft.generation
    );

    return NextResponse.json({
      currentMetadataUrl: nft.metadata_url,
      newMetadata: metadata,
      message: 'This is what the new metadata will look like',
    });
  } catch (error) {
    console.error('Error previewing metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
