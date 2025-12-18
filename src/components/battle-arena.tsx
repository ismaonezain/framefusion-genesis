'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, TrendingUp, TrendingDown, Minus, Coins, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

interface BattleArenaProps {
  fid: number;
  framefusionClass?: string;
}

export function BattleArena({ fid, framefusionClass }: BattleArenaProps) {
  const [entryTier, setEntryTier] = useState<'free' | 'standard' | 'premium'>('free');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [remainingBattles, setRemainingBattles] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [equippedWeapon, setEquippedWeapon] = useState<any>(null);

  useEffect(() => {
    fetchBalance();
    checkDailyLimit();
    fetchEquippedWeapon();
  }, [fid]);

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

  const fetchBalance = async () => {
    try {
      const response = await fetch(`/api/shadow/balance?fid=${fid}`);
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const checkDailyLimit = async () => {
    // This would check user_daily_battles table
    // For now, showing 3 as default
    setRemainingBattles(3);
  };

  const handleBattle = async () => {
    if (!framefusionClass) {
      toast.error('Please generate your FrameFusion NFT first!');
      return;
    }

    if (remainingBattles <= 0) {
      toast.error('Daily battle limit reached! Come back tomorrow.');
      return;
    }

    if (entryTier !== 'free') {
      const amount = parseFloat(entryAmount);
      
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

      if (amount > balance) {
        toast.error('Insufficient SHADOW balance!');
        return;
      }
    }

    setIsLoading(true);
    setBattleResult(null);

    try {
      const response = await fetch('/api/battle/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framefusionFid: fid,
          framefusionClass,
          entryTier,
          entryAmount: entryTier === 'free' ? 0 : parseFloat(entryAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBattleResult(data.battle);
        setRemainingBattles(data.remainingBattles);
        await fetchBalance();
        await fetchEquippedWeapon();
        
        const reward = data.battle.rewards.framefusionReward;
        const multiplier = data.battle.rewards.powerMultiplier * data.battle.rewards.elementMultiplier;
        const weaponBonus = data.battle.rewards.weaponBonuses?.totalWeaponMultiplier || 1.0;
        
        if (multiplier * weaponBonus > 2.0) {
          toast.success(`Epic Victory! +${reward.toLocaleString()} SHADOW! 🎉⚔️`);
        } else if (multiplier > 1.5) {
          toast.success(`Victory! +${reward.toLocaleString()} SHADOW! 🎉`);
        } else {
          toast.warning(`Battle complete. +${reward.toLocaleString()} SHADOW`);
        }
      } else {
        toast.error(data.error || 'Battle failed');
      }
    } catch (error) {
      console.error('Battle error:', error);
      toast.error('Failed to start battle');
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">SHADOW Balance</p>
              <p className="text-3xl font-bold text-purple-400">{balance.toLocaleString()}</p>
            </div>
            <Coins className="h-12 w-12 text-purple-400 opacity-50" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {remainingBattles}/3 Battles Today
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Equipped Weapon Display */}
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
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {equippedWeapon.weapon_class}
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {equippedWeapon.rarity}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Lv.{equippedWeapon.level}
                  </Badge>
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                    ⚡ {equippedWeapon.attack_power} ATK
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Weapon Equipped</p>
                <p className="text-sm text-green-400 font-semibold">+Battle Bonuses Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!equippedWeapon && (
        <Card className="border border-gray-500/20 bg-gray-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <Swords className="h-12 w-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No weapon equipped</p>
              <p className="text-xs text-gray-500 mt-1">Visit Weapon Forge to mint and equip weapons!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battle Entry */}
      <Card className="border border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-purple-400" />
            Battle Arena
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
            disabled={isLoading || remainingBattles <= 0 || !framefusionClass}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? 'Battling...' : 'Enter Battle'}
          </Button>

          {!framefusionClass && (
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
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                    ⚡ {battleResult.monster.power}
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

            {/* Weapon Bonuses */}
            {battleResult.rewards.weaponBonuses && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <p className="font-semibold text-yellow-400">Weapon Bonuses</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Rarity Bonus</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {battleResult.rewards.weaponBonuses.rarityMultiplier.toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Level Bonus</p>
                    <p className="text-lg font-bold text-blue-400">
                      {battleResult.rewards.weaponBonuses.levelMultiplier.toFixed(2)}x
                    </p>
                  </div>
                  {battleResult.rewards.weaponBonuses.classMatchBonus > 0 && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Class Match Bonus</p>
                          <p className="text-lg font-bold text-green-400">
                            +{(battleResult.rewards.weaponBonuses.classMatchBonus * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 pt-2 border-t border-yellow-500/20">
                    <p className="text-xs text-muted-foreground">Total Weapon Multiplier</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {battleResult.rewards.weaponBonuses.totalWeaponMultiplier.toFixed(2)}x
                    </p>
                  </div>
                  {battleResult.rewards.weaponBonuses.attackPowerBonus > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Attack Power Bonus</p>
                      <p className="text-lg font-bold text-red-400">
                        +{battleResult.rewards.weaponBonuses.attackPowerBonus.toFixed(0)} SHADOW
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Equipped Weapon Display in Battle Result */}
            {battleResult.equippedWeapon && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={battleResult.equippedWeapon.imageUrl}
                    alt={battleResult.equippedWeapon.name}
                    className="w-16 h-16 rounded-lg object-cover border border-purple-500/30"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{battleResult.equippedWeapon.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                        {battleResult.equippedWeapon.rarity}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                        Lv.{battleResult.equippedWeapon.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Your Reward</p>
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
