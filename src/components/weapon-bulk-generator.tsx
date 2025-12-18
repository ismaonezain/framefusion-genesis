'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  fluxproSubmit,
  fluxproPollStatus,
  fluxproFetchImages,
} from '@/fluxpro-api';
import {
  pinataUploadImageWithMetadata,
  type PinataImageWithMetadataResult,
} from '@/pinata-media-api';
import { compressImageFromUrl } from '@/lib/image-compression';
import {
  WEAPON_TYPES_ARRAY,
  RARITY_NAMES,
  type WeaponClass,
  type WeaponRarity,
  getWeaponNameByRarity,
  getRarityName,
} from '@/lib/weapon-contract';
import { getWeaponPrompt } from '@/lib/weapon-prompts';

interface GenerationProgress {
  weaponClass: WeaponClass;
  rarity: WeaponRarity;
  weaponName: string;
  rarityName: string;
  status: 'pending' | 'generating' | 'compressing' | 'uploading' | 'storing' | 'completed' | 'failed';
  error?: string;
  imageUrl?: string;
  ipfsUri?: string;
  metadataUrl?: string;
}

const RARITIES: WeaponRarity[] = [0, 1, 2, 3]; // Common, Rare, Epic, Legendary

function getRarityGlow(rarity: WeaponRarity): string {
  switch (rarity) {
    case 0: return 'subtle gray shimmer, basic quality';
    case 1: return 'brilliant blue magical aura with sparkles, refined quality';
    case 2: return 'intense purple mystical energy with power wisps, epic quality';
    case 3: return 'radiant golden-amber divine light with celestial particles, legendary artifact quality';
    default: return 'gray glow';
  }
}

function getRarityBadgeColor(rarity: number): string {
  switch (rarity) {
    case 0: return 'bg-gray-500 text-white'; // Common
    case 1: return 'bg-blue-500 text-white'; // Rare
    case 2: return 'bg-purple-500 text-white'; // Epic
    case 3: return 'bg-amber-500 text-white'; // Legendary
    default: return 'bg-gray-500 text-white';
  }
}

export function WeaponBulkGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState<{
    total: number;
    completed: number;
    failed: number;
  } | null>(null);
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [isCheckingMissing, setIsCheckingMissing] = useState(false);
  const [existingWeapons, setExistingWeapons] = useState<Array<{
    weapon_class: number;
    rarity: number;
    weapon_name: string;
    image_url: string;
  }>>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const totalWeapons = WEAPON_TYPES_ARRAY.length * RARITIES.length; // 20 × 4 = 80

  const loadExistingWeapons = async () => {
    setIsLoadingExisting(true);
    try {
      const response = await fetch('/api/weapons/list-existing');
      if (!response.ok) {
        throw new Error('Failed to load existing weapons');
      }
      const result = await response.json();
      setExistingWeapons(result.weapons || []);
    } catch (error) {
      console.error('Error loading existing weapons:', error);
      setExistingWeapons([]);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const checkMissingWeapons = async (): Promise<Array<{ weaponClass: number; rarity: number }> | null> => {
    setIsCheckingMissing(true);
    try {
      const response = await fetch('/api/weapons/check-missing');
      if (!response.ok) {
        throw new Error('Failed to check missing weapons');
      }
      const result = await response.json();
      setMissingCount(result.missing);
      return result.missingWeapons;
    } catch (error) {
      console.error('Error checking missing weapons:', error);
      return null;
    } finally {
      setIsCheckingMissing(false);
    }
  };

  // Auto-load existing weapons on mount
  useEffect(() => {
    loadExistingWeapons();
  }, []);

  const generateAllWeapons = async () => {
    setIsGenerating(true);
    setSummary(null);
    setCurrentIndex(0);

    // Initialize progress array
    const initialProgress: GenerationProgress[] = [];
    for (let classIdx = 0; classIdx < WEAPON_TYPES_ARRAY.length; classIdx++) {
      for (const rarity of RARITIES) {
        initialProgress.push({
          weaponClass: classIdx as WeaponClass,
          rarity,
          weaponName: getWeaponNameByRarity(classIdx as WeaponClass, rarity),
          rarityName: getRarityName(rarity),
          status: 'pending',
        });
      }
    }
    setProgress(initialProgress);

    await processWeapons(initialProgress);
  };

  const generateMissingWeapons = async () => {
    // First check which weapons are missing
    const missingWeapons = await checkMissingWeapons();
    if (!missingWeapons || missingWeapons.length === 0) {
      alert('No missing weapons! All 80 weapons are already in the database.');
      return;
    }

    setIsGenerating(true);
    setSummary(null);
    setCurrentIndex(0);

    // Initialize progress array for missing weapons only
    const initialProgress: GenerationProgress[] = missingWeapons.map((weapon) => ({
      weaponClass: weapon.weaponClass as WeaponClass,
      rarity: weapon.rarity as WeaponRarity,
      weaponName: getWeaponNameByRarity(weapon.weaponClass as WeaponClass, weapon.rarity as WeaponRarity),
      rarityName: getRarityName(weapon.rarity as WeaponRarity),
      status: 'pending',
    }));
    setProgress(initialProgress);

    await processWeapons(initialProgress);
  };

  const processWeapons = async (weaponsToProcess: GenerationProgress[]) => {

    let completedCount = 0;
    let failedCount = 0;

    // Generate each weapon sequentially
    for (let i = 0; i < weaponsToProcess.length; i++) {
      const item = weaponsToProcess[i];
      setCurrentIndex(i);

      try {
        // Update status: generating
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'generating' };
          return updated;
        });

        // Generate image with Flux using anime style
        const prompt = getWeaponPrompt(
          item.weaponClass,
          item.weaponName,
          getRarityGlow(item.rarity),
          item.rarityName
        );

        const requestId = await fluxproSubmit({
          prompt,
          aspect_ratio: '1:1',
          num_images: 1,
          output_format: 'png',
          safety_tolerance: '3',
        });

        await fluxproPollStatus(requestId);
        const images = await fluxproFetchImages(requestId);

        if (!images || images.length === 0) {
          throw new Error('No image generated');
        }

        const imageUrl = images[0].url;

        // Update status: compressing
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'compressing' };
          return updated;
        });

        // Compress image to 900px
        const compressedBlob = await compressImageFromUrl(imageUrl, {
          maxWidth: 900,
          quality: 0.9,
          format: 'image/png',
        });

        // Update status: uploading
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading' };
          return updated;
        });

        // Upload to Pinata with metadata
        const filename = `${item.weaponName.toLowerCase().replace(/\s+/g, '-')}-${item.rarityName.toLowerCase()}.png`;
        const pinataResult: PinataImageWithMetadataResult = await pinataUploadImageWithMetadata({
          image: compressedBlob,
          filename,
          metadata: {
            name: `${item.rarityName} ${item.weaponName}`,
            description: `A ${item.rarityName.toLowerCase()} weapon for FrameFusion Genesis NFT game`,
            attributes: [
              { trait_type: 'Weapon Type', value: item.weaponName },
              { trait_type: 'Rarity', value: item.rarityName },
              { trait_type: 'Class', value: String(item.weaponClass) },
            ],
          },
        });

        // Update status: storing
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'storing' };
          return updated;
        });

        // Store in database
        const storeResponse = await fetch('/api/weapons/store-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weaponClass: item.weaponClass,
            rarity: item.rarity,
            weaponName: item.weaponName,
            imageUrl: pinataResult.image.pin.gatewayUrl,
            ipfsUri: pinataResult.image.pin.ipfsUri,
            metadataUrl: pinataResult.metadata.pin.gatewayUrl,
            metadataIpfsUri: pinataResult.metadata.pin.ipfsUri,
            imageCid: pinataResult.image.pin.cid,
            metadataCid: pinataResult.metadata.pin.cid,
          }),
        });

        if (!storeResponse.ok) {
          throw new Error('Failed to store in database');
        }

        // Update status: completed
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'completed',
            imageUrl: pinataResult.image.pin.gatewayUrl,
            ipfsUri: pinataResult.image.pin.ipfsUri,
            metadataUrl: pinataResult.metadata.pin.gatewayUrl,
          };
          return updated;
        });

        completedCount++;
      } catch (error) {
        console.error(`Failed to generate weapon ${i}:`, error);
        failedCount++;

        // Update status: failed
        setProgress((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          return updated;
        });
      }

      // Small delay between generations to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setSummary({
      total: weaponsToProcess.length,
      completed: completedCount,
      failed: failedCount,
    });
    setIsGenerating(false);
  };

  const progressPercentage = totalWeapons > 0 ? (currentIndex / totalWeapons) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Weapon Image Generator</CardTitle>
          <CardDescription>
            Generate all 80 weapon images (20 types × 4 rarities), compress to 900px, upload to Pinata IPFS, and store in database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Total weapons to generate: <strong>{totalWeapons}</strong>
              </p>
              {isGenerating && (
                <p className="text-sm text-muted-foreground">
                  Currently generating: <strong>{currentIndex + 1}</strong> / {progress.length}
                </p>
              )}
              {missingCount !== null && !isGenerating && (
                <p className="text-sm text-blue-600 font-medium">
                  Missing weapons found: <strong>{missingCount}</strong> out of 80
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateAllWeapons}
                disabled={isGenerating || isCheckingMissing}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate All 80 Weapons'
                )}
              </Button>
              <Button
                onClick={generateMissingWeapons}
                disabled={isGenerating || isCheckingMissing}
                size="lg"
                variant="outline"
              >
                {isCheckingMissing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Generate Missing Only'
                )}
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progressPercentage} />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </p>
            </div>
          )}

          {summary && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Generation Complete!</strong>
                <br />
                Total: {summary.total} | Completed: {summary.completed} | Failed: {summary.failed}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Existing Weapons Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Existing Weapons</CardTitle>
              <CardDescription>
                {existingWeapons.length} out of 80 weapons in database
              </CardDescription>
            </div>
            <Button
              onClick={loadExistingWeapons}
              disabled={isLoadingExisting}
              variant="outline"
              size="sm"
            >
              {isLoadingExisting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh List'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingExisting && existingWeapons.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading weapons...</span>
            </div>
          ) : existingWeapons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No weapons found in database. Generate weapons to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {existingWeapons.map((weapon) => (
                <div
                  key={`${weapon.weapon_class}-${weapon.rarity}`}
                  className="group relative border rounded-lg p-2 hover:border-blue-500 transition-all hover:shadow-md"
                >
                  <div className="aspect-square relative mb-2 overflow-hidden rounded">
                    <img
                      src={weapon.image_url}
                      alt={weapon.weapon_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium truncate" title={weapon.weapon_name}>
                      {weapon.weapon_name}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Class {weapon.weapon_class}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getRarityBadgeColor(
                          weapon.rarity
                        )}`}
                      >
                        {getRarityName(weapon.rarity as WeaponRarity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {progress.map((item, index) => (
                <div
                  key={`${item.weaponClass}-${item.rarity}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.rarityName} {item.weaponName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Class {item.weaponClass} | Rarity {item.rarity}
                    </p>
                    {item.error && (
                      <p className="text-sm text-red-500 mt-1">{item.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <span className="text-sm text-muted-foreground">Pending</span>
                    )}
                    {item.status === 'generating' && (
                      <span className="text-sm text-blue-500 flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Generating
                      </span>
                    )}
                    {item.status === 'compressing' && (
                      <span className="text-sm text-yellow-500 flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Compressing
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-sm text-purple-500 flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Uploading
                      </span>
                    )}
                    {item.status === 'storing' && (
                      <span className="text-sm text-indigo-500 flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Storing
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-sm text-green-500 flex items-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-sm text-red-500 flex items-center">
                        <XCircle className="mr-1 h-3 w-3" />
                        Failed
                      </span>
                    )}
                  </div>

                  {item.imageUrl && (
                    <div className="ml-4">
                      <img
                        src={item.imageUrl}
                        alt={`${item.rarityName} ${item.weaponName}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
