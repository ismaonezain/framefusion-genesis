'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Rocket, CheckCircle2, AlertCircle, Flame, Trophy } from 'lucide-react';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';
import { NFT_CONTRACT_ADDRESS_V3, NFT_CONTRACT_ABI_V3, getV3MetadataURL } from '@/lib/nft-contract-v3';
import type { NFTRecord } from '@/lib/supabase';

type MigrateNFTV3ButtonProps = {
  nft: NFTRecord;
  fid: number;
  onMigrationSuccess: (v3TokenId: bigint, txHash: string) => void;
};

export function MigrateNFTV3Button({ nft, fid, onMigrationSuccess }: MigrateNFTV3ButtonProps) {
  const { address } = useAccount();
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'migrating' | 'complete'>('idle');
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [migrationHash, setMigrationHash] = useState<string | null>(null);

  // Check if V3 contract is deployed
  const isV3Deployed = NFT_CONTRACT_ADDRESS_V3 !== '0x0000000000000000000000000000000000000000';

  // Check if user owns V2 NFT
  const { data: v2Owner } = useReadContract({
    address: NFT_CONTRACT_ADDRESS_V2,
    abi: NFT_CONTRACT_ABI_V2,
    functionName: 'ownerOf',
    args: nft.token_id ? [BigInt(nft.token_id)] : undefined,
    query: {
      enabled: !!nft.token_id && nft.minted,
    },
  });

  const ownsV2NFT = v2Owner?.toString().toLowerCase() === address?.toLowerCase();

  // Check if already migrated to V3
  const { data: hasMintedV3 } = useReadContract({
    address: NFT_CONTRACT_ADDRESS_V3 as `0x${string}`,
    abi: NFT_CONTRACT_ABI_V3,
    functionName: 'checkIfMinted',
    args: [BigInt(fid)],
    query: {
      enabled: isV3Deployed,
    },
  });

  // Approval transaction
  const { 
    writeContract: approveV3, 
    data: approvalTxHash, 
    isPending: isApprovePending,
    error: approveError 
  } = useWriteContract();

  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // Migration transaction
  const { 
    writeContract: migrate, 
    data: migrateTxHash, 
    isPending: isMigratePending,
    error: migrateError 
  } = useWriteContract();

  const { 
    isLoading: isMigrateConfirming, 
    isSuccess: isMigrateConfirmed 
  } = useWaitForTransactionReceipt({
    hash: migrateTxHash,
  });

  // Step 1: Approve V3 contract to transfer V2 NFT
  const handleApprove = async () => {
    if (!address || !nft.token_id || !ownsV2NFT) {
      setError('You do not own this V2 NFT');
      return;
    }

    setMigrating(true);
    setError(null);
    setStep('approving');

    try {
      console.log('[Migration] Step 1: Approving V3 contract...');
      console.log('[Migration] V2 Contract:', NFT_CONTRACT_ADDRESS_V2);
      console.log('[Migration] V3 Contract:', NFT_CONTRACT_ADDRESS_V3);
      console.log('[Migration] Token ID:', nft.token_id);

      approveV3({
        address: NFT_CONTRACT_ADDRESS_V2,
        abi: NFT_CONTRACT_ABI_V2,
        functionName: 'approve',
        args: [NFT_CONTRACT_ADDRESS_V3 as `0x${string}`, BigInt(nft.token_id)],
      });
    } catch (err) {
      console.error('[Migration] Approval error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve';
      setError(errorMsg);
      setMigrating(false);
      setStep('idle');
    }
  };

  // Step 2: Migrate NFT after approval confirmed
  const handleMigrate = async () => {
    if (!address || !nft.token_id) return;

    setStep('migrating');

    try {
      console.log('[Migration] Step 2: Migrating to V3...');
      const metadataURL = getV3MetadataURL(fid);
      console.log('[Migration] Metadata URL:', metadataURL);

      migrate({
        address: NFT_CONTRACT_ADDRESS_V3 as `0x${string}`,
        abi: NFT_CONTRACT_ABI_V3,
        functionName: 'migrateFromV2',
        args: [
          BigInt(nft.token_id),
          BigInt(fid),
          metadataURL,
        ],
      });
    } catch (err) {
      console.error('[Migration] Migration error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to migrate';
      setError(errorMsg);
      setMigrating(false);
      setStep('idle');
    }
  };

  // Watch for approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && approvalTxHash) {
      console.log('[Migration] Approval confirmed! Hash:', approvalTxHash);
      setApprovalHash(approvalTxHash);
      // Auto-proceed to migration
      handleMigrate();
    }
  }, [isApprovalConfirmed, approvalTxHash]);

  // Watch for migration confirmation
  useEffect(() => {
    if (isMigrateConfirmed && migrateTxHash && !success) {
      console.log('[Migration] Migration confirmed! Hash:', migrateTxHash);
      setMigrationHash(migrateTxHash);
      setSuccess(true);
      setMigrating(false);
      setStep('complete');

      // Update database
      fetch('/api/nft/update-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          migrated_to_v3: true,
          v3_token_id: nft.token_id, // V3 token ID will be same as V2
          v3_tx_hash: migrateTxHash,
        }),
      }).catch(console.error);

      // Notify parent
      onMigrationSuccess(BigInt(nft.token_id || 0), migrateTxHash);
    }
  }, [isMigrateConfirmed, migrateTxHash, success]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      console.error('[Migration] Approve error:', approveError);
      let errorMessage = 'Approval failed';
      if (approveError.message.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      setError(errorMessage);
      setMigrating(false);
      setStep('idle');
    }
  }, [approveError]);

  useEffect(() => {
    if (migrateError) {
      console.error('[Migration] Migrate error:', migrateError);
      let errorMessage = 'Migration failed';
      if (migrateError.message.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      setError(errorMessage);
      setMigrating(false);
      setStep('idle');
    }
  }, [migrateError]);

  // UI: V3 not deployed yet
  if (!isV3Deployed) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>V3 Contract Coming Soon!</strong>
          <p className="text-sm mt-1">Migration to V3 with traits system will be available after contract deployment.</p>
        </AlertDescription>
      </Alert>
    );
  }

  // UI: Already migrated
  if (hasMintedV3) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 font-semibold">
          ✅ Already migrated to V3 with traits system!
        </AlertDescription>
      </Alert>
    );
  }

  // UI: Don't own V2 NFT
  if (!ownsV2NFT && !migrating) {
    return (
      <Alert className="bg-gray-50 border-gray-200">
        <AlertCircle className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-gray-800">
          You need to own the V2 NFT to migrate it to V3.
        </AlertDescription>
      </Alert>
    );
  }

  // UI: Not minted yet
  if (!nft.minted) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Mint your V2 NFT first before migrating to V3.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Rocket className="h-5 w-5" />
          Migrate to V3 🚀
        </CardTitle>
        <CardDescription>
          Upgrade your NFT to V3 with unlockable traits and dynamic metadata!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="bg-white/80 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-purple-900 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            V3 Benefits:
          </h4>
          <ul className="text-sm space-y-1 text-purple-800">
            <li className="flex items-center gap-2">
              <Flame className="h-3 w-3 text-orange-500" />
              Earn traits through engagement (check-ins, claims)
            </li>
            <li className="flex items-center gap-2">
              <Trophy className="h-3 w-3 text-yellow-500" />
              Achievement badges (Early Adopter, Streak Legend, etc.)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Loyalty tiers: Bronze → Silver → Gold → Diamond
            </li>
            <li className="flex items-center gap-2">
              <Rocket className="h-3 w-3 text-blue-500" />
              Dynamic metadata visible on OpenSea
            </li>
          </ul>
        </div>

        {/* Migration Button */}
        <Button
          onClick={handleApprove}
          disabled={migrating || isApprovePending || isMigratePending || isMigrateConfirming || !ownsV2NFT}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          size="lg"
        >
          {step === 'approving' || isApprovePending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Step 1/2: Approving V3 contract...
            </>
          ) : step === 'migrating' || isMigratePending || isMigrateConfirming ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Step 2/2: Migrating to V3...
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5 mr-2" />
              Migrate to V3 (2 transactions)
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong className="block mb-1">🎉 Successfully Migrated to V3!</strong>
              <span className="text-sm">Your NFT now has dynamic traits and will earn more as you engage!</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Links */}
        {(approvalHash || migrationHash) && (
          <div className="text-xs space-y-1">
            {approvalHash && (
              <div className="text-center text-gray-500">
                <a
                  href={`https://basescan.org/tx/${approvalHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View approval transaction
                </a>
              </div>
            )}
            {migrationHash && (
              <div className="text-center text-gray-500">
                <a
                  href={`https://basescan.org/tx/${migrationHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View migration transaction
                </a>
              </div>
            )}
          </div>
        )}

        {/* Process Info */}
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-900 font-medium">
            📋 Migration Process:
          </p>
          <ol className="text-xs text-purple-800 mt-2 space-y-1 list-decimal list-inside">
            <li>Approve V3 contract to transfer your V2 NFT</li>
            <li>V3 contract burns your V2 NFT and mints new V3 NFT</li>
            <li>Your new V3 NFT has all original art + dynamic traits!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
