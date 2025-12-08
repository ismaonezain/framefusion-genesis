'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';
import { prepareNFTMetadata } from '@/lib/prepare-nft-metadata';
import type { NFTRecord } from '@/lib/supabase';

type MintNFTButtonV2Props = {
  nft: NFTRecord;
  fid: number;
  onMintSuccess: (tokenId: bigint, txHash: string) => void;
};

export function MintNFTButtonV2({ nft, fid, onMintSuccess }: MintNFTButtonV2Props) {
  const { address } = useAccount();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyMinted, setAlreadyMinted] = useState<boolean | null>(null);

  // Check if FID already minted on-chain
  const { data: hasMintedOnChain } = useReadContract({
    address: NFT_CONTRACT_ADDRESS_V2,
    abi: NFT_CONTRACT_ABI_V2,
    functionName: 'checkIfMinted',
    args: [BigInt(fid)],
  });

  useEffect(() => {
    if (hasMintedOnChain !== undefined) {
      setAlreadyMinted(hasMintedOnChain as boolean);
    }
  }, [hasMintedOnChain]);

  const { data: hash, writeContract, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!address || nft.minted || alreadyMinted) {
      setError('This FID has already minted an NFT');
      return;
    }
    
    setMinting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('[Mint V2] Starting mint transaction with full metadata...');
      console.log('[Mint V2] Contract:', NFT_CONTRACT_ADDRESS_V2);
      console.log('[Mint V2] To:', address);
      console.log('[Mint V2] Token URI:', nft.metadata_uri);
      console.log('[Mint V2] FID:', fid);

      // Prepare metadata from FID
      const metadata = prepareNFTMetadata(fid);
      console.log('[Mint V2] Metadata:', metadata);

      // Call safeMint function with full metadata
      // Order: address, fid, tokenURI, characterClass, classDescription, gender, background, backgroundDescription, colorPalette, colorVibe, clothing, accessories, items
      writeContract({
        address: NFT_CONTRACT_ADDRESS_V2,
        abi: NFT_CONTRACT_ABI_V2,
        functionName: 'safeMint',
        args: [
          address,
          BigInt(fid),
          nft.metadata_uri,
          metadata.characterClass,
          metadata.classDescription,
          metadata.gender,
          metadata.background,
          metadata.backgroundDescription,
          metadata.colorPalette,
          metadata.colorVibe,
          metadata.clothing,
          metadata.accessories,
          metadata.items,
        ],
      });
    } catch (err) {
      console.error('[Mint V2] Transaction error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to mint NFT';
      setError(errorMsg);
      setMinting(false);
    }
  };

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('[Mint V2] Write contract error:', writeError);
      let errorMessage = 'Transaction failed';
      
      if (writeError.message.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (writeError.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (writeError.message.includes('Already minted') || writeError.message.includes('FID already minted')) {
        errorMessage = 'This FID has already minted an NFT';
      } else if (writeError.message.includes('Max supply reached')) {
        errorMessage = 'Collection sold out (3000/3000 minted)';
      } else {
        errorMessage = writeError.message.slice(0, 100);
      }
      
      setError(errorMessage);
      setMinting(false);
    }
  }, [writeError]);

  // Fetch actual token ID from contract after minting
  const { data: tokenIdData } = useReadContract({
    address: NFT_CONTRACT_ADDRESS_V2,
    abi: NFT_CONTRACT_ABI_V2,
    functionName: 'getTokenIdByFid',
    args: [BigInt(fid)],
    query: {
      enabled: isConfirmed && !!hash && !success,
    }
  });

  // Watch for confirmation
  useEffect(() => {
    if (isConfirmed && hash && !success && tokenIdData !== undefined) {
      setSuccess(true);
      setMinting(false);
      
      const tokenId = tokenIdData as bigint;
      
      // Update database with mint status
      fetch('/api/nft/update-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          contract_address: NFT_CONTRACT_ADDRESS_V2,
          tx_hash: hash,
          token_id: tokenId.toString(),
          minted: true,
        }),
      }).catch(console.error);

      // Notify parent component with actual token ID
      onMintSuccess(tokenId, hash);
    }
  }, [isConfirmed, hash, success, tokenIdData, fid, onMintSuccess]);

  if (nft.minted || alreadyMinted) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 font-semibold">
          ✅ NFT already minted on blockchain with full metadata!
        </AlertDescription>
      </Alert>
    );
  }

  if (alreadyMinted === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        <span className="text-gray-600">Checking mint status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleMint}
        disabled={minting || isWritePending || isConfirming || !address || alreadyMinted === true}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        size="lg"
      >
        {isWritePending || isConfirming ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {isWritePending ? 'Preparing transaction...' : 'Confirming on blockchain...'}
          </>
        ) : (
          <>
            <Coins className="h-5 w-5 mr-2" />
            Mint NFT V2 (With Metadata)
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong className="block mb-1">🎉 NFT Minted Successfully with Full Metadata!</strong>
            <span className="text-sm">Your NFT with complete on-chain metadata has been minted on Base blockchain.</span>
          </AlertDescription>
        </Alert>
      )}

      {hash && (
        <div className="text-xs text-center text-gray-500">
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View transaction on BaseScan
          </a>
        </div>
      )}

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-900 text-center font-medium">
          💎 Minting will store all metadata on-chain: Character class, background, accessories, clothing, and more!
        </p>
      </div>
    </div>
  );
}
