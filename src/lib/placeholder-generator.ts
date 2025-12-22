/**
 * Placeholder Image Generator for Monster NFTs
 * Generates placeholder images while AI artwork is being created
 */

export function generatePlaceholderMonsterImage(monsterId: number, element: string): string {
  // Color schemes based on element
  const elementColors: Record<string, { bg: string; text: string }> = {
    Dark: { bg: '1a1a1a', text: '8b00ff' },
    Fire: { bg: '2a0a00', text: 'ff4500' },
    Ice: { bg: '0a1a2a', text: '00bfff' },
    Lightning: { bg: '1a1a00', text: 'ffff00' },
    Poison: { bg: '0a2a0a', text: '00ff00' },
    Chaos: { bg: '2a002a', text: 'ff00ff' },
    Metal: { bg: '1a1a1a', text: 'c0c0c0' },
    Nature: { bg: '001a0a', text: '228b22' },
    Arcane: { bg: '00102a', text: '4169e1' },
  };

  const colors = elementColors[element] || elementColors.Dark;
  
  // Generate placeholder URL
  return `https://via.placeholder.com/512/${colors.bg}/${colors.text}?text=Monster+%23${monsterId}+Generating...`;
}

export function generatePlaceholderMetadata(
  monsterId: number,
  monsterName: string,
  element: string,
  rarity: string,
  powerLevel: number
): string {
  const placeholderImage = generatePlaceholderMonsterImage(monsterId, element);
  
  const metadata = {
    name: monsterName,
    description: `Dark anime creature from the FrameShadows collection. Monster ID: ${monsterId}. High-quality anime artwork is being generated with FluxPro AI...`,
    image: placeholderImage,
    attributes: [
      { trait_type: 'Status', value: 'Generating Anime Artwork' },
      { trait_type: 'Monster ID', value: monsterId },
      { trait_type: 'Element', value: element },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Power Level', value: powerLevel },
      { trait_type: 'Level', value: 1 },
      { trait_type: 'Collection', value: 'FrameShadows' },
      { trait_type: 'Art Style', value: 'Anime (Generating)' },
    ],
    external_url: `https://your-app-url.com/monsters/${monsterId}`,
  };

  return JSON.stringify(metadata);
}

/**
 * Check if an image URL is a placeholder
 */
export function isPlaceholderImage(imageUrl: string | undefined): boolean {
  if (!imageUrl) return false; // Handle undefined/null/empty
  return imageUrl.includes('via.placeholder.com') || imageUrl.includes('Generating');
}

/**
 * Get status message based on image URL
 */
export function getMonsterImageStatus(imageUrl: string | undefined): string {
  if (!imageUrl) return 'No Image'; // Handle undefined/null/empty
  if (isPlaceholderImage(imageUrl)) {
    return 'Generating anime artwork...';
  }
  return 'Ready';
}
