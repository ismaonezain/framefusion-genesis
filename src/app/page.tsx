'use client'
import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { NFTGenerator } from '@/components/nft-generator';
import { NFTDisplay } from '@/components/nft-display';
import { CollectionStats } from '@/components/collection-stats';
import { AdminPanel } from '@/components/admin-panel';
import { CheckInPanel } from '@/components/checkin-panel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Palette, Info, Settings, Gift } from 'lucide-react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import type { NFTRecord } from '@/lib/supabase';
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";
import { useAutoConnectWallet } from '@/hooks/useAutoConnectWallet';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  useAutoConnectWallet(); // Auto-connect wallet on page load
  const [fid, setFid] = useState<number | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [existingNFT, setExistingNFT] = useState<NFTRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const platform = usePlatformDetection();
  const { addMiniApp } = useAddMiniApp();
  const isInFarcaster = useIsInFarcaster();
  useQuickAuth(isInFarcaster);

  // DISABLED: Auto add mini app prompt
  // Uncomment when ready to enable notifications (requires Neynar Starter plan)
  // useEffect(() => {
  //   const tryAddMiniApp = async () => {
  //     try {
  //       await addMiniApp();
  //     } catch (error) {
  //       console.error('Failed to add mini app:', error);
  //     }
  //   };

  //   tryAddMiniApp();
  // }, [addMiniApp]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await sdk.actions.ready();
        const context = await sdk.context;
        if (!cancelled && context?.user?.fid) {
          const userFid = context.user.fid;
          setFid(userFid);
          setPfpUrl(context.user.pfpUrl || null);
          setUsername(context.user.username || null);
          
          const response = await fetch(`/api/nft/check?fid=${userFid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.exists && data.nft) {
              setExistingNFT(data.nft);
            }
          }

          // Check follow status (bypass for ismaone FID 235940)
          if (userFid === 235940) {
            setIsFollowing(true);
          } else {
            const followResponse = await fetch(`/api/check-follow?fid=${userFid}`);
            if (followResponse.ok) {
              const followData = await followResponse.json();
              setIsFollowing(followData.isFollowing);
            } else {
              setIsFollowing(true);
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNFTGenerated = (nft: NFTRecord) => {
    setExistingNFT(nft);
  };

  // Check if user is owner (FID 235940 - ismaone)
  const isOwner = fid === 235940;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-2xl mx-auto p-4 pt-12 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-1 rounded-2xl">
            <div className="bg-white rounded-xl px-6 py-3 flex items-center gap-3">
              <img 
                src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/208df599-0a41-4b8f-aad0-df9e93908ab3-4hD0zY1K0UJBTM1tESZBp7JfX1ElNl" 
                alt="FrameFusion Logo"
                className="h-12 w-12 object-contain animate-pulse"
              />
              <div className="text-left">
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  FrameFusion
                </h1>
                <p className="text-sm font-semibold text-gray-500">Genesis Collection</p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 max-w-xl mx-auto text-lg font-medium">
            Transform your Farcaster identity into exclusive AI-generated NFT art. 
            <span className="block mt-1 text-purple-600 font-bold">Limited to 3000 pieces.</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold">
              1 FID = 1 NFT
            </Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700 font-semibold">
              Max 3000
            </Badge>
          </div>
        </div>

        <CollectionStats />

        {/* OnchainKit Wallet Connection */}
        {!loading && !isConnected && (
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Connect Your Wallet</h3>
                  <p className="text-sm text-gray-600">Connect to generate and mint your unique NFT</p>
                </div>
                <ConnectWallet className="w-full max-w-xs" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content with Tabs */}
        {isOwner ? (
          <Tabs defaultValue="app" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                NFT
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="app" className="space-y-6">
              {existingNFT && fid ? (
                <NFTDisplay nft={existingNFT} platform={platform} fid={fid} />
              ) : (
                address && pfpUrl && (
                  <NFTGenerator 
                    onNFTGenerated={handleNFTGenerated}
                    pfpUrl={pfpUrl}
                    username={username}
                    isFollowing={isFollowing}
                    onVerifyFollow={async () => {
                      if (!fid) return;
                      if (fid === 235940) {
                        setIsFollowing(true);
                        return;
                      }
                      const followResponse = await fetch(`/api/check-follow?fid=${fid}`);
                      if (followResponse.ok) {
                        const followData = await followResponse.json();
                        setIsFollowing(followData.isFollowing);
                      }
                    }}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="rewards">
              {fid && <CheckInPanel fid={fid} />}
            </TabsContent>

            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="app" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                NFT
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="app" className="space-y-6">
              {existingNFT && fid ? (
                <NFTDisplay nft={existingNFT} platform={platform} fid={fid} />
              ) : (
                address && pfpUrl && (
                  <NFTGenerator 
                    onNFTGenerated={handleNFTGenerated}
                    pfpUrl={pfpUrl}
                    username={username}
                    isFollowing={isFollowing}
                    onVerifyFollow={async () => {
                      if (!fid) return;
                      if (fid === 235940) {
                        setIsFollowing(true);
                        return;
                      }
                      const followResponse = await fetch(`/api/check-follow?fid=${fid}`);
                      if (followResponse.ok) {
                        const followData = await followResponse.json();
                        setIsFollowing(followData.isFollowing);
                      }
                    }}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="rewards">
              {fid && <CheckInPanel fid={fid} />}
            </TabsContent>
          </Tabs>
        )}

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">About FrameFusion Genesis</h3>
                  <p className="text-sm text-white/95 leading-relaxed">
                    An exclusive collection of 3000 unique AI-generated NFTs. Each artwork is uniquely created from your Farcaster profile picture, making every piece truly one-of-a-kind!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white border-0 shadow-xl">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Collection Rules:</h3>
                  <ul className="text-sm text-white/95 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-white/70">•</span>
                      <span>Follow @ismaone to generate your NFT</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/70">•</span>
                      <span>1 FID = 1 NFT (one generation per person)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/70">•</span>
                      <span>First come, first served - max 3000 pieces</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/70">•</span>
                      <span>Permanently stored on IPFS & shareable</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white border-0">
          <CardContent className="pt-6 pb-6 text-center space-y-2">
            <p className="text-sm font-medium">
              Created with <span className="text-red-400 animate-pulse">❤️</span> by{' '}
              <a 
                href="https://warpcast.com/ismaone" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-purple-300 hover:text-purple-200 underline"
              >
                @ismaone.farcaster.eth
              </a>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Badge variant="outline" className="border-purple-400 text-purple-300">
                {platform === 'base' ? 'Base' : 'Farcaster'} Mini App
              </Badge>
              <span>•</span>
              <span>Powered by AI & IPFS</span>
              <span>•</span>
              <span>Built on Base</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
