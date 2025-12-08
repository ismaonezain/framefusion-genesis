'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, ExternalLink, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { sdk } from '@farcaster/miniapp-sdk';
import type { NFTRecord } from '@/lib/supabase';
import Image from 'next/image';
import { MintNFTButtonV2 } from '@/components/mint-nft-button-v2';
import { MigrateNFTV3Button } from '@/components/migrate-nft-v3-button';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';
import { useReadContract } from 'wagmi';

type NFTDisplayProps = {
  nft: NFTRecord;
  platform: 'farcaster' | 'base' | 'unknown';
  fid: number;
};

export function NFTDisplay({ nft, platform, fid }: NFTDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [currentNFT, setCurrentNFT] = useState<NFTRecord>(nft);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(nft.image_url);

  // Convert IPFS URL to Pinata gateway
  const convertToPinataGateway = (url: string): string => {
    if (!url) return url;
    
    // If it's already using the Pinata gateway, return as is
    if (url.includes('amber-neighbouring-crayfish-334.mypinata.cloud')) {
      return url;
    }
    
    // Extract IPFS hash from various formats
    const ipfsMatch = url.match(/(?:ipfs:\/\/|\/ipfs\/)([a-zA-Z0-9]+)/);
    if (ipfsMatch) {
      const hash = ipfsMatch[1];
      const pinataUrl = `https://amber-neighbouring-crayfish-334.mypinata.cloud/ipfs/${hash}`;
      console.log('[NFT Display] Converted IPFS to Pinata:', { original: url, pinata: pinataUrl });
      return pinataUrl;
    }
    
    return url;
  };

  useEffect(() => {
    setCurrentNFT(nft);
    const convertedUrl = convertToPinataGateway(nft.image_url);
    setImageSrc(convertedUrl);
    setImageError(false);
    setImageLoading(true);
  }, [nft]);

  const { data: tokenIdFromContract } = useReadContract({
    address: NFT_CONTRACT_ADDRESS_V2,
    abi: NFT_CONTRACT_ABI_V2,
    functionName: 'getTokenIdByFid',
    args: [BigInt(fid)],
    query: {
      enabled: currentNFT.minted && !currentNFT.token_id,
    }
  });

  useEffect(() => {
    if (tokenIdFromContract !== undefined && !currentNFT.token_id) {
      const tokenId = (tokenIdFromContract as bigint).toString();
      setCurrentNFT(prev => ({
        ...prev,
        token_id: tokenId,
      }));
      
      fetch('/api/nft/update-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          token_id: tokenId,
        }),
      }).catch(console.error);
    }
  }, [tokenIdFromContract, currentNFT.token_id, fid]);

  const openSeaUrl = currentNFT.minted && currentNFT.contract_address && currentNFT.token_id
    ? `https://opensea.io/assets/base/${currentNFT.contract_address}/${currentNFT.token_id}`
    : null;

  const handleMintSuccess = (tokenId: bigint, txHash: string) => {
    setCurrentNFT({
      ...currentNFT,
      minted: true,
      contract_address: NFT_CONTRACT_ADDRESS_V2,
      tx_hash: txHash,
      token_id: tokenId.toString(),
    });
  };

  const handleMigrationSuccess = (v3TokenId: bigint, txHash: string) => {
    setCurrentNFT({
      ...currentNFT,
      migrated_to_v3: true,
      v3_token_id: v3TokenId.toString(),
      v3_tx_hash: txHash,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnSocial = async () => {
    const appUrl = 'https://partly-happily-279.app.ohara.ai';
    
    try {
      await sdk.actions.ready();
      const context = await sdk.context;
      
      // Use Pinata gateway for NFT image
      const nftImageUrl = convertToPinataGateway(currentNFT.image_url);
      
      console.log('[NFT Share] Images being shared:');
      console.log('  NFT Image URL (Pinata):', nftImageUrl);
      console.log('  User PFP:', context?.user?.pfpUrl);
      console.log('  Username:', context?.user?.username);
      console.log('  📝 Sharing NFT image directly + composite image endpoint');
      
      const shareText = currentNFT.minted
        ? `Just minted my FrameFusion Genesis NFT! 🎨✨\n\nUnique AI-generated PFP art on Base blockchain.\n\nby @ismaone.farcaster.eth`
        : `Just generated my FrameFusion Genesis NFT! 🎨✨\n\nUnique AI-generated PFP art.\n\nCreate yours now: ${appUrl}\n\nby @ismaone.farcaster.eth`;
      
      // Build composite image endpoint URL (no NFT image - just user info)
      const user = context?.user;
      const shareImageUrl = `${window.location.origin}/api/frame/share-image?pfp=${encodeURIComponent(user?.pfpUrl || '')}&username=${encodeURIComponent(user?.username || 'Anon')}`;
      
      console.log('  Composite Image URL (no NFT in URL):', shareImageUrl);
      
      // Share NFT image directly + composite image
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [nftImageUrl, shareImageUrl],
      });
    } catch (error) {
      console.error('Failed to share NFT image:', error);
      
      // Fallback: try with app URL
      try {
        await sdk.actions.composeCast({
          text: `Just ${currentNFT.minted ? 'minted' : 'generated'} my FrameFusion Genesis NFT! 🎨✨\n\nUnique AI-generated PFP art on Base blockchain.\n\nCreate yours now: ${appUrl}\n\nby @ismaone.farcaster.eth`,
          embeds: [currentNFT.image_url],
        });
      } catch (fallbackError) {
        console.error('Fallback share failed:', fallbackError);
        
        // Native share as last resort
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'FrameFusion Genesis NFT',
              text: `Check out my AI-generated NFT!`,
              url: appUrl,
            });
          } catch (shareError) {
            console.error('Native share failed:', shareError);
          }
        }
      }
    }
  };

  return (
    <Card className="border border-purple-500/20 bg-card">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <span className="font-black text-foreground">{currentNFT.name}</span>
          </div>
          {currentNFT.minted && (
            <Badge variant="default" className="bg-purple-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Minted
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-base font-medium text-muted-foreground">
          🎨 Your unique AI-generated masterpiece!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-purple-500/20 group">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
          )}
          
          <Image
            src={imageSrc}
            alt={currentNFT.name}
            fill
            className={`object-cover transform group-hover:scale-105 transition-transform duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            unoptimized
            onLoad={() => setImageLoading(false)}
            onError={() => {
              console.warn('[NFT Display] Image failed to load from:', imageSrc);
              setImageError(true);
              setImageLoading(false);
            }}
          />
          
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-secondary">
              <p className="text-purple-400 font-bold text-lg mb-2">🎨 FrameFusion Genesis</p>
              <p className="text-sm text-muted-foreground mb-1">NFT #{currentNFT.token_id || 'Pending'}</p>
              <p className="text-xs text-gray-500 mt-2">Image temporarily unavailable</p>
              <p className="text-xs text-gray-500">Please refresh to retry</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">IPFS Gateway:</span>
            <button
              onClick={() => copyToClipboard(currentNFT.ipfs_gateway)}
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {!currentNFT.minted && (
            <MintNFTButtonV2 
              nft={currentNFT} 
              fid={fid}
              onMintSuccess={handleMintSuccess}
            />
          )}

          {currentNFT.minted && !currentNFT.migrated_to_v3 && (
            <MigrateNFTV3Button 
              nft={currentNFT} 
              fid={fid}
              onMigrationSuccess={handleMigrationSuccess}
            />
          )}

          {openSeaUrl && (
            <Button
              onClick={() => window.open(openSeaUrl, '_blank')}
              variant="outline"
              className="w-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10 font-bold"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on OpenSea
            </Button>
          )}

          <Button
            onClick={shareOnSocial}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
            size="lg"
          >
            <Share2 className="h-5 w-5 mr-2" />
            {platform === 'base' ? 'Share on Base 🔵' : 'Share on Warpcast 💜'}
          </Button>
        </div>

        <Alert className="bg-purple-500/10 border border-purple-500/20">
          <AlertDescription className="text-sm text-center">
            <div className="space-y-1">
              <p className="font-bold text-foreground">by @ismaone.farcaster.eth</p>
              <p className="text-muted-foreground">
                Thank you for being part of <span className="font-semibold text-purple-400">FrameFusion Genesis</span>! 🎨✨
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
