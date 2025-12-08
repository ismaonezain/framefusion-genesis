'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Skull, CheckCircle2, Coins, Image as ImageIcon, AlertCircle, Share2 } from 'lucide-react';
import { FRAMESHADOWS_CONTRACT, MONSTER_MINT_PRICE } from '@/lib/monster-contract';
import { fluxproSubmit, fluxproPollStatus, fluxproFetchImages } from '@/fluxpro-api';
import { lighthouseUploadImageWithMetadata, type LighthouseImageWithMetadataResult } from '@/lighthouse-storage';
import { generateMonsterAttributes, generateMonsterPrompt, type MonsterAttributes } from '@/lib/monster-generator';

type GenerationStep = 
  | 'idle' 
  | 'checking-limit'
  | 'generating-image' 
  | 'minting' 
  | 'saving' 
  | 'complete' 
  | 'error';

type Monster = {
  id: string;
  monster_id: number;
  token_id: string;
  name: string;
  monster_type: string;
  element: string;
  rarity: string;
  level: number;
  power_level: number;
  image_url: string;
  ipfs_uri: string;
  ipfs_gateway: string;
  metadata_uri: string;
  is_wild: boolean;
  owner_fid: number | null;
  created_at: string;
};

type MonsterGeneratorProps = {
  onMonsterGenerated: (monster: Monster) => void;
  isOwner: boolean;
};

type PreGenResult = {
  name: string;
  tokenId: string;
  monsterId: number;
  type: string;
  rarity: string;
  element: string;
  level: number;
  powerLevel: number;
  imageUrl: string;
  ipfsUri: string;
  ipfsGateway: string;
  metadataUri: string;
  metadataGateway: string;
};

export function MonsterGenerator({ onMonsterGenerated, isOwner }: MonsterGeneratorProps) {
  const { address, status } = useAccount();
  const [fid, setFid] = useState<number | null>(null);
  const [step, setStep] = useState<GenerationStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [preGenData, setPreGenData] = useState<PreGenResult | null>(null);
  const [canMint, setCanMint] = useState<boolean>(true);
  const [existingMonster, setExistingMonster] = useState<any>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('user');
  const [pfpUrl, setPfpUrl] = useState<string>('');

  // Wagmi hooks for contract interaction
  const { writeContract, data: mintTxHash, error: mintError } = useWriteContract();
  const { isLoading: isMintPending, isSuccess: isMintSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  // Get total supply to show next token ID
  const { data: totalSupply } = useReadContract({
    address: FRAMESHADOWS_CONTRACT.address as `0x${string}`,
    abi: FRAMESHADOWS_CONTRACT.abi,
    functionName: 'totalSupply',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadFid() {
      try {
        await sdk.actions.ready();
        const context = await sdk.context;
        if (!cancelled && context?.user) {
          setFid(context.user.fid || null);
          setUsername(context.user.username || 'user');
          setPfpUrl(context.user.pfpUrl || '');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load FID:', err);
        }
      }
    }

    loadFid();
    return () => {
      cancelled = true;
    };
  }, []);

  // Check FID limit when FID is loaded (check first, but allow multiple mints)
  useEffect(() => {
    if (fid) {
      checkFIDLimit();
    }
  }, [fid]);

  // Watch for mint success
  useEffect(() => {
    if (isMintSuccess && step === 'minting' && receipt && preGenData) {
      handleMintSuccess();
    }
  }, [isMintSuccess, step, receipt, preGenData]);

  // Watch for mint errors
  useEffect(() => {
    if (mintError) {
      setStep('error');
      setError(mintError.message || 'Minting failed');
      setProgress('');
    }
  }, [mintError]);

  const checkFIDLimit = async () => {
    if (!fid) return;

    setIsCheckingLimit(true);
    try {
      const response = await fetch('/api/monsters/check-fid-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid }),
      });

      const result = await response.json();

      // Store existing monster if any, but ALWAYS allow minting (public minting!)
      if (!result.allowed && result.existingMonster) {
        setExistingMonster(result.existingMonster);
      }
      // Always allow minting - public minting open!
      setCanMint(true);
    } catch (err) {
      console.error('[Monster Generator] Failed to check FID limit:', err);
      // On error, allow minting (fail open)
      setCanMint(true);
    } finally {
      setIsCheckingLimit(false);
    }
  };

  const handleMintSuccess = async () => {
    if (!preGenData) {
      setStep('error');
      setError('Missing pre-generated data');
      return;
    }

    setStep('saving');
    setProgress('Monster minted! 🎉 Saving to database...');

    try {
      // Save to database with ALL proper data
      const dbMonster: Monster = {
        id: `monster-${preGenData.tokenId}-${Date.now()}`,
        monster_id: preGenData.monsterId,
        token_id: preGenData.tokenId,
        name: preGenData.name,
        monster_type: preGenData.type,
        element: preGenData.element,
        rarity: preGenData.rarity,
        level: preGenData.level,
        power_level: preGenData.powerLevel,
        image_url: preGenData.imageUrl,
        ipfs_uri: preGenData.ipfsUri,
        ipfs_gateway: preGenData.ipfsGateway,
        metadata_uri: preGenData.metadataUri,
        is_wild: true,
        owner_fid: fid,
        created_at: new Date().toISOString(),
      };

      console.log('[Monster Generator] Saving monster to database:', dbMonster);
      
      const saveResponse = await fetch('/api/monsters/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbMonster),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Monster Generator] Database save failed:', errorData);
        throw new Error(`Failed to save: ${errorData.error || saveResponse.statusText}`);
      }

      const saveResult = await saveResponse.json();
      console.log('[Monster Generator] Monster saved:', saveResult);

      setStep('complete');
      setProgress('Monster complete! Image and traits ready! 👾');

      // Notify parent component
      onMonsterGenerated(dbMonster);
      
    } catch (err) {
      console.error('[Monster Generator] Post-mint error:', err);
      setStep('error');
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Monster minted but save failed: ${errorMessage}`);
    }
  };

  const handleShareMonster = async () => {
    if (!preGenData || !fid) return;

    const appUrl = 'https://partly-happily-279.app.ohara.ai';
    setIsSharing(true);

    try {
      await sdk.actions.ready();
      const context = await sdk.context;

      // Build embed URL with all monster details
      const embedUrl = `${appUrl}/api/miniapp/monster-share-embed?fid=${fid}&monsterId=${preGenData.monsterId}&username=${encodeURIComponent(context?.user?.username || username)}&pfp=${encodeURIComponent(context?.user?.pfpUrl || pfpUrl)}&monsterImage=${encodeURIComponent(preGenData.imageUrl)}&monsterName=${encodeURIComponent(preGenData.name)}&rarity=${encodeURIComponent(preGenData.rarity)}&element=${encodeURIComponent(preGenData.element)}&powerLevel=${encodeURIComponent(preGenData.powerLevel.toString())}`;

      const shareText = `Just minted my FrameShadows monster! 👾⚔️\n\n${preGenData.name} • ${preGenData.rarity} ${preGenData.element} • Power: ${preGenData.powerLevel}\n\nMint yours now!\n\nby @ismaone.farcaster.eth`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [embedUrl],
      });
    } catch (error) {
      console.error('[Monster Generator] Failed to share with embed:', error);

      try {
        await sdk.actions.composeCast({
          text: `Just minted my FrameShadows monster! 👾⚔️\n\n${preGenData.name} • ${preGenData.rarity} ${preGenData.element}\n\nMint yours now!\n\nby @ismaone.farcaster.eth`,
          embeds: [preGenData.imageUrl, appUrl],
        });
      } catch (fallbackError) {
        console.error('[Monster Generator] Fallback share failed:', fallbackError);

        if (navigator.share) {
          try {
            await navigator.share({
              title: 'FrameShadows Monster',
              text: `Check out my ${preGenData.name}!`,
              url: appUrl,
            });
          } catch (shareError) {
            console.error('[Monster Generator] Native share failed:', shareError);
          }
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const mintMonster = async () => {
    if (!fid || !address) {
      setError('Profile data or wallet not found');
      return;
    }

    // FID limit removed - public can mint multiple monsters!
    // if (!canMint) {
    //   setError('You already have a FrameShadow! Only 1 per FID allowed.');
    //   return;
    // }

    setStep('generating-image');
    setError(null);

    try {
      // Generate new random monster ID (for deterministic traits)
      const monsterId = Math.floor(Date.now() / 1000) + fid + Math.floor(Math.random() * 1000);
      const nextTokenId = totalSupply ? (totalSupply as bigint) + BigInt(1) : BigInt(1);
      const tokenIdStr = nextTokenId.toString();
      
      console.log('[Monster Generator] Starting generation for token:', tokenIdStr);

      // Generate monster attributes
      const attributes: MonsterAttributes = generateMonsterAttributes(monsterId);
      console.log('[Monster Generator] Generated attributes:', attributes);

      // Generate FluxPro prompt
      const prompt = generateMonsterPrompt(attributes);
      console.log('[Monster Generator] Prompt:', prompt.substring(0, 150) + '...');

      setProgress('🎨 Generating anime monster art with FluxPro... (1-2 min)');
      
      // Submit to FluxPro
      const requestId = await fluxproSubmit({
        prompt,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'png',
        safety_tolerance: '3',
        seed: monsterId,
      });

      setProgress('⏳ Processing your monster artwork...');
      await fluxproPollStatus(requestId);
      
      setProgress('📥 Fetching generated images...');
      const images = await fluxproFetchImages(requestId);
      
      if (!images || images.length === 0) {
        throw new Error('Failed to generate monster image');
      }

      const imageUrl = images[0].url;
      console.log('[Monster Generator] Image URL:', imageUrl);

      // Wait for image to be accessible
      setProgress('🔍 Verifying image accessibility...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Download image and compress it
      setProgress('📥 Downloading image...');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Image download failed: HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
      }

      const imageBlob = await imageResponse.blob();
      console.log('[Monster Generator] Original image size:', imageBlob.size, 'bytes', `(${(imageBlob.size / 1024 / 1024).toFixed(2)}MB)`);

      // COMPRESS IMAGE before uploading to IPFS
      setProgress('🗜️ Compressing image...');
      const compressResponse = await fetch('/api/monsters/compress-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      let finalImageBlob = imageBlob;
      if (!compressResponse.ok) {
        console.error('[Monster Generator] Compression failed, using original image');
      } else {
        const compressedBlob = await compressResponse.blob();
        console.log('[Monster Generator] Compressed image size:', compressedBlob.size, 'bytes', `(${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Use compressed image if smaller
        finalImageBlob = compressedBlob.size < imageBlob.size ? compressedBlob : imageBlob;
        console.log('[Monster Generator] Using', finalImageBlob === compressedBlob ? 'compressed' : 'original', 'image for upload');
      }

      // Upload COMPRESSED image to Lighthouse IPFS
      setProgress('☁️ Uploading compressed image to IPFS...');
      const timestamp = Date.now();
      const monsterName = `${attributes.type} #${tokenIdStr}`;

      const lighthouseResult: LighthouseImageWithMetadataResult = await lighthouseUploadImageWithMetadata({
        image: finalImageBlob,
        filename: `frameshadows-${tokenIdStr}-${timestamp}.png`,
        metadata: {
          name: monsterName,
          description: `A wild ${attributes.rarity} ${attributes.element} ${attributes.type} from the FrameShadows collection. Power Level: ${attributes.powerLevel}`,
          attributes: [
            { trait_type: 'Monster Type', value: attributes.type },
            { trait_type: 'Rarity', value: attributes.rarity },
            { trait_type: 'Element', value: attributes.element },
            { trait_type: 'Power Level', value: attributes.powerLevel },
            { trait_type: 'Level', value: attributes.level },
          ],
          external_url: `https://warpcast.com/~/profiles/${fid}`,
        },
      });

      console.log('[Monster Generator] Lighthouse upload complete:', lighthouseResult);

      // Prepare pre-gen data
      const preGenResult: PreGenResult = {
        name: monsterName,
        tokenId: tokenIdStr,
        monsterId,
        type: attributes.type,
        rarity: attributes.rarity,
        element: attributes.element,
        level: attributes.level,
        powerLevel: attributes.powerLevel,
        imageUrl: lighthouseResult.image.pin.gatewayUrl,
        ipfsUri: lighthouseResult.image.pin.ipfsUri,
        ipfsGateway: lighthouseResult.image.pin.gatewayUrl,
        metadataUri: lighthouseResult.metadata.pin.ipfsUri,
        metadataGateway: lighthouseResult.metadata.pin.gatewayUrl,
      };

      // Store pre-gen data for later
      setPreGenData(preGenResult);

      // Now mint with proper metadata URI
      setStep('minting');
      setProgress(`Minting ${preGenResult.name} (0.0001 ETH)...`);
      console.log('[Monster Generator] Starting mint with metadata URI:', preGenResult.metadataUri);
      
      writeContract({
        address: FRAMESHADOWS_CONTRACT.address as `0x${string}`,
        abi: FRAMESHADOWS_CONTRACT.abi,
        functionName: 'mintMonster',
        args: [
          BigInt(monsterId),
          BigInt(preGenResult.powerLevel),
          preGenResult.metadataUri, // IPFS URI from pre-generation!
          true, // isWild
        ],
        value: MONSTER_MINT_PRICE,
      });

      setProgress('Waiting for transaction confirmation...');
    } catch (err) {
      console.error('[Monster Generator] Mint error:', err);
      setStep('error');
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setProgress('');
    }
  };

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <Card className="bg-card border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            <span>Connecting wallet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card className="bg-card border border-purple-500/20">
        <CardContent className="pt-6">
          <Alert className="bg-purple-500/10 border-purple-500/20">
            <AlertDescription className="text-foreground">
              Please open this app in Warpcast to connect your wallet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // PUBLIC MINTING NOW OPEN! Early access removed!
  // if (!isOwner) {
  //   return (
  //     <Card>...</Card>
  //   );
  // }

  const nextTokenId = totalSupply ? Number(totalSupply as bigint) + 1 : 1;
  const currentSupply = totalSupply ? Number(totalSupply as bigint) : 0;
  const hasReachedLimit = currentSupply >= 300;

  // Show loading state while checking (but always allow minting after!)
  if (isCheckingLimit) {
    return (
      <Card className="border border-red-500/20 bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-red-400" />
            <span className="text-sm font-medium">Checking your monster status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-red-500/20 bg-card">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <Skull className="h-6 w-6 text-red-400" />
          </div>
          <span className="text-red-400 font-black">
            Mint Monster NFT
          </span>
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          <div className="flex flex-col gap-1">
            {hasReachedLimit ? (
              <span className="text-red-400 font-medium">Minting Closed • 300/300 Minted!</span>
            ) : (
              <span className="text-red-400 font-medium">Mint FrameShadows #{nextTokenId} • Anime art generated first!</span>
            )}
            <span className="text-xs text-muted-foreground">
              {hasReachedLimit ? 'All 300 monsters have been minted!' : `Price: 0.0001 ETH • ${currentSupply}/300 Minted`}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'idle' && (
          <div className="space-y-3">
            {hasReachedLimit ? (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-foreground">
                  <div className="space-y-2">
                    <p className="font-bold">Minting Closed!</p>
                    <p className="text-sm">All 300 FrameShadows monsters have been minted. Check out the existing collection!</p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Button
                  onClick={mintMonster}
                  disabled={!fid || !address}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold disabled:opacity-50"
                  size="lg"
                >
                  <Coins className="h-5 w-5 mr-2" />
                  Mint FrameShadows #{nextTokenId} (0.0001 ETH)
                </Button>
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    👾 Image generated FIRST (1-2 min) → Then mint with traits ready!
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'generating-image' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <ImageIcon className="h-12 w-12 text-red-400 animate-pulse" />
              <span className="font-semibold text-foreground text-center">{progress}</span>
            </div>
            <div className="bg-secondary rounded-full h-3 overflow-hidden border border-red-500/20">
              <div 
                className="bg-red-500 h-full transition-all duration-500 ease-out animate-pulse"
                style={{ width: '40%' }}
              />
            </div>
            <p className="text-xs text-center text-gray-400 italic">
              FluxPro is generating your anime monster... Please wait! 🎨
            </p>
          </div>
        )}

        {(step === 'minting' || isMintPending) && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-red-400" />
              </div>
              <span className="font-semibold text-foreground text-center">{progress}</span>
            </div>
            <div className="bg-secondary rounded-full h-3 overflow-hidden border border-red-500/20">
              <div 
                className="bg-red-500 h-full transition-all duration-500 ease-out"
                style={{ width: '75%' }}
              />
            </div>
            <p className="text-xs text-center text-gray-400 italic">
              Minting NFT on blockchain... Please confirm transaction 💸
            </p>
          </div>
        )}

        {step === 'saving' && (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-foreground">
                Monster minted! Saving data with complete traits...
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <Loader2 className="h-12 w-12 text-green-400 animate-spin" />
              <span className="font-semibold text-foreground text-center">
                {progress}
              </span>
            </div>
            <div className="bg-secondary rounded-full h-3 overflow-hidden border border-green-500/20">
              <div 
                className="bg-green-500 h-full transition-all duration-500 ease-out"
                style={{ width: '95%' }}
              />
            </div>
          </div>
        )}

        {step === 'complete' && preGenData && (
          <div className="space-y-3">
            <Alert className="bg-red-500/10 border-red-500/20">
              <CheckCircle2 className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-foreground">
                {progress}
              </AlertDescription>
            </Alert>
            <div className="bg-secondary rounded-lg p-4 border border-red-500/10 space-y-2">
              <p className="text-sm font-bold text-foreground">{preGenData.name}</p>
              <p className="text-xs text-muted-foreground">
                Type: <span className="text-red-400">{preGenData.type}</span> • 
                Rarity: <span className="text-red-400">{preGenData.rarity}</span> • 
                Element: <span className="text-red-400">{preGenData.element}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Power Level: <span className="text-red-400">{preGenData.powerLevel}</span>
              </p>
            </div>
            {/* Share Button */}
            <Button
              onClick={handleShareMonster}
              disabled={isSharing}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
              size="lg"
            >
              {isSharing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to Farcaster
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'error' && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-secondary rounded-lg p-4 border border-red-500/10">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              <p className="font-medium">NEW FLOW: Image generated FIRST!</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              <p className="font-medium">FluxPro anime art + Lighthouse IPFS</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              <p className="font-medium">Traits complete from the start!</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              <p className="font-medium">{hasReachedLimit ? '300/300 Minted - Collection Complete!' : `${currentSupply}/300 Minted • 0.0001 ETH each`}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
