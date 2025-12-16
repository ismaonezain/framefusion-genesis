'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Trophy, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface StakingDashboardProps {
  fid: number;
  monsters: any[];
  onRefresh: () => void;
}

export function StakingDashboard({ fid, monsters, onRefresh }: StakingDashboardProps) {
  const [stakedMonsters, setStakedMonsters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStakedMonsters();
  }, [fid]);

  const fetchStakedMonsters = async () => {
    try {
      const response = await fetch(`/api/monsters/staked?fid=${fid}`);
      const data = await response.json();
      if (data.success) {
        setStakedMonsters(data.stakedMonsters);
      }
    } catch (error) {
      console.error('Failed to fetch staked monsters:', error);
    }
  };

  const handleStake = async (monsterId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monsters/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monsterId,
          ownerFid: fid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Monster staked! Earning starts now.');
        await fetchStakedMonsters();
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to stake monster');
      }
    } catch (error) {
      console.error('Stake error:', error);
      toast.error('Failed to stake monster');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (monsterId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monsters/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monsterId,
          ownerFid: fid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Unstaked! Earned ${data.totalEarned.toLocaleString()} SHADOW total.`);
        await fetchStakedMonsters();
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to unstake monster');
      }
    } catch (error) {
      console.error('Unstake error:', error);
      toast.error('Failed to unstake monster');
    } finally {
      setIsLoading(false);
    }
  };

  const unstakedMonsters = monsters.filter(
    (m: any) => !stakedMonsters.some((s: any) => s.monster_id === m.id)
  );

  return (
    <div className="space-y-6">
      {/* Staking Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-500/10 border border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Staked Monsters</p>
              <p className="text-3xl font-bold text-green-400">{stakedMonsters.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-3xl font-bold text-purple-400">
                {stakedMonsters.reduce((sum: number, s: any) => sum + (s.total_earned || 0), 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staked Monsters */}
      {stakedMonsters.length > 0 && (
        <Card className="border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-400" />
              Staked Monsters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stakedMonsters.map((staked: any) => (
                <div
                  key={staked.id}
                  className="flex items-center gap-4 p-4 bg-card border border-green-500/20 rounded-lg"
                >
                  <img
                    src={staked.monsters.image_url}
                    alt={staked.monsters.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold">{staked.monsters.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {staked.monsters.element}
                      </Badge>
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                        {staked.total_battles}/{staked.max_battles} Battles
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Earned: {staked.total_earned.toLocaleString()} SHADOW</span>
                      {!staked.canUnstake && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Clock className="h-3 w-3" />
                          {staked.remainingLockHours}h lock
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnstake(staked.monster_id)}
                    disabled={isLoading || !staked.canUnstake}
                    className="border-green-500/30 hover:bg-green-500/20"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    {staked.canUnstake ? 'Unstake' : 'Locked'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available to Stake */}
      {unstakedMonsters.length > 0 && (
        <Card className="border border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-purple-400" />
              Available to Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unstakedMonsters.map((monster: any) => (
                <div
                  key={monster.id}
                  className="flex items-center gap-3 p-3 bg-card border border-purple-500/20 rounded-lg"
                >
                  <img
                    src={monster.image_url}
                    alt={monster.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{monster.name}</h3>
                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs mt-1">
                      {monster.element}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStake(monster.id)}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Stake
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {monsters.length === 0 && (
        <Card className="border border-purple-500/20">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              No monsters yet. Generate some monsters to start staking!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
