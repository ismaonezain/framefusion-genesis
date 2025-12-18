'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Swords, Shuffle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  WEAPON_NFT_CONTRACT,
  WeaponClass,
  WeaponRarity,
  getWeaponClassName,
  getRarityName,
  getRarityColor,
  WEAPON_MINT_COSTS,
  getWeaponNameByRarity,
  BASE_ATTACK_POWER,
} from '@/lib/weapon-contract';

interface WeaponImage {
  weapon_class: number;
  rarity: number;
  weapon_name: string;
  image_url: string;
  ipfs_uri: string;
  metadata_url: string;
  metadata_ipfs_uri: string;
}

interface WeaponMintPanelProps {
  weaponImages: WeaponImage[];
  isLoadingImages: boolean;
  selectedWeapon: WeaponImage | null;
  onSelectWeapon: (weapon: WeaponImage | null) => void;
}

export function WeaponMintPanel({
  weaponImages,
  isLoadingImages,
  selectedWeapon,
  onSelectWeapon,
}: WeaponMintPanelProps) {
  const { address, status } = useAccount();
  const [isSaving, setIsSaving] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  const { data: hash, writeContract, isPending: isMinting, error: mintError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRandomSelect = () => {
    if (weaponImages.length === 0) return;
    const randomWeapon = weaponImages[Math.floor(Math.random() * weaponImages.length)];
    onSelectWeapon(randomWeapon);
    toast.success('Random weapon selected!', {
      description: `${getRarityName(randomWeapon.rarity)} ${getWeaponClassName(randomWeapon.weapon_class)}`,
    });
  };

  const handleMint = async () => {
    if (!selectedWeapon || !address) {
      toast.error('Please select a weapon and connect your wallet');
      return;
    }

    try {
      const weaponClass = selectedWeapon.weapon_class as WeaponClass;
      const rarity = selectedWeapon.rarity as WeaponRarity;
      const weaponType = getWeaponNameByRarity(weaponClass, rarity);
      const attackPower = BASE_ATTACK_POWER[rarity];
      const mintCost = WEAPON_MINT_COSTS[rarity];

      // Call smart contract mintWeapon function
      writeContract({
        address: WEAPON_NFT_CONTRACT.address,
        abi: WEAPON_NFT_CONTRACT.abi,
        functionName: 'mintWeapon',
        args: [
          weaponClass,
          weaponType,
          rarity,
          BigInt(attackPower),
          selectedWeapon.metadata_ipfs_uri,
        ],
        value: mintCost,
      });

      toast.info('Transaction submitted...', {
        description: 'Please confirm in your wallet',
      });
    } catch (error) {
      console.error('Mint error:', error);
      toast.error('Failed to mint weapon', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle transaction confirmation
  const handleTransactionConfirmed = async () => {
    if (!selectedWeapon || !address || !hash) return;

    setIsSaving(true);

    try {
      // Save minted weapon to database
      const response = await fetch('/api/weapons/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          weaponClass: selectedWeapon.weapon_class,
          rarity: selectedWeapon.rarity,
          transactionHash: hash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save weapon');
      }

      setMintedTokenId(data.weapon.tokenId?.toString() || 'Pending');

      toast.success('Weapon minted successfully! ⚔️', {
        description: `${getRarityName(selectedWeapon.rarity)} ${getWeaponClassName(selectedWeapon.weapon_class)} added to your inventory`,
      });

      // Reset selection after successful mint
      onSelectWeapon(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Weapon minted but failed to save to database', {
        description: 'Please contact support',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when transaction is confirmed
  if (isConfirmed && !isSaving && !mintedTokenId) {
    handleTransactionConfirmed();
  }

  if (status !== 'connected') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6" />
            Weapon Minting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to mint weapons
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Selection Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Select Your Weapon
          </CardTitle>
          <CardDescription>
            Choose a specific weapon from the gallery or let fate decide with random selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedWeapon ? (
            <SelectedWeaponPreview
              weapon={selectedWeapon}
              onDeselect={() => onSelectWeapon(null)}
            />
          ) : (
            <div className="text-center py-8">
              <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No weapon selected</p>
              <Button onClick={handleRandomSelect} disabled={isLoadingImages || weaponImages.length === 0}>
                <Shuffle className="mr-2 h-4 w-4" />
                Random Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minting Panel */}
      {selectedWeapon && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-6 w-6" />
              Mint Weapon NFT
            </CardTitle>
            <CardDescription>
              Forge your weapon on the Base blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mint Cost */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mint Cost:</span>
                <span className="text-lg font-bold">
                  {(Number(WEAPON_MINT_COSTS[selectedWeapon.rarity as WeaponRarity]) / 1e18).toFixed(4)} ETH
                </span>
              </div>
            </div>

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isMinting || isConfirming || isSaving}
              className="w-full"
              size="lg"
            >
              {isMinting || isConfirming || isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isMinting ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Saving...'}
                </>
              ) : isConfirmed && mintedTokenId ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Minted Successfully!
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mint Weapon
                </>
              )}
            </Button>

            {/* Transaction Status */}
            {hash && (
              <div className="text-xs text-center text-muted-foreground">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                <a
                  href={`https://basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:text-foreground"
                >
                  View on BaseScan
                </a>
              </div>
            )}

            {mintError && (
              <div className="text-xs text-center text-destructive">
                Error: {mintError.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SelectedWeaponPreviewProps {
  weapon: WeaponImage;
  onDeselect: () => void;
}

function SelectedWeaponPreview({ weapon, onDeselect }: SelectedWeaponPreviewProps) {
  const className = getWeaponClassName(weapon.weapon_class);
  const rarityName = getRarityName(weapon.rarity);
  const rarityColor = getRarityColor(weapon.rarity);
  const attackPower = BASE_ATTACK_POWER[weapon.rarity as WeaponRarity];

  return (
    <div className="relative">
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
        style={{ backgroundColor: rarityColor }}
      />

      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {/* Image Preview */}
        <div className="bg-gradient-to-br from-muted/50 to-muted rounded-lg p-6">
          <img
            src={weapon.image_url}
            alt={weapon.weapon_name}
            className="w-full h-full max-h-64 object-contain"
          />
        </div>

        {/* Weapon Details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{weapon.weapon_name}</h3>
            <p className="text-sm text-muted-foreground">{className}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rarity</span>
              <Badge style={{ backgroundColor: rarityColor, color: 'white' }}>
                {rarityName}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Class</span>
              <span className="text-sm font-medium">{className}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base Attack Power</span>
              <span className="text-sm font-bold">{attackPower}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Starting Level</span>
              <span className="text-sm font-medium">1</span>
            </div>
          </div>

          <Button variant="outline" onClick={onDeselect} className="w-full mt-4">
            Choose Different Weapon
          </Button>
        </div>
      </div>
    </div>
  );
}
