/**
 * Detailed weapon descriptions for AI image generation
 * Each weapon has specific visual characteristics to ensure uniqueness
 */

import type { WeaponClass } from './weapon-contract';

export const WEAPON_VISUAL_DETAILS: Record<WeaponClass, string> = {
  0: 'twin crossed swords with glowing blue crystal embedded in hilts, ornate silver guards, ethereal light trails',
  1: 'pair of curved black daggers with serrated edges, purple shadow wisps emanating, sleek deadly design',
  2: 'radiant golden longsword with cross-shaped guard, white holy aura, angelic wing motifs on blade',
  3: 'hybrid crystal staff-blade weapon with floating rune circles, magical energy flowing through central core',
  4: 'elegant elven-style longbow with green vine patterns, glowing arrow nocked, nature energy swirling',
  5: 'futuristic holographic interface device with floating digital screens, cyan circuit patterns, tech symbols',
  6: 'mechanical gauntlets with energy fists, red power lines, armored knuckle plates',
  7: 'glowing electric guitar with musical note particles floating, sound wave aura, colorful strings',
  8: 'sleek chef knife with crimson blade edge, silver handle with flame engravings, culinary precision design',
  9: 'advanced camera with lens glowing golden light, time distortion effects around it, vintage-futuristic hybrid',
  10: 'dual ornate revolvers with flame engravings, orange muzzle glow, wild west meets fantasy aesthetic',
  11: 'white medical kit with red cross symbol glowing, healing light emanating, angel feather particles',
  12: 'massive mechanical toolbox-weapon with extending robotic arms, blueprint holograms, gear mechanisms visible',
  13: 'golden magnifying glass with detective symbols, truth-revealing light beam, mystery runes floating',
  14: 'legendary sports trophy that transforms into weapon, victory laurel wreath, champion golden glow',
  15: 'mystical crystal orb with beast spirits swirling inside, tribal rune patterns, animal silhouettes',
  16: 'set of glowing potion vials in ornate holder, rainbow alchemical liquids, magical bubbles floating',
  17: 'traditional katana with dragon-engraved blade, red silk wrap handle, samurai honor aura',
  18: 'set of shadow kunai with purple ninja smoke, chain connecting them, stealth particle effects',
  19: 'legendary flame-wreathed spear with dragon head ornament, orange-red fire spiraling, scale patterns',
};

export function getWeaponPrompt(weaponClass: WeaponClass, weaponName: string, rarityGlow: string, rarityTier: string): string {
  const visualDetail = WEAPON_VISUAL_DETAILS[weaponClass];
  
  // Add quality descriptors based on rarity
  const qualityDescriptor = rarityTier === 'Common' 
    ? 'worn and weathered appearance, simple design'
    : rarityTier === 'Rare'
    ? 'polished and refined, modest magical glow'
    : rarityTier === 'Epic'
    ? 'ornate decorations, strong magical aura'
    : 'legendary masterpiece, overwhelming divine power radiating';
  
  return `Anime fantasy RPG weapon art: ${weaponName}, ${visualDetail}, ${rarityGlow}, ${qualityDescriptor}, floating centered in frame, pure black background, absolutely no text anywhere, no letters, no words, no watermark, professional game asset, high detail anime illustration, clean composition, vibrant colors, sharp focus, 1024x1024 resolution, front view, dramatic cinematic lighting, no characters`;
}
