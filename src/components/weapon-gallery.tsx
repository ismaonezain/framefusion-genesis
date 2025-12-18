'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Sparkles } from 'lucide-react';
import { getWeaponClassName, getRarityName, getRarityColor, WeaponClass, WeaponRarity } from '@/lib/weapon-contract';

interface WeaponImage {
  weapon_class: number;
  rarity: number;
  weapon_name: string;
  image_url: string;
  ipfs_uri: string;
  metadata_url: string;
  metadata_ipfs_uri: string;
}

interface WeaponGalleryProps {
  weaponImages: WeaponImage[];
  isLoading: boolean;
  onSelectWeapon?: (weapon: WeaponImage) => void;
}

export function WeaponGallery({ weaponImages, isLoading, onSelectWeapon }: WeaponGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const filteredWeapons = useMemo(() => {
    return weaponImages.filter((weapon: WeaponImage) => {
      const className = getWeaponClassName(weapon.weapon_class);
      const matchesSearch = className.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           weapon.weapon_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = filterClass === 'all' || weapon.weapon_class.toString() === filterClass;
      const matchesRarity = filterRarity === 'all' || weapon.rarity.toString() === filterRarity;

      return matchesSearch && matchesClass && matchesRarity;
    });
  }, [weaponImages, searchQuery, filterClass, filterRarity]);

  const totalCount = weaponImages.length;
  const filteredCount = filteredWeapons.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Weapon Gallery</CardTitle>
          <CardDescription>
            Browse all {totalCount} weapons across 20 classes and 4 rarity tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by class or weapon name..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from({ length: 20 }, (_, i: number) => (
                  <SelectItem key={i} value={i.toString()}>
                    {getWeaponClassName(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="0">Common</SelectItem>
                <SelectItem value="1">Rare</SelectItem>
                <SelectItem value="2">Epic</SelectItem>
                <SelectItem value="3">Legendary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          {(searchQuery || filterClass !== 'all' || filterRarity !== 'all') && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredCount} of {totalCount} weapons</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterClass('all');
                  setFilterRarity('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weapon Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i: number) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : filteredWeapons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No weapons found matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWeapons.map((weapon: WeaponImage) => (
            <WeaponCard
              key={`${weapon.weapon_class}-${weapon.rarity}`}
              weapon={weapon}
              onSelect={onSelectWeapon}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WeaponCardProps {
  weapon: WeaponImage;
  onSelect?: (weapon: WeaponImage) => void;
}

function WeaponCard({ weapon, onSelect }: WeaponCardProps) {
  const className = getWeaponClassName(weapon.weapon_class);
  const rarityName = getRarityName(weapon.rarity);
  const rarityColor = getRarityColor(weapon.rarity);

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Rarity Indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: rarityColor }}
      />

      {/* Weapon Image */}
      <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted p-4 overflow-hidden">
        <img
          src={weapon.image_url}
          alt={weapon.weapon_name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Weapon Info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{weapon.weapon_name}</CardTitle>
            <CardDescription className="text-xs">{className}</CardDescription>
          </div>
          <Badge
            className="shrink-0"
            style={{
              backgroundColor: rarityColor,
              color: 'white',
            }}
          >
            {rarityName}
          </Badge>
        </div>
      </CardHeader>

      {onSelect && (
        <CardContent className="pt-0">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => onSelect(weapon)}
          >
            <Sparkles className="mr-2 h-3 w-3" />
            Select for Minting
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
