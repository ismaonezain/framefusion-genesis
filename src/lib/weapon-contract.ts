/**
 * WeaponNFT Contract Integration
 * 20 Weapon Types Matching FrameFusion Character Classes
 * Handles weapon minting, equipment, upgrades, and breaking mechanics
 */

import { parseEther } from 'viem';

// WeaponNFT Contract Configuration
export const WEAPON_NFT_CONTRACT = {
  address: '0xEE24F39b5C8a444e46F26Dc858D61374cb7c9b1c', // Deployed weapon contract on Base
  abi: [
    {
      inputs: [
        { name: '_weaponClass', type: 'uint8' },
        { name: '_weaponType', type: 'string' },
        { name: '_rarity', type: 'uint8' },
        { name: '_attackPower', type: 'uint256' },
        { name: '_tokenURI', type: 'string' }
      ],
      name: 'mintWeapon',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_weaponClass', type: 'uint8' },
        { name: '_weaponType', type: 'string' },
        { name: '_rarity', type: 'uint8' },
        { name: '_attackPower', type: 'uint256' },
        { name: '_tokenURI', type: 'string' }
      ],
      name: 'ownerMint',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_weaponTokenId', type: 'uint256' },
        { name: '_frameFusionTokenId', type: 'uint256' }
      ],
      name: 'equipWeapon',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: '_weaponTokenId', type: 'uint256' }],
      name: 'unequipWeapon',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { name: '_tokenId', type: 'uint256' },
        { name: '_newLevel', type: 'uint8' },
        { name: '_newAttackPower', type: 'uint256' }
      ],
      name: 'updateWeaponStats',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: '_tokenId', type: 'uint256' }],
      name: 'breakWeapon',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: '_tokenId', type: 'uint256' }],
      name: 'getWeaponStats',
      outputs: [
        { name: 'class', type: 'uint8' },
        { name: 'typeStr', type: 'string' },
        { name: 'rarity', type: 'uint8' },
        { name: 'level', type: 'uint8' },
        { name: 'attack', type: 'uint256' },
        { name: 'equipped', type: 'uint256' },
        { name: 'broken', type: 'bool' }
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'tokensOfOwner',
      outputs: [{ name: '', type: 'uint256[]' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: '', type: 'uint8' }],
      name: 'mintCosts',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'reserveAddress',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { name: '_rarity', type: 'uint8' },
        { name: '_newCost', type: 'uint256' }
      ],
      name: 'updateMintCost',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
} as const;

// Weapon Class Enum (0-19, matching 20 FrameFusion classes)
export enum WeaponClass {
  Swordmaster = 0,
  ShadowAssassin = 1,
  HolyKnight = 2,
  BattleMage = 3,
  ArcherRanger = 4,
  TechHacker = 5,
  StreetFighter = 6,
  MusicianBard = 7,
  ChefArtisan = 8,
  PhotographerScout = 9,
  Gunslinger = 10,
  MedicHealer = 11,
  EngineerBuilder = 12,
  DetectiveInvestigator = 13,
  AthleteChampion = 14,
  BeastTamer = 15,
  AlchemistSage = 16,
  SamuraiDuelist = 17,
  NinjaOperative = 18,
  DragonKnight = 19,
}

export enum WeaponRarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
}

// Array of rarity names for iteration
export const WEAPON_RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export const RARITY_NAMES = WEAPON_RARITIES; // Alias for component compatibility

// 80 Unique Weapon Names - 20 classes x 4 rarities
// Format: [Common, Rare, Epic, Legendary] for each weapon class
export const WEAPON_NAMES_BY_RARITY: Record<WeaponClass, [string, string, string, string]> = {
  // 0: Swordmaster - Twin Blades
  [WeaponClass.Swordmaster]: ['Rusty Blades', 'Steel Twins', 'Storm Blades', 'Excalibur'],
  
  // 1: Shadow Assassin - Daggers
  [WeaponClass.ShadowAssassin]: ['Iron Daggers', 'Night Piercer', 'Voidstrike', 'Shadowfang'],
  
  // 2: Holy Knight - Longsword
  [WeaponClass.HolyKnight]: ['Wooden Sword', 'Silver Blade', 'Dawn Reaver', 'Lightbringer'],
  
  // 3: Battle Mage - Staff-Sword
  [WeaponClass.BattleMage]: ['Oak Staff', 'Mystic Rod', 'Spellblade', 'Arcanum'],
  
  // 4: Archer Ranger - Bow
  [WeaponClass.ArcherRanger]: ['Short Bow', 'Hunter Longbow', 'Tempest Bow', 'Windcaller'],
  
  // 5: Tech Hacker - Device
  [WeaponClass.TechHacker]: ['Old Laptop', 'Cyber Deck', 'Quantum Core', 'Cipher'],
  
  // 6: Street Fighter - Gauntlets
  [WeaponClass.StreetFighter]: ['Cloth Wraps', 'Iron Fists', 'Thunder Knuckle', 'Striker'],
  
  // 7: Musician Bard - Instrument
  [WeaponClass.MusicianBard]: ['Broken Lute', 'Silver Harp', 'Celestial Strings', 'Harmony'],
  
  // 8: Chef Artisan - Blade
  [WeaponClass.ChefArtisan]: ['Kitchen Knife', 'Chef Cleaver', 'Gourmet Edge', 'Crimson Edge'],
  
  // 9: Photographer Scout - Camera
  [WeaponClass.PhotographerScout]: ['Polaroid', 'Digital Camera', 'Soul Lens', 'Chronos'],
  
  // 10: Gunslinger - Revolvers
  [WeaponClass.Gunslinger]: ['Rusty Pistols', 'Silver Shooters', 'Inferno Guns', 'Hellfire'],
  
  // 11: Medic Healer - Medical Kit
  [WeaponClass.MedicHealer]: ['First Aid Kit', 'Medic Bag', 'Divine Healer', 'Aegis'],
  
  // 12: Engineer Builder - Tools
  [WeaponClass.EngineerBuilder]: ['Rusty Wrench', 'Mechanic Tools', 'Titan Gear', 'Titan Forge'],
  
  // 13: Detective Investigator - Magnifier
  [WeaponClass.DetectiveInvestigator]: ['Pocket Lens', 'Detective Glass', 'Oracle Eye', 'Veritas'],
  
  // 14: Athlete Champion - Sports Gear
  [WeaponClass.AthleteChampion]: ['Worn Glove', 'Pro Equipment', 'Champion Gear', 'Olympus'],
  
  // 15: Beast Tamer - Orb
  [WeaponClass.BeastTamer]: ['Stone Orb', 'Spirit Crystal', 'Beast Soul', 'Wildborn'],
  
  // 16: Alchemist Sage - Potions
  [WeaponClass.AlchemistSage]: ['Herb Pouch', 'Alchemist Flask', 'Grand Elixir', 'Elixir'],
  
  // 17: Samurai Duelist - Katana
  [WeaponClass.SamuraiDuelist]: ['Training Blade', 'Steel Katana', 'Demon Slayer', 'Muramasa'],
  
  // 18: Ninja Operative - Kunai
  [WeaponClass.NinjaOperative]: ['Dull Kunai', 'Shadow Knife', 'Ghost Blade', 'Phantom'],
  
  // 19: Dragon Knight - Spear
  [WeaponClass.DragonKnight]: ['Wooden Spear', 'Dragon Pike', 'Flame Lance', 'Dragonspire'],
};

// Helper function to get weapon name by class and rarity
export function getWeaponNameByRarity(weaponClass: WeaponClass, rarity: WeaponRarity): string {
  return WEAPON_NAMES_BY_RARITY[weaponClass][rarity];
}

// Legacy compatibility - returns legendary names
export const WEAPON_TYPES_ARRAY = [
  'Excalibur', 'Shadowfang', 'Lightbringer', 'Arcanum', 'Windcaller',
  'Cipher', 'Striker', 'Harmony', 'Crimson Edge', 'Chronos',
  'Hellfire', 'Aegis', 'Titan Forge', 'Veritas', 'Olympus',
  'Wildborn', 'Elixir', 'Muramasa', 'Phantom', 'Dragonspire',
] as const;

// Legacy compatibility - returns legendary names
export const WEAPON_TYPES: Record<WeaponClass, string> = {
  [WeaponClass.Swordmaster]: 'Excalibur',
  [WeaponClass.ShadowAssassin]: 'Shadowfang',
  [WeaponClass.HolyKnight]: 'Lightbringer',
  [WeaponClass.BattleMage]: 'Arcanum',
  [WeaponClass.ArcherRanger]: 'Windcaller',
  [WeaponClass.TechHacker]: 'Cipher',
  [WeaponClass.StreetFighter]: 'Striker',
  [WeaponClass.MusicianBard]: 'Harmony',
  [WeaponClass.ChefArtisan]: 'Crimson Edge',
  [WeaponClass.PhotographerScout]: 'Chronos',
  [WeaponClass.Gunslinger]: 'Hellfire',
  [WeaponClass.MedicHealer]: 'Aegis',
  [WeaponClass.EngineerBuilder]: 'Titan Forge',
  [WeaponClass.DetectiveInvestigator]: 'Veritas',
  [WeaponClass.AthleteChampion]: 'Olympus',
  [WeaponClass.BeastTamer]: 'Wildborn',
  [WeaponClass.AlchemistSage]: 'Elixir',
  [WeaponClass.SamuraiDuelist]: 'Muramasa',
  [WeaponClass.NinjaOperative]: 'Phantom',
  [WeaponClass.DragonKnight]: 'Dragonspire',
};

// Map FrameFusion character class names to weapon class enum
export const CHARACTER_CLASS_TO_WEAPON: Record<string, WeaponClass> = {
  'Swordmaster': WeaponClass.Swordmaster,
  'Shadow Assassin': WeaponClass.ShadowAssassin,
  'Holy Knight': WeaponClass.HolyKnight,
  'Battle Mage': WeaponClass.BattleMage,
  'Archer Ranger': WeaponClass.ArcherRanger,
  'Tech Hacker': WeaponClass.TechHacker,
  'Street Fighter': WeaponClass.StreetFighter,
  'Musician Bard': WeaponClass.MusicianBard,
  'Chef Artisan': WeaponClass.ChefArtisan,
  'Photographer Scout': WeaponClass.PhotographerScout,
  'Gunslinger': WeaponClass.Gunslinger,
  'Medic Healer': WeaponClass.MedicHealer,
  'Engineer Builder': WeaponClass.EngineerBuilder,
  'Detective Investigator': WeaponClass.DetectiveInvestigator,
  'Athlete Champion': WeaponClass.AthleteChampion,
  'Beast Tamer': WeaponClass.BeastTamer,
  'Alchemist Sage': WeaponClass.AlchemistSage,
  'Samurai Duelist': WeaponClass.SamuraiDuelist,
  'Ninja Operative': WeaponClass.NinjaOperative,
  'Dragon Knight': WeaponClass.DragonKnight,
};

// Base attack power by rarity
export const BASE_ATTACK_POWER: Record<WeaponRarity, number> = {
  [WeaponRarity.Common]: 50,
  [WeaponRarity.Rare]: 100,
  [WeaponRarity.Epic]: 150,
  [WeaponRarity.Legendary]: 200,
};

// Weapon minting now uses $SHADOW tokens ON-CHAIN (display only)
export const WEAPON_MINT_SHADOW_COSTS: Record<WeaponRarity, number> = {
  [WeaponRarity.Common]: 100,      // 100 $SHADOW (display)
  [WeaponRarity.Rare]: 300,        // 300 $SHADOW (display)
  [WeaponRarity.Epic]: 800,        // 800 $SHADOW (display)
  [WeaponRarity.Legendary]: 2000,  // 2000 $SHADOW (display)
};

// Mint costs in ETH (wei) - no ETH payment required
export const WEAPON_MINT_COSTS: Record<WeaponRarity, bigint> = {
  [WeaponRarity.Common]: parseEther('0'),
  [WeaponRarity.Rare]: parseEther('0'),
  [WeaponRarity.Epic]: parseEther('0'),
  [WeaponRarity.Legendary]: parseEther('0'),
};

// Upgrade success rates by level
export const UPGRADE_SUCCESS_RATES: Record<number, number> = {
  1: 100,  // 1→2: 100%
  2: 95,   // 2→3: 95%
  3: 90,   // 3→4: 90%
  4: 85,   // 4→5: 85%
  5: 80,   // 5→6: 80%
  6: 75,   // 6→7: 75% + 30% break risk
  7: 70,   // 7→8: 70% + 30% break risk
  8: 65,   // 8→9: 65% + 30% break risk
  9: 60,   // 9→10: 60% + 30% break risk
};

// Upgrade costs by level (in $SHADOW tokens) - goes to reserve
export const UPGRADE_COSTS: Record<number, number> = {
  1: 10,
  2: 20,
  3: 40,
  4: 80,
  5: 160,
  6: 320,
  7: 640,
  8: 1280,
  9: 2560,
};

// Weapon breaking thresholds
export const WEAPON_BREAK_THRESHOLD = 6; // Level 6+ has 30% break risk on failure
export const WEAPON_BREAK_CHANCE = 30;  // 30% chance to break if upgrade fails at level 6+

// Class match bonus
export const CLASS_MATCH_BONUS = 0.30; // +30% battle power if weapon class matches FrameFusion class

// Types
export type WeaponMintParams = {
  weaponClass: WeaponClass;
  weaponType: string;
  rarity: WeaponRarity;
  attackPower: number;
  tokenURI: string;
};

export type WeaponStats = {
  class: number;
  typeStr: string;
  rarity: number;
  level: number;
  attack: bigint;
  equipped: bigint;
  broken: boolean;
};

export type WeaponUpgradeResult = {
  success: boolean;
  broken: boolean;
  newLevel?: number;
  newAttackPower?: number;
  cost: number;
};

// Helper functions
export function getWeaponClassName(weaponClass: WeaponClass): string {
  const names: Record<WeaponClass, string> = {
    [WeaponClass.Swordmaster]: 'Swordmaster',
    [WeaponClass.ShadowAssassin]: 'Shadow Assassin',
    [WeaponClass.HolyKnight]: 'Holy Knight',
    [WeaponClass.BattleMage]: 'Battle Mage',
    [WeaponClass.ArcherRanger]: 'Archer Ranger',
    [WeaponClass.TechHacker]: 'Tech Hacker',
    [WeaponClass.StreetFighter]: 'Street Fighter',
    [WeaponClass.MusicianBard]: 'Musician Bard',
    [WeaponClass.ChefArtisan]: 'Chef Artisan',
    [WeaponClass.PhotographerScout]: 'Photographer Scout',
    [WeaponClass.Gunslinger]: 'Gunslinger',
    [WeaponClass.MedicHealer]: 'Medic Healer',
    [WeaponClass.EngineerBuilder]: 'Engineer Builder',
    [WeaponClass.DetectiveInvestigator]: 'Detective Investigator',
    [WeaponClass.AthleteChampion]: 'Athlete Champion',
    [WeaponClass.BeastTamer]: 'Beast Tamer',
    [WeaponClass.AlchemistSage]: 'Alchemist Sage',
    [WeaponClass.SamuraiDuelist]: 'Samurai Duelist',
    [WeaponClass.NinjaOperative]: 'Ninja Operative',
    [WeaponClass.DragonKnight]: 'Dragon Knight',
  };
  return names[weaponClass];
}

export function getRarityName(rarity: WeaponRarity): string {
  const names: Record<WeaponRarity, string> = {
    [WeaponRarity.Common]: 'Common',
    [WeaponRarity.Rare]: 'Rare',
    [WeaponRarity.Epic]: 'Epic',
    [WeaponRarity.Legendary]: 'Legendary',
  };
  return names[rarity];
}

export function getRarityColor(rarity: WeaponRarity): string {
  const colors: Record<WeaponRarity, string> = {
    [WeaponRarity.Common]: '#9CA3AF',    // Gray
    [WeaponRarity.Rare]: '#3B82F6',      // Blue
    [WeaponRarity.Epic]: '#A855F7',      // Purple
    [WeaponRarity.Legendary]: '#F59E0B', // Amber
  };
  return colors[rarity];
}

export function calculateUpgradePowerBonus(rarity: WeaponRarity, currentLevel: number): number {
  const rarityMultipliers: Record<WeaponRarity, number> = {
    [WeaponRarity.Common]: 1.10,      // +10% per level
    [WeaponRarity.Rare]: 1.15,        // +15% per level
    [WeaponRarity.Epic]: 1.20,        // +20% per level
    [WeaponRarity.Legendary]: 1.25,   // +25% per level
  };
  
  const baseAttack = BASE_ATTACK_POWER[rarity];
  const multiplier = rarityMultipliers[rarity];
  
  return Math.floor(baseAttack * Math.pow(multiplier, currentLevel - 1));
}

export function getRandomRarity(): WeaponRarity {
  const roll = Math.random() * 100;
  
  if (roll < 60) return WeaponRarity.Common;       // 60%
  if (roll < 85) return WeaponRarity.Rare;         // 25%
  if (roll < 95) return WeaponRarity.Epic;         // 10%
  return WeaponRarity.Legendary;                    // 5%
}

/**
 * Calculate battle power bonus from equipped weapon
 * @param weaponClass Weapon's class
 * @param frameFusionClass FrameFusion's character class name
 * @param weaponRarity Weapon's rarity tier
 * @param weaponLevel Weapon's current level
 * @returns Total battle power bonus multiplier (0.0 to 1.0+)
 */
export function calculateWeaponBonus(
  weaponClass: WeaponClass,
  frameFusionClass: string,
  weaponRarity: WeaponRarity,
  weaponLevel: number
): number {
  let totalBonus = 0;
  
  // Class match bonus (+30% if weapon class matches FrameFusion class)
  const weaponClassEnum = CHARACTER_CLASS_TO_WEAPON[frameFusionClass];
  if (weaponClassEnum === weaponClass) {
    totalBonus += CLASS_MATCH_BONUS; // +30%
  }
  
  // Rarity bonus
  const rarityBonus: Record<WeaponRarity, number> = {
    [WeaponRarity.Common]: 0.10,      // +10%
    [WeaponRarity.Rare]: 0.15,        // +15%
    [WeaponRarity.Epic]: 0.20,        // +20%
    [WeaponRarity.Legendary]: 0.30,   // +30%
  };
  totalBonus += rarityBonus[weaponRarity];
  
  // Level bonus (+5% per level)
  totalBonus += (weaponLevel - 1) * 0.05;
  
  return totalBonus;
}

/**
 * Get weapon class by character class name
 */
export function getWeaponClassByCharacterClass(characterClass: string): WeaponClass | null {
  return CHARACTER_CLASS_TO_WEAPON[characterClass] ?? null;
}

/**
 * Get formatted weapon name with token ID
 * Format: "WeaponName #TokenID"
 * Example: "Excalibur #1234"
 */
export function getWeaponName(weaponClass: WeaponClass, rarity: WeaponRarity, tokenId: number): string {
  const weaponName = getWeaponNameByRarity(weaponClass, rarity);
  return `${weaponName} #${tokenId}`;
}

/**
 * Get full weapon name with rarity
 * Format: "Rarity WeaponName #TokenID"
 * Example: "Legendary Excalibur #1234"
 */
export function getFullWeaponName(weaponClass: WeaponClass, rarity: WeaponRarity, tokenId: number): string {
  const rarityName = getRarityName(rarity);
  const weaponName = getWeaponNameByRarity(weaponClass, rarity);
  return `${rarityName} ${weaponName} #${tokenId}`;
}
