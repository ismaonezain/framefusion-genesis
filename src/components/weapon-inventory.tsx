'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Swords, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { getRarityColor, UPGRADE_COSTS, UPGRADE_SUCCESS_RATES } from '@/lib/weapon-contract';

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
  canUpgrade: boolean;
  upgrade_attempts: number;
  successful_upgrades: number;
  failed_upgrades: number;
}

export function WeaponInventory() {
  const { address, status } = useAccount();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingWeaponId, setUpgradingWeaponId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'connected' && address) {
      fetchWeapons();
    }
  }, [status, address]);

  const fetchWeapons = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/weapons/list?ownerAddress=${address}&includeBroken=false&includeEquipped=true`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weapons');
      }

      setWeapons(data.weapons || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch weapons';
      toast.error(message);
      console.error('Fetch weapons error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (weaponTokenId: number) => {
    if (!address) return;

    setUpgradingWeaponId(weaponTokenId);

    try {
      const response = await fetch('/api/weapons/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weaponTokenId,
          ownerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade weapon');
      }

      if (data.broken) {
        toast.error('Weapon broke during upgrade! 💔', {
          description: `Your weapon was destroyed at level ${data.weapon.previousLevel}.`,
        });
      } else if (data.success) {
        toast.success(`Upgrade successful! 🎉`, {
          description: `Weapon upgraded to level ${data.weapon.newLevel} (+${data.weapon.newAttackPower - data.weapon.previousAttackPower} power)`,
        });
      } else {
        toast.error('Upgrade failed 😞', {
          description: `Your weapon remains at level ${data.weapon.previousLevel}. Cost: ${data.cost} $SHADOW`,
        });
      }

      // Refresh weapons list
      await fetchWeapons();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upgrade weapon';
      toast.error(message);
      console.error('Upgrade error:', error);
    } finally {
      setUpgradingWeaponId(null);
    }
  };

  if (status !== 'connected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6" />
            Weapon Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to view your weapons
          </p>
        </CardContent>
      </Card>
    );
  }

  const equippedWeapons = weapons.filter((w) => w.isEquipped);
  const unequippedWeapons = weapons.filter((w) => !w.isEquipped);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-6 w-6" />
          Weapon Inventory
        </CardTitle>
        <CardDescription>
          Total weapons: {weapons.length} ({equippedWeapons.length} equipped, {unequippedWeapons.length} available)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : weapons.length === 0 ? (
          <div className="text-center py-12">
            <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No weapons found. Mint your first weapon to get started!</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({weapons.length})</TabsTrigger>
              <TabsTrigger value="equipped">Equipped ({equippedWeapons.length})</TabsTrigger>
              <TabsTrigger value="available">Available ({unequippedWeapons.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              <WeaponList
                weapons={weapons}
                onUpgrade={handleUpgrade}
                upgradingWeaponId={upgradingWeaponId}
              />
            </TabsContent>

            <TabsContent value="equipped" className="space-y-4 mt-4">
              <WeaponList
                weapons={equippedWeapons}
                onUpgrade={handleUpgrade}
                upgradingWeaponId={upgradingWeaponId}
              />
            </TabsContent>

            <TabsContent value="available" className="space-y-4 mt-4">
              <WeaponList
                weapons={unequippedWeapons}
                onUpgrade={handleUpgrade}
                upgradingWeaponId={upgradingWeaponId}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

interface WeaponListProps {
  weapons: Weapon[];
  onUpgrade: (tokenId: number) => void;
  upgradingWeaponId: number | null;
}

function WeaponList({ weapons, onUpgrade, upgradingWeaponId }: WeaponListProps) {
  if (weapons.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No weapons in this category
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {weapons.map((weapon) => (
        <WeaponCard
          key={weapon.id}
          weapon={weapon}
          onUpgrade={onUpgrade}
          isUpgrading={upgradingWeaponId === weapon.token_id}
        />
      ))}
    </div>
  );
}

interface WeaponCardProps {
  weapon: Weapon;
  onUpgrade: (tokenId: number) => void;
  isUpgrading: boolean;
}

function WeaponCard({ weapon, onUpgrade, isUpgrading }: WeaponCardProps) {
  const upgradeCost = UPGRADE_COSTS[weapon.level as keyof typeof UPGRADE_COSTS];
  const successRate = UPGRADE_SUCCESS_RATES[weapon.level as keyof typeof UPGRADE_SUCCESS_RATES];
  const canBreak = weapon.level >= 6;

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: weapon.rarityColor }}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{weapon.weapon_type}</CardTitle>
            <CardDescription className="text-xs">
              #{weapon.token_id} • {weapon.className}
            </CardDescription>
          </div>
          <Badge
            style={{
              backgroundColor: weapon.rarityColor,
              color: 'white',
            }}
          >
            {weapon.rarityName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Level</p>
            <p className="font-bold">{weapon.level}/10</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Attack Power</p>
            <p className="font-bold">{weapon.attack_power}</p>
          </div>
        </div>

        {weapon.isEquipped && (
          <Badge variant="outline" className="w-full justify-center">
            Equipped to #{weapon.equipped_to}
          </Badge>
        )}

        {weapon.canUpgrade && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Upgrade Cost: {upgradeCost} $SHADOW</span>
              <span>Success: {successRate}%</span>
            </div>
            {canBreak && (
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <AlertCircle className="h-3 w-3" />
                <span>Risk of breaking!</span>
              </div>
            )}
            <a href={`/upgrade?id=${weapon.token_id}`} className="block w-full">
              <Button
                className="w-full"
                size="sm"
              >
                <TrendingUp className="mr-2 h-3 w-3" />
                Upgrade
              </Button>
            </a>
          </div>
        )}

        {weapon.level >= 10 && (
          <Badge variant="secondary" className="w-full justify-center">
            MAX LEVEL
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
