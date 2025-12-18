'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { WeaponClass, WeaponRarity, getRarityName, getWeaponClassName, getRarityColor, WEAPON_MINT_SHADOW_COSTS } from '@/lib/weapon-contract';

export function WeaponMintButton() {
  const { address, status } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<WeaponClass | undefined>();
  const [selectedRarity, setSelectedRarity] = useState<WeaponRarity | undefined>();
  const [fid, setFid] = useState<number | null>(null);
  const [shadowBalance, setShadowBalance] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFid() {
      try {
        await sdk.actions.ready();
        const context = await sdk.context;
        if (!cancelled && context?.user) {
          setFid(context.user.fid || null);
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

  useEffect(() => {
    if (fid) {
      loadShadowBalance();
    }
  }, [fid]);

  const loadShadowBalance = async () => {
    if (!fid) return;

    try {
      const response = await fetch(`/api/shadow/balance?fid=${fid}`);
      const data = await response.json();
      
      if (data.success) {
        setShadowBalance(data.balance || 0);
      }
    } catch (err) {
      console.error('[Weapon Mint] Failed to load $SHADOW balance:', err);
    }
  };

  const handleMint = async () => {
    if (status !== 'connected' || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!fid) {
      toast.error('Profile data not found');
      return;
    }

    // Determine rarity for cost calculation
    const rarity = selectedRarity !== undefined ? selectedRarity : WeaponRarity.Common;
    const shadowCost = WEAPON_MINT_SHADOW_COSTS[rarity];

    // Check $SHADOW balance
    if (shadowBalance < shadowCost) {
      toast.error(`Insufficient $SHADOW! You need ${shadowCost} $SHADOW but have ${shadowBalance}.`);
      return;
    }

    setIsMinting(true);

    try {
      // Deduct $SHADOW first
      const deductResponse = await fetch('/api/shadow/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          amount: shadowCost,
          reason: 'weapon_mint',
          detail: `Minted ${getRarityName(rarity)} weapon`,
        }),
      });

      if (!deductResponse.ok) {
        const deductError = await deductResponse.json();
        throw new Error(deductError.error || 'Failed to deduct $SHADOW');
      }

      // Update balance locally
      setShadowBalance(shadowBalance - shadowCost);

      // Call mint API
      const response = await fetch('/api/weapons/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          weaponClass: selectedClass,
          rarity: selectedRarity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint weapon');
      }

      toast.success(
        `Successfully minted ${data.weapon.weaponType}!`,
        {
          description: `${getRarityName(data.weapon.rarity)} ${getWeaponClassName(data.weapon.weaponClass)} weapon`,
        }
      );

      // Reset selections for next mint
      setSelectedClass(undefined);
      setSelectedRarity(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mint weapon';
      toast.error(message);
      console.error('Mint error:', error);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-6 w-6" />
          Mint Weapon NFT
        </CardTitle>
        <CardDescription>
          Forge a new weapon for your FrameFusion. Leave options blank for random!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Weapon Class (Optional)</label>
          <Select
            value={selectedClass?.toString()}
            onValueChange={(value: string) => setSelectedClass(parseInt(value) as WeaponClass)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Random Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WeaponClass.Swordmaster.toString()}>⚔️ Swordmaster</SelectItem>
              <SelectItem value={WeaponClass.ShadowAssassin.toString()}>🗡️ Shadow Assassin</SelectItem>
              <SelectItem value={WeaponClass.HolyKnight.toString()}>🛡️ Holy Knight</SelectItem>
              <SelectItem value={WeaponClass.BattleMage.toString()}>🔮 Battle Mage</SelectItem>
              <SelectItem value={WeaponClass.ArcherRanger.toString()}>🏹 Archer Ranger</SelectItem>
              <SelectItem value={WeaponClass.TechHacker.toString()}>💻 Tech Hacker</SelectItem>
              <SelectItem value={WeaponClass.StreetFighter.toString()}>👊 Street Fighter</SelectItem>
              <SelectItem value={WeaponClass.MusicianBard.toString()}>🎸 Musician Bard</SelectItem>
              <SelectItem value={WeaponClass.ChefArtisan.toString()}>🔪 Chef Artisan</SelectItem>
              <SelectItem value={WeaponClass.PhotographerScout.toString()}>📷 Photographer Scout</SelectItem>
              <SelectItem value={WeaponClass.Gunslinger.toString()}>🔫 Gunslinger</SelectItem>
              <SelectItem value={WeaponClass.MedicHealer.toString()}>⚕️ Medic Healer</SelectItem>
              <SelectItem value={WeaponClass.EngineerBuilder.toString()}>🔧 Engineer Builder</SelectItem>
              <SelectItem value={WeaponClass.DetectiveInvestigator.toString()}>🔍 Detective Investigator</SelectItem>
              <SelectItem value={WeaponClass.AthleteChampion.toString()}>🏆 Athlete Champion</SelectItem>
              <SelectItem value={WeaponClass.BeastTamer.toString()}>🐺 Beast Tamer</SelectItem>
              <SelectItem value={WeaponClass.AlchemistSage.toString()}>⚗️ Alchemist Sage</SelectItem>
              <SelectItem value={WeaponClass.SamuraiDuelist.toString()}>🗾 Samurai Duelist</SelectItem>
              <SelectItem value={WeaponClass.NinjaOperative.toString()}>🥷 Ninja Operative</SelectItem>
              <SelectItem value={WeaponClass.DragonKnight.toString()}>🐉 Dragon Knight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rarity (Optional)</label>
          <Select
            value={selectedRarity?.toString()}
            onValueChange={(value: string) => setSelectedRarity(parseInt(value) as WeaponRarity)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Random Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WeaponRarity.Common.toString()}>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getRarityColor(WeaponRarity.Common) }}></span>
                  Common (60%)
                </span>
              </SelectItem>
              <SelectItem value={WeaponRarity.Rare.toString()}>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getRarityColor(WeaponRarity.Rare) }}></span>
                  Rare (25%)
                </span>
              </SelectItem>
              <SelectItem value={WeaponRarity.Epic.toString()}>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getRarityColor(WeaponRarity.Epic) }}></span>
                  Epic (10%)
                </span>
              </SelectItem>
              <SelectItem value={WeaponRarity.Legendary.toString()}>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getRarityColor(WeaponRarity.Legendary) }}></span>
                  Legendary (5%)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleMint}
            disabled={isMinting || status !== 'connected'}
            className="w-full"
            size="lg"
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Forging Weapon...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Mint Weapon
              </>
            )}
          </Button>
        </div>

        {status !== 'connected' && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to mint weapons
          </p>
        )}
      </CardContent>
    </Card>
  );
}
