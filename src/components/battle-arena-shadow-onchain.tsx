'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, TrendingUp, TrendingDown, Minus, Coins, Zap, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BattleArenaShadowOnChainProps {
  fid: number;
  framefusionClass?: string;
}

export function BattleArenaShadowOnChain({ fid, framefusionClass }: BattleArenaShadowOnChainProps) {
  const { address } = useAccount();
  const [entryTier, setEntryTier] = useState<'free' | 'standard' | 'premium'>('free');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [shadowBalance, setShadowBalance] = useState<bigint>(BigInt(0));
  const [remainingBattles, setRemainingBattles] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [equippedWeapon, setEquippedWeapon] = useState<any>(null);

  useEffect(() => {
    if (address) {
      fetchShadowBalance();
    }
    checkDailyLimit();
    fetchEquippedWeapon();
  }, [fid, address]);

  const fetchShadowBalance = async () => {
    if (!address) return;
    try {
      const { readContract } = await import('wagmi/actions');
      const { config } = await import('@/lib/wagmi');
      const { SHADOW_TOKEN_CONTRACT } = await import('@/lib/shadow-contract');
      
      const balance = await readContract(config, {
        address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
        abi: SHADOW_TOKEN_CONTRACT.abi,
        functionName: 'balanceOf',
        args: [address],
      });

      setShadowBalance(balance as bigint);
    } catch (error) {
      console.error('Failed to fetch $SHADOW balance:', error);
    }
  };

  const fetchEquippedWeapon = async () => {
    try {
      const response = await fetch(`/api/weapons/list?fid=${fid}`);
      const data = await response.json();
      if (data.weapons && data.weapons.length > 0) {
        const equipped = data.weapons.find((w: any) => w.equipped_to !== null);
        setEquippedWeapon(equipped || null);
      }
    } catch (error) {
      console.error('Failed to fetch equipped weapon:', error);
    }
  };

  const checkDailyLimit = async () => {
    setRemainingBattles(3); // Default, fetch dari backend if needed
  };

  const handleBattle = async () => {
    if (!address || !framefusionClass) {
      toast.error('Please generate your FrameFusion NFT first!');
      return;
    }

    if (remainingBattles <= 0) {
      toast.error('Daily battle limit reached! Come back tomorrow.');
      return;
    }

    const amount = entryTier === 'free' ? 0 : parseFloat(entryAmount);

    if (entryTier !== 'free') {
      if (isNaN(amount)) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (entryTier === 'standard' && (amount < 5000 || amount > 500000)) {
        toast.error('Standard tier: 5,000 - 500,000 SHADOW');
        return;
      }

      if (entryTier === 'premium' && (amount < 500000 || amount > 5000000)) {
        toast.error('Premium tier: 500,000 - 5,000,000 SHADOW');
        return;
      }

      // Check balance
      const amountInWei = BigInt(Math.floor(amount * 1e18));
      if (shadowBalance < amountInWei) {
        toast.error('Insufficient $SHADOW balance!');
        return;
      }

      // Approve and transfer $SHADOW
      try {
        const { readContract, writeContract, waitForTransactionReceipt } = await import('wagmi/actions');
        const { config } = await import('@/lib/wagmi');
        const { SHADOW_TOKEN_CONTRACT, SHADOW_TREASURY_ADDRESS } = await import('@/lib/shadow-contract');

        setIsApproving(true);

        // Check allowance
        toast.info('Checking $SHADOW allowance...', { duration: 1000 });
        const allowance = await readContract(config, {
          address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
          abi: SHADOW_TOKEN_CONTRACT.abi,
          functionName: 'allowance',
          args: [address, SHADOW_TREASURY_ADDRESS],
        });

        // Approve if needed
        if ((allowance as bigint) < amountInWei) {
          toast.info('Approving $SHADOW spending...', { duration: 2000 });
          const approveHash = await writeContract(config, {
            address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
            abi: SHADOW_TOKEN_CONTRACT.abi,
            functionName: 'approve',
            args: [SHADOW_TREASURY_ADDRESS, amountInWei],
          });
          await waitForTransactionReceipt(config, { hash: approveHash });
          toast.success('$SHADOW approved!', { duration: 1000 });
        }

        setIsApproving(false);
        setIsLoading(true);

        // Transfer $SHADOW to treasury
        toast.info('Sending $SHADOW entry fee...', { duration: 2000 });
        const paymentHash = await writeContract(config, {
          address: SHADOW_TOKEN_CONTRACT.address as `0x${string}`,
          abi: SHADOW_TOKEN_CONTRACT.abi,
          functionName: 'transfer',
          args: [SHADOW_TREASURY_ADDRESS, amountInWei],
        });

        toast.info('Processing battle...', { duration: 3000 });
        await waitForTransactionReceipt(config, { hash: paymentHash });

        // Call battle API with payment proof
        const response = await fetch('/api/battle/enter-onchain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            framefusionFid: fid,
            framefusionClass,
            entryTier,
            entryAmount: amount,
            paymentTxHash: paymentHash,
            ownerAddress: address,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setBattleResult(data.battle);
          setRemainingBattles(data.remainingBattles);
          await fetchShadowBalance();
          await fetchEquippedWeapon();

          const reward = data.battle.rewards.framefusionReward;
          toast.success(`Victory! +${reward.toLocaleString()} SHADOW! 🎉⚔️`);
        } else {
          toast.error(data.error || 'Battle failed');
        }
      } catch (error) {
        console.error('Battle error:', error);
        toast.error('Failed to process battle');
      } finally {
        setIsApproving(false);
        setIsLoading(false);
      }
    } else {
      // Free battle
      setIsLoading(true);
      try {
        const response = await fetch('/api/battle/enter-onchain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            framefusionFid: fid,
            framefusionClass,
            entryTier: 'free',
            entryAmount: 0,
            paymentTxHash: null,
            ownerAddress: address,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setBattleResult(data.battle);
          setRemainingBattles(data.remainingBattles);
          await fetchShadowBalance();
          
          const reward = data.battle.rewards.framefusionReward;
          toast.success(`Victory! +${reward.toLocaleString()} SHADOW!`);
        } else {
          toast.error(data.error || 'Battle failed');
        }
      } catch (error) {
        console.error('Battle error:', error);
        toast.error('Failed to start battle');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getMatchupIcon = (matchup: string) => {
    switch (matchup) {
      case 'super_effective':
      case 'effective':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'not_effective':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatShadowBalance = (balance: bigint): string => {
    return (Number(balance) / 1e18).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">$SHADOW Balance (On-Chain)</p>
              <p className="text-3xl font-bold text-purple-400">{formatShadowBalance(shadowBalance)}</p>
            </div>
            <Coins className="h-12 w-12 text-purple-400 opacity-50" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {remainingBattles}/3 Battles Today
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border border-green-500/30">
              On-Chain Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Equipped Weapon */}
      {equippedWeapon && (
        <Card className="border border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <img
                src={equippedWeapon.image_url}
                alt={equippedWeapon.weapon_name}
                className="w-20 h-20 rounded-lg object-cover border-2 border-yellow-500/50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-yellow-500" />
                  <p className="font-bold text-lg">{equippedWeapon.weapon_name}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                    {equippedWeapon.rarity}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                    Lv.{equippedWeapon.level}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battle Entry */}
      <Card className="border border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-purple-400" />
            Battle Arena (On-Chain)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Entry Tier</Label>
            <Select value={entryTier} onValueChange={(value: any) => setEntryTier(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  Free (0 SHADOW, 100 reward, no raffle)
                </SelectItem>
                <SelectItem value="standard">
                  Standard (5K-500K SHADOW, 1 ticket)
                </SelectItem>
                <SelectItem value="premium">
                  Premium (500K-5M SHADOW, 5 tickets, 1.2x bonus)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entryTier !== 'free' && (
            <div>
              <Label>Entry Amount (SHADOW)</Label>
              <Input
                type="number"
                placeholder={entryTier === 'standard' ? '5,000 - 500,000' : '500,000 - 5,000,000'}
                value={entryAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryAmount(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handleBattle}
            disabled={isLoading || isApproving || remainingBattles <= 0 || !framefusionClass || !address}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving $SHADOW...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Battling...
              </>
            ) : (
              'Enter Battle'
            )}
          </Button>

          {!address && (
            <p className="text-sm text-yellow-500 text-center">
              ⚠️ Connect your wallet to battle on-chain!
            </p>
          )}

          {!framefusionClass && address && (
            <p className="text-sm text-yellow-500 text-center">
              ⚠️ Generate your FrameFusion NFT first to battle!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Battle Result */}
      {battleResult && (
        <Card className="border border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-400" />
              Battle Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={battleResult.monster.image}
                alt={battleResult.monster.name}
                className="w-24 h-24 rounded-lg object-cover border border-purple-500/30"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{battleResult.monster.name}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {battleResult.monster.element}
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {battleResult.monster.rarity}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
              <div>
                <p className="text-sm text-muted-foreground">Power Multiplier</p>
                <p className="text-xl font-bold text-purple-400">
                  {battleResult.rewards.powerMultiplier.toFixed(1)}x
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Element Matchup</p>
                <div className="flex items-center gap-2">
                  {getMatchupIcon(battleResult.rewards.elementMatchup)}
                  <p className="text-xl font-bold">
                    {battleResult.rewards.elementMultiplier.toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>

            {battleResult.rewards.weaponBonuses && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <p className="font-semibold text-yellow-400">Weapon Bonuses</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Multiplier</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {battleResult.rewards.weaponBonuses.totalWeaponMultiplier.toFixed(2)}x
                    </p>
                  </div>
                  {battleResult.rewards.weaponBonuses.classMatchBonus > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Class Match</p>
                      <p className="text-lg font-bold text-green-400">
                        +{(battleResult.rewards.weaponBonuses.classMatchBonus * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Your Reward (On-Chain)</p>
              <p className="text-3xl font-bold text-green-400">
                +{battleResult.rewards.framefusionReward.toLocaleString()} SHADOW
              </p>
            </div>

            {battleResult.rewards.elementMatchup === 'super_effective' && (
              <p className="text-center text-green-400 font-semibold">
                🎯 Super Effective! Massive multiplier!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
