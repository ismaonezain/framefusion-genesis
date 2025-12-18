'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  ArrowUp,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
  Skull,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getRarityColor,
  UPGRADE_COSTS,
  UPGRADE_SUCCESS_RATES,
  WEAPON_BREAK_THRESHOLD,
  WEAPON_BREAK_CHANCE,
  calculateUpgradePowerBonus,
  WeaponRarity,
} from '@/lib/weapon-contract';

interface Weapon {
  id: string;
  token_id: number;
  weapon_class: number;
  weapon_type: string;
  rarity: number;
  level: number;
  attack_power: number;
  equipped_to: number | null;
  is_broken: boolean;
  image_url: string;
  className: string;
  rarityName: string;
  rarityColor: string;
  isEquipped: boolean;
  upgrade_attempts: number;
  successful_upgrades: number;
  failed_upgrades: number;
}

interface WeaponUpgradePanelProps {
  weapon: Weapon;
  onUpgradeComplete: () => void;
}

export function WeaponUpgradePanel({ weapon, onUpgradeComplete }: WeaponUpgradePanelProps) {
  const { address } = useAccount();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentLevel = weapon.level;
  const canUpgrade = currentLevel < 10;
  const cost = canUpgrade ? UPGRADE_COSTS[currentLevel as keyof typeof UPGRADE_COSTS] : 0;
  const successRate = canUpgrade ? UPGRADE_SUCCESS_RATES[currentLevel as keyof typeof UPGRADE_SUCCESS_RATES] : 0;
  const canBreak = currentLevel >= WEAPON_BREAK_THRESHOLD;
  const breakChance = canBreak ? WEAPON_BREAK_CHANCE : 0;

  // Calculate power gain for next level
  const nextLevelPower = canUpgrade
    ? calculateUpgradePowerBonus(weapon.rarity as WeaponRarity, currentLevel + 1)
    : weapon.attack_power;
  const powerGain = nextLevelPower - weapon.attack_power;

  // Calculate success percentage from history
  const successPercentage =
    weapon.upgrade_attempts > 0
      ? Math.round((weapon.successful_upgrades / weapon.upgrade_attempts) * 100)
      : 0;

  const handleUpgrade = async () => {
    if (!address || !canUpgrade) return;

    setIsUpgrading(true);

    try {
      // Import required modules
      const { readContract, writeContract, waitForTransactionReceipt } = await import('wagmi/actions');
      const { config } = await import('@/lib/wagmi');
      const { WEAPON_NFT_CONTRACT } = await import('@/lib/weapon-contract');
      const { SHADOW_TOKEN_CONTRACT, SHADOW_TREASURY_ADDRESS, parseShadowAmount } = await import('@/lib/shadow-contract');
      
      // Step 1: Verify ownership onchain
      const owner = await readContract(config, {
        address: WEAPON_NFT_CONTRACT.address as `0x${string}`,
        abi: WEAPON_NFT_CONTRACT.abi,
        functionName: 'ownerOf',
        args: [BigInt(weapon.token_id)],
      });

      if (owner.toLowerCase() !== address.toLowerCase()) {
        toast.error('You no longer own this weapon onchain');
        setIsUpgrading(false);
        return;
      }

      // Step 2: Check $SHADOW balance on-chain
      const shadowBalance = await readContract(config, {
        address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
        abi: SHADOW_TOKEN_CONTRACT.abi,
        functionName: 'balanceOf',
        args: [address],
      });

      const requiredAmount = parseShadowAmount(cost);
      if (shadowBalance < requiredAmount) {
        toast.error(`Insufficient $SHADOW balance. Need ${cost} $SHADOW`);
        setIsUpgrading(false);
        return;
      }

      // Step 3: Check allowance
      toast.info('Checking $SHADOW allowance...', { duration: 1000 });
      const allowance = await readContract(config, {
        address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
        abi: SHADOW_TOKEN_CONTRACT.abi,
        functionName: 'allowance',
        args: [address, SHADOW_TREASURY_ADDRESS],
      });

      // Step 4: Approve if needed
      if (allowance < requiredAmount) {
        toast.info('Approving $SHADOW spending...', { duration: 2000 });
        const approveHash = await writeContract(config, {
          address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
          abi: SHADOW_TOKEN_CONTRACT.abi,
          functionName: 'approve',
          args: [SHADOW_TREASURY_ADDRESS, requiredAmount],
        });
        await waitForTransactionReceipt(config, { hash: approveHash });
        toast.success('$SHADOW approved!', { duration: 1000 });
      }

      // Step 5: Transfer $SHADOW to treasury
      toast.info('Sending $SHADOW payment...', { duration: 2000 });
      const paymentHash = await writeContract(config, {
        address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
        abi: SHADOW_TOKEN_CONTRACT.abi,
        functionName: 'transfer',
        args: [SHADOW_TREASURY_ADDRESS, requiredAmount],
      });

      toast.info('Processing upgrade...', { duration: 3000 });
      await waitForTransactionReceipt(config, { hash: paymentHash });

      // Step 6: Call upgrade API with payment proof
      const response = await fetch('/api/weapons/upgrade-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weaponTokenId: weapon.token_id,
          ownerAddress: address,
          paymentTxHash: paymentHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade weapon');
      }

      if (data.broken) {
        toast.error('Weapon Destroyed! 💔', {
          description: `Your ${weapon.weapon_type} was destroyed at level ${data.weapon.previousLevel}. The risk was too high...`,
          duration: 5000,
        });
      } else if (data.success) {
        toast.success('Upgrade Successful! 🎉', {
          description: `${weapon.weapon_type} upgraded to level ${data.weapon.newLevel}! Power increased by ${data.weapon.newAttackPower - data.weapon.previousAttackPower}.`,
          duration: 5000,
        });
      } else {
        toast.error('Upgrade Failed 😞', {
          description: `Your ${weapon.weapon_type} remains at level ${data.weapon.previousLevel}. ${cost} $SHADOW was consumed.`,
          duration: 4000,
        });
      }

      // Refresh weapon data
      onUpgradeComplete();
      setShowConfirm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upgrade weapon';
      toast.error(message);
      console.error('Upgrade error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!canUpgrade) {
    return (
      <Card className="border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Sparkles className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg">Maximum Level Reached!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This weapon has reached level 10 and cannot be upgraded further.
              </p>
            </div>
            <Badge className="bg-amber-500 text-white">MAX LEVEL</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          Weapon Upgrade
        </CardTitle>
        <CardDescription>
          Enhance your weapon's power with $SHADOW tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Level</span>
            <Badge variant="outline" className="text-lg font-bold">
              {currentLevel}/10
            </Badge>
          </div>
          <Progress value={currentLevel * 10} className="h-2" />
        </div>

        <Separator />

        {/* Upgrade Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-green-500" />
            Upgrade Preview
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Stats */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Current</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Level</span>
                  <span className="font-bold">{currentLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Power</span>
                  <span className="font-bold">{weapon.attack_power}</span>
                </div>
              </div>
            </div>

            {/* Next Level Stats */}
            <div className="space-y-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-500 font-medium">Next Level</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Level</span>
                  <span className="font-bold text-green-500">{currentLevel + 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Power</span>
                  <span className="font-bold text-green-500">
                    {nextLevelPower}{' '}
                    <span className="text-xs text-green-400">(+{powerGain})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Success Rate & Cost */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <Badge
              className="text-base font-bold"
              style={{
                backgroundColor: successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#ef4444',
                color: 'white',
              }}
            >
              {successRate}%
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium">Upgrade Cost</span>
            </div>
            <Badge variant="outline" className="text-base font-bold">
              {cost} $SHADOW
            </Badge>
          </div>
        </div>

        {/* Breaking Warning */}
        {canBreak && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong className="font-bold">High Risk!</strong> Level {currentLevel} weapons have a{' '}
              <strong>{breakChance}%</strong> chance to be destroyed if the upgrade fails. This
              weapon will be permanently lost!
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade History Stats */}
        {weapon.upgrade_attempts > 0 && (
          <div className="p-3 rounded-lg bg-muted/20 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Upgrade History</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-bold">{weapon.upgrade_attempts}</p>
              </div>
              <div>
                <p className="text-green-500">Success</p>
                <p className="font-bold text-green-500">{weapon.successful_upgrades}</p>
              </div>
              <div>
                <p className="text-red-500">Failed</p>
                <p className="font-bold text-red-500">{weapon.failed_upgrades}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Success Rate:</span>
              <Badge
                variant="outline"
                className={
                  successPercentage >= 70
                    ? 'border-green-500/30 text-green-500'
                    : successPercentage >= 50
                      ? 'border-yellow-500/30 text-yellow-500'
                      : 'border-red-500/30 text-red-500'
                }
              >
                {successPercentage}%
              </Badge>
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {!showConfirm ? (
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full h-12 text-base font-bold"
            disabled={isUpgrading}
            size="lg"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Upgrade to Level {currentLevel + 1}
          </Button>
        ) : (
          <div className="space-y-3">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertDescription className="text-sm text-center">
                Are you sure you want to upgrade this weapon?
                {canBreak && (
                  <strong className="block mt-1 text-red-500">
                    This weapon may be destroyed if the upgrade fails!
                  </strong>
                )}
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                disabled={isUpgrading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
