'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Monster {
  id: string;
  name: string;
  monster_type: string;
  image_url: string;
  rarity: string;
  element: string;
  power_level: number;
  token_id: string;
}

interface MonsterDisplayProps {
  monsters: Monster[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const FRAMESHADOWS_CONTRACT_ADDRESS = '0xC53B19ea5EE1fa5dFCe12CdAD71813bee27f4B31';

export function MonsterDisplay({ monsters }: MonsterDisplayProps) {
  const rarityColors: Record<string, string> = {
    'Common': 'bg-gray-500',
    'Rare': 'bg-blue-500',
    'Epic': 'bg-purple-600',
    'Legendary': 'bg-yellow-500'
  };

  // Use image_url directly from blockchain data (no conversion)
  const getMonsterImageUrl = (url: string): string => {
    console.log('[Monster Display] Using image URL directly from blockchain:', url);
    return url;
  };

  const openOnOpenSea = (tokenId: string): void => {
    const openSeaUrl = `https://opensea.io/assets/base/${FRAMESHADOWS_CONTRACT_ADDRESS}/${tokenId}`;
    window.open(openSeaUrl, '_blank', 'noopener,noreferrer');
  };

  if (monsters.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-red-950/30 to-purple-950/30 backdrop-blur-sm border-red-500/20">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No monsters yet. Start minting to build your collection!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-red-950/30 to-purple-950/30 backdrop-blur-sm border-red-500/20">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Your Monsters ({monsters.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {monsters.map((monster) => (
          <Card key={monster.id} className="bg-gradient-to-br from-black/40 to-red-950/20 border-red-500/20 hover:border-red-500/50 transition-all overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={getMonsterImageUrl(monster.image_url)}
                    alt={monster.name}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-red-500/30 shadow-lg shadow-red-500/20"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="text-lg font-bold text-white break-words">{monster.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{monster.monster_type}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${rarityColors[monster.rarity] || 'bg-gray-500'} border border-white/30 shadow-md`}>
                      {monster.rarity}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 border border-cyan-400/50 shadow-md">
                      {monster.element}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 border border-purple-400/50 shadow-md">
                      ⚡ {monster.power_level}
                    </span>
                  </div>
                  <Button
                    onClick={() => openOnOpenSea(monster.token_id)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 text-xs"
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View on OpenSea
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
