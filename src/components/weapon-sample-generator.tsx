'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEAPON_TYPES_ARRAY, WEAPON_RARITIES, type WeaponClass, type WeaponRarity } from '@/lib/weapon-contract';
import { fluxproSubmit, fluxproPollStatus, fluxproFetchImages } from '@/fluxpro-api';
import { Loader2 } from 'lucide-react';

interface GeneratedWeapon {
  weaponClass: WeaponClass;
  rarity: WeaponRarity;
  imageUrl: string;
  prompt: string;
}

export function WeaponSampleGenerator() {
  const [selectedWeaponClass, setSelectedWeaponClass] = useState<WeaponClass>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedWeapons, setGeneratedWeapons] = useState<GeneratedWeapon[]>([]);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('');

  const handleGenerate = async (): Promise<void> => {
    setIsGenerating(true);
    setError('');
    setGeneratedWeapons([]);
    setProgress('Starting generation...');

    try {
      const weaponTypeName = WEAPON_TYPES_ARRAY[selectedWeaponClass];
      const results: GeneratedWeapon[] = [];

      // Generate 4 images (one for each rarity)
      for (let rarityIndex = 0; rarityIndex < WEAPON_RARITIES.length; rarityIndex++) {
        const rarity = WEAPON_RARITIES[rarityIndex];
        
        // Create rarity-specific prompt
        const rarityDescriptions: Record<WeaponRarity, string> = {
          [0]: 'simple design with subtle gray glow, basic craftsmanship',
          [1]: 'refined design with blue magical glow and energy particles, quality craftsmanship',
          [2]: 'ornate design with purple mystical aura and power wisps, masterwork quality',
          [3]: 'legendary design with golden amber divine light rays and ethereal energy, artifact quality',
        };

        const prompt = `Professional game asset: ${weaponTypeName}, ${rarityDescriptions[rarityIndex as WeaponRarity]}, floating in center, solid black background, high detail, fantasy RPG style, square 1:1 composition, front view, dramatic lighting`;

        setProgress(`Generating ${rarity} ${weaponTypeName}... (${rarityIndex + 1}/4)`);
        console.log(`[Weapon Generator] Generating ${rarity} ${weaponTypeName}...`);

        // Submit to Flux - directly from client like monster generator
        const requestId = await fluxproSubmit({
          prompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          safety_tolerance: '4',
          num_images: 1,
        });

        // Poll for completion
        setProgress(`Processing ${rarity} ${weaponTypeName}...`);
        await fluxproPollStatus(requestId);

        // Fetch images
        setProgress(`Fetching ${rarity} ${weaponTypeName}...`);
        const images = await fluxproFetchImages(requestId);

        if (images.length > 0) {
          results.push({
            weaponClass: selectedWeaponClass,
            rarity: rarityIndex as WeaponRarity,
            imageUrl: images[0].url,
            prompt,
          });
          console.log(`[Weapon Generator] ✅ ${rarity} ${weaponTypeName} generated!`);
        }
      }

      setGeneratedWeapons(results);
      setProgress('All weapons generated successfully!');
    } catch (err) {
      console.error('[Weapon Generator] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate weapons');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weapon Sample Generator</CardTitle>
          <CardDescription>
            Generate 4 weapon images (all rarities) for testing. Each generation takes ~2-3 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Weapon Type</label>
              <Select
                value={selectedWeaponClass.toString()}
                onValueChange={(value: string) => setSelectedWeaponClass(parseInt(value) as WeaponClass)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEAPON_TYPES_ARRAY.map((weaponType: string, index: number) => (
                    <SelectItem key={index} value={index.toString()}>
                      {weaponType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Sample'
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {progress && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">{progress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedWeapons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generatedWeapons.map((weapon: GeneratedWeapon, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {WEAPON_RARITIES[weapon.rarity]} {WEAPON_TYPES_ARRAY[weapon.weaponClass]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                    <img
                      src={weapon.imageUrl}
                      alt={`${WEAPON_RARITIES[weapon.rarity]} ${WEAPON_TYPES_ARRAY[weapon.weaponClass]}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Prompt:</strong> {weapon.prompt}
                    </p>
                    <a
                      href={weapon.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      View full size →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
