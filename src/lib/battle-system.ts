/**
 * Battle System Core Logic
 * Handles class advantages, multiplier calculations, and reward distributions
 */

export type MonsterRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type ElementType = 'Fire' | 'Ice' | 'Dark' | 'Lightning' | 'Poison' | 'Nature' | 'Metal' | 'Arcane' | 'Chaos';
export type ClassType = string; // Any class name from FrameFusion

export type ElementMatchup = 'super_effective' | 'effective' | 'neutral' | 'not_effective';

/**
 * Power Multipliers based on Monster Rarity
 */
export const POWER_MULTIPLIERS: Record<MonsterRarity, number> = {
  Common: 1.5,
  Uncommon: 2.0,
  Rare: 3.0,
  Epic: 5.0,
  Legendary: 8.0,
};

/**
 * Element Matchup Multipliers
 */
export const ELEMENT_MULTIPLIERS: Record<ElementMatchup, number> = {
  super_effective: 3.0,
  effective: 2.0,
  neutral: 1.0,
  not_effective: 0.5,
};

/**
 * Fee Distribution Percentages
 */
export const FEE_DISTRIBUTION = {
  winner: 0.50,        // 50% to FrameFusion owner
  monsterOwner: 0.25,  // 25% to Monster staker
  treasury: 0.15,      // 15% to Treasury
  raffle: 0.10,        // 10% to Raffle Pool
};

/**
 * Entry Fee Tiers
 */
export const ENTRY_TIERS = {
  free: {
    cost: 0,
    baseReward: 100,
    raffleTickets: 0,
    dailyLimit: 3,
  },
  standard: {
    min: 5000,
    max: 500000,
    raffleTickets: 1,
    dailyLimit: 3,
  },
  premium: {
    min: 500000,
    max: 5000000,
    raffleTickets: 5,
    rewardMultiplier: 1.2,
    dailyLimit: 3,
  },
};

/**
 * Class vs Element Advantage Matrix
 * Maps FrameFusion classes to their advantages against monster elements
 */
export const CLASS_ELEMENT_ADVANTAGES: Record<string, {
  strongAgainst: ElementType[];
  weakAgainst: ElementType[];
  neutral: ElementType[];
}> = {
  // RPG Fantasy Classes
  'Swordmaster': {
    strongAgainst: ['Dark', 'Chaos'],
    weakAgainst: ['Fire', 'Lightning'],
    neutral: ['Ice', 'Poison', 'Nature', 'Metal', 'Arcane'],
  },
  'Shadow Assassin': {
    strongAgainst: ['Dark', 'Poison'],
    weakAgainst: ['Arcane', 'Lightning'],
    neutral: ['Fire', 'Ice', 'Chaos', 'Nature', 'Metal'],
  },
  'Holy Knight': {
    strongAgainst: ['Dark', 'Chaos', 'Poison'],
    weakAgainst: ['Fire'],
    neutral: ['Ice', 'Lightning', 'Nature', 'Metal', 'Arcane'],
  },
  'Battle Mage': {
    strongAgainst: ['Fire', 'Ice', 'Arcane'],
    weakAgainst: ['Metal', 'Chaos'],
    neutral: ['Dark', 'Lightning', 'Poison', 'Nature'],
  },
  'Archer Ranger': {
    strongAgainst: ['Nature', 'Lightning'],
    weakAgainst: ['Fire', 'Metal'],
    neutral: ['Ice', 'Dark', 'Poison', 'Chaos', 'Arcane'],
  },
  
  // Modern Classes
  'Tech Hacker': {
    strongAgainst: ['Metal', 'Lightning'],
    weakAgainst: ['Nature', 'Chaos'],
    neutral: ['Fire', 'Ice', 'Dark', 'Poison', 'Arcane'],
  },
  'Street Fighter': {
    strongAgainst: ['Nature', 'Metal'],
    weakAgainst: ['Fire', 'Lightning'],
    neutral: ['Ice', 'Dark', 'Poison', 'Chaos', 'Arcane'],
  },
  'Musician Bard': {
    strongAgainst: ['Chaos', 'Dark'],
    weakAgainst: ['Metal', 'Nature'],
    neutral: ['Fire', 'Ice', 'Lightning', 'Poison', 'Arcane'],
  },
  'Chef Artisan': {
    strongAgainst: ['Fire', 'Poison'],
    weakAgainst: ['Ice', 'Metal'],
    neutral: ['Dark', 'Lightning', 'Chaos', 'Nature', 'Arcane'],
  },
  'Photographer Scout': {
    strongAgainst: ['Dark', 'Lightning'],
    weakAgainst: ['Metal', 'Chaos'],
    neutral: ['Fire', 'Ice', 'Poison', 'Nature', 'Arcane'],
  },
  
  // Hybrid Classes
  'Gunslinger': {
    strongAgainst: ['Metal', 'Fire'],
    weakAgainst: ['Lightning', 'Arcane'],
    neutral: ['Ice', 'Dark', 'Poison', 'Chaos', 'Nature'],
  },
  'Medic Healer': {
    strongAgainst: ['Poison', 'Dark'],
    weakAgainst: ['Fire', 'Lightning'],
    neutral: ['Ice', 'Metal', 'Chaos', 'Nature', 'Arcane'],
  },
  'Engineer Builder': {
    strongAgainst: ['Metal', 'Lightning'],
    weakAgainst: ['Chaos', 'Fire'],
    neutral: ['Ice', 'Dark', 'Poison', 'Nature', 'Arcane'],
  },
  'Detective Investigator': {
    strongAgainst: ['Dark', 'Chaos'],
    weakAgainst: ['Poison', 'Arcane'],
    neutral: ['Fire', 'Ice', 'Lightning', 'Metal', 'Nature'],
  },
  'Athlete Champion': {
    strongAgainst: ['Nature', 'Lightning'],
    weakAgainst: ['Fire', 'Metal'],
    neutral: ['Ice', 'Dark', 'Poison', 'Chaos', 'Arcane'],
  },
  
  // More Fantasy
  'Beast Tamer': {
    strongAgainst: ['Nature', 'Poison'],
    weakAgainst: ['Fire', 'Metal'],
    neutral: ['Ice', 'Dark', 'Lightning', 'Chaos', 'Arcane'],
  },
  'Alchemist Sage': {
    strongAgainst: ['Poison', 'Arcane'],
    weakAgainst: ['Chaos', 'Metal'],
    neutral: ['Fire', 'Ice', 'Dark', 'Lightning', 'Nature'],
  },
  'Samurai Duelist': {
    strongAgainst: ['Dark', 'Metal'],
    weakAgainst: ['Fire', 'Lightning'],
    neutral: ['Ice', 'Poison', 'Chaos', 'Nature', 'Arcane'],
  },
  'Ninja Operative': {
    strongAgainst: ['Dark', 'Poison'],
    weakAgainst: ['Lightning', 'Arcane'],
    neutral: ['Fire', 'Ice', 'Metal', 'Chaos', 'Nature'],
  },
  'Dragon Knight': {
    strongAgainst: ['Fire', 'Dark', 'Chaos'],
    weakAgainst: ['Ice', 'Metal'],
    neutral: ['Lightning', 'Poison', 'Nature', 'Arcane'],
  },
};

/**
 * Calculate element matchup type
 */
export function calculateElementMatchup(
  classType: string,
  monsterElement: ElementType
): ElementMatchup {
  const advantages = CLASS_ELEMENT_ADVANTAGES[classType];
  
  // If class not in matrix, default to neutral
  if (!advantages) {
    return 'neutral';
  }
  
  if (advantages.strongAgainst.includes(monsterElement)) {
    // Super effective if 2+ elements in strong list match
    const strongCount = advantages.strongAgainst.length;
    return strongCount >= 3 ? 'super_effective' : 'effective';
  }
  
  if (advantages.weakAgainst.includes(monsterElement)) {
    return 'not_effective';
  }
  
  return 'neutral';
}

/**
 * Get power multiplier based on monster rarity and power level
 */
export function getPowerMultiplier(rarity: MonsterRarity): number {
  return POWER_MULTIPLIERS[rarity] || 1.0;
}

/**
 * Get element multiplier based on matchup
 */
export function getElementMultiplier(matchup: ElementMatchup): number {
  return ELEMENT_MULTIPLIERS[matchup];
}

/**
 * Calculate final rewards for battle
 */
export interface BattleRewards {
  framefusionReward: number;
  monsterOwnerReward: number;
  treasuryAmount: number;
  raffleContribution: number;
  powerMultiplier: number;
  elementMultiplier: number;
  elementMatchup: ElementMatchup;
  basePool: number;
}

export function calculateBattleRewards(
  entryFee: number,
  classType: string,
  monsterElement: ElementType,
  monsterRarity: MonsterRarity,
  isPremium: boolean = false
): BattleRewards {
  // Base pool (50% of entry fee goes to reward calculation)
  const basePool = entryFee * 0.50;
  
  // Get multipliers
  const powerMultiplier = getPowerMultiplier(monsterRarity);
  const elementMatchup = calculateElementMatchup(classType, monsterElement);
  const elementMultiplier = getElementMultiplier(elementMatchup);
  
  // Calculate FrameFusion owner reward with multipliers
  let framefusionReward = basePool * powerMultiplier * elementMultiplier;
  
  // Apply premium bonus if applicable
  if (isPremium) {
    framefusionReward *= ENTRY_TIERS.premium.rewardMultiplier;
  }
  
  // Monster owner gets fixed 25% (no multipliers)
  const monsterOwnerReward = entryFee * FEE_DISTRIBUTION.monsterOwner;
  
  // Treasury gets fixed 15%
  const treasuryAmount = entryFee * FEE_DISTRIBUTION.treasury;
  
  // Raffle gets fixed 10%
  const raffleContribution = entryFee * FEE_DISTRIBUTION.raffle;
  
  return {
    framefusionReward,
    monsterOwnerReward,
    treasuryAmount,
    raffleContribution,
    powerMultiplier,
    elementMultiplier,
    elementMatchup,
    basePool,
  };
}

/**
 * Get rarity from power level
 */
export function getRarityFromPower(power: number): MonsterRarity {
  if (power >= 1600) return 'Legendary';
  if (power >= 800) return 'Epic';
  if (power >= 400) return 'Rare';
  if (power >= 200) return 'Uncommon';
  return 'Common';
}

/**
 * Get current week number (format: YYYYWW)
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return parseInt(`${year}${week.toString().padStart(2, '0')}`);
}
