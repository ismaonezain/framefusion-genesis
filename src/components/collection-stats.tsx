'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Target } from 'lucide-react';

type Stats = {
  totalGenerated: number;
  totalMinted: number;
  maxSupply: number;
  availableToMint: number;
  remaining: number;
  percentage: number;
};

export function CollectionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/nft/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <Card className="bg-card border border-purple-500/20">
        <CardContent className="pt-6">
          <div className="h-20 bg-secondary animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-purple-500/20 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Trophy className="h-6 w-6 text-purple-400" />
          </div>
          <span className="font-black text-purple-400">
            FrameFusion Genesis Stats
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400">{stats.totalGenerated}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">Generated</div>
          </div>
          <div className="text-center bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400">{stats.totalMinted}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">Minted</div>
          </div>
          <div className="text-center bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Target className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400">{stats.availableToMint}</div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">Available</div>
          </div>
        </div>

        <div className="space-y-2 bg-secondary rounded-lg p-4 border border-purple-500/10">
          <div className="flex justify-between text-sm">
            <span className="text-foreground font-semibold">Minting Progress ({stats.totalMinted}/{stats.maxSupply})</span>
            <span className="font-black text-purple-400 text-base">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-4 bg-muted" />
        </div>

        <div className="text-center py-2 px-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          {stats.availableToMint === 0 ? (
            <span className="text-purple-400 font-black text-sm">🔥 ALL MINTED! No more slots! 🎉</span>
          ) : stats.availableToMint < 100 ? (
            <span className="text-purple-400 font-bold text-sm">⚡ Only {stats.availableToMint} mint slots left! Hurry!</span>
          ) : (
            <span className="text-foreground font-semibold text-sm">✨ Mint yours before slots run out!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
