/**
 * FrameShadows Monster Generator
 * Dark creatures that serve as opponents for FrameFusion characters
 * Monsters have unique types, abilities, elements, and dark aesthetics
 */

type MonsterPalette = {
  name: string;
  colors: string[];
  vibe: string;
};

type MonsterType = {
  name: string;
  description: string;
  abilities: string;
  appearance: string;
  accessories: string;
  element: string; // Element type matching monster nature
};

type MonsterEnvironment = {
  name: string;
  description: string;
};

type MonsterRarity = {
  name: string;
  power: string;
};

// 15 Dark Color Palettes for Monsters
const MONSTER_PALETTES: MonsterPalette[] = [
  { name: 'Void Black', colors: ['pitch black', 'dark purple', 'deep crimson'], vibe: 'ominous and shadowy' },
  { name: 'Toxic Corruption', colors: ['toxic green', 'bile yellow', 'rotten brown'], vibe: 'poisonous and diseased' },
  { name: 'Blood Moon', colors: ['blood red', 'midnight black', 'bone white'], vibe: 'vampiric and sinister' },
  { name: 'Abyssal Depth', colors: ['deep navy', 'dark teal', 'void black'], vibe: 'aquatic horror' },
  { name: 'Infernal Flame', colors: ['hellfire red', 'molten orange', 'ash black'], vibe: 'demonic and burning' },
  { name: 'Frost Wraith', colors: ['icy white', 'frozen blue', 'shadow gray'], vibe: 'cold and lifeless' },
  { name: 'Plague Bearer', colors: ['sickly green', 'putrid yellow', 'death gray'], vibe: 'diseased and rotting' },
  { name: 'Shadow Eclipse', colors: ['void black', 'dark violet', 'blood red'], vibe: 'cosmic darkness' },
  { name: 'Bone Horror', colors: ['bleached white', 'old ivory', 'death gray'], vibe: 'skeletal and ancient' },
  { name: 'Storm Fury', colors: ['storm gray', 'lightning blue', 'thunder black'], vibe: 'chaotic and electric' },
  { name: 'Magma Core', colors: ['lava orange', 'molten red', 'charcoal black'], vibe: 'volcanic and intense' },
  { name: 'Cursed Purple', colors: ['cursed purple', 'hex magenta', 'witch black'], vibe: 'hexed and magical' },
  { name: 'Rust Decay', colors: ['rust orange', 'corroded brown', 'metal gray'], vibe: 'mechanical decay' },
  { name: 'Venom Strike', colors: ['venom green', 'fang white', 'serpent black'], vibe: 'reptilian and deadly' },
  { name: 'Nightmare Mist', colors: ['dark fog', 'nightmare purple', 'terror black'], vibe: 'dreamlike horror' },
];

// 15 Monster Environments
const MONSTER_ENVIRONMENTS: MonsterEnvironment[] = [
  { name: 'Shadow Realm', description: 'dark dimension with floating shadow particles and void rifts' },
  { name: 'Corrupted Wasteland', description: 'desolate land with dead trees and toxic pools' },
  { name: 'Demon Gate', description: 'hellish portal with flames and demonic symbols' },
  { name: 'Cursed Graveyard', description: 'ancient cemetery with broken tombstones and dark mist' },
  { name: 'Void Dimension', description: 'endless black space with floating debris and dark energy' },
  { name: 'Toxic Swamp', description: 'poisonous marshland with glowing toxic waste and dead vegetation' },
  { name: 'Haunted Ruins', description: 'abandoned structures with spectral wisps and crumbling walls' },
  { name: 'Dark Laboratory', description: 'sinister facility with experiment chambers and dark machinery' },
  { name: 'Volcanic Inferno', description: 'lava-filled cavern with molten flows and burning rocks' },
  { name: 'Frozen Crypt', description: 'ice-covered tomb with frozen corpses and frost crystals' },
  { name: 'Abyssal Ocean', description: 'deep underwater trench with bioluminescent creatures and darkness' },
  { name: 'Storm Abyss', description: 'chaotic sky dimension with lightning storms and dark clouds' },
  { name: 'Mechanical Graveyard', description: 'wasteland of broken machines and corrupted technology' },
  { name: 'Blood Cathedral', description: 'gothic church with blood-stained walls and dark altars' },
  { name: 'Nightmare Forest', description: 'twisted woods with grotesque trees and haunting shadows' },
];

// 20 Monster Types with Unique Abilities and Elements
const MONSTER_TYPES: MonsterType[] = [
  // Undead Monsters (Dark Element)
  {
    name: 'Shadow Reaper',
    description: 'death incarnate wielding dark energy',
    abilities: 'life drain, shadow step, death touch',
    appearance: 'skeletal figure in tattered black robes with glowing eyes',
    accessories: 'floating scythe, dark aura, soul chains',
    element: 'Dark',
  },
  {
    name: 'Bone Colossus',
    description: 'massive undead construct',
    abilities: 'crushing strength, bone armor, intimidation',
    appearance: 'giant skeleton made of multiple corpses fused together',
    accessories: 'bone clubs, skull ornaments, rib cage armor',
    element: 'Dark',
  },
  {
    name: 'Phantom Assassin',
    description: 'ghostly killer from beyond',
    abilities: 'ethereal form, poison blade, fear aura',
    appearance: 'translucent specter with spectral daggers',
    accessories: 'phantom blades, ghostly chains, death mark',
    element: 'Dark',
  },

  // Demonic Monsters (Fire Element)
  {
    name: 'Inferno Demon',
    description: 'hellfire embodiment',
    abilities: 'flame burst, lava pools, burning touch',
    appearance: 'horned demon wreathed in flames with molten skin',
    accessories: 'flame sword, demonic wings, hellfire orb',
    element: 'Fire',
  },
  {
    name: 'Void Stalker',
    description: 'creature from the dark dimension',
    abilities: 'void blast, reality tear, dark binding',
    appearance: 'shadowy being with multiple glowing eyes and tendrils',
    accessories: 'void tentacles, dark portals, reality cracks',
    element: 'Dark',
  },
  {
    name: 'Chaos Imp',
    description: 'mischievous chaos entity',
    abilities: 'random spells, confusion, teleportation',
    appearance: 'small demon with twisted horns and chaotic energy',
    accessories: 'chaos orb, spell scrolls, magical corruption',
    element: 'Chaos',
  },

  // Corrupted Beasts (Poison Element)
  {
    name: 'Plague Beast',
    description: 'diseased monstrosity',
    abilities: 'toxic breath, disease spread, acid spit',
    appearance: 'mutated creature with rotting flesh and exposed bones',
    accessories: 'toxic clouds, disease aura, pustule burst',
    element: 'Poison',
  },
  {
    name: 'Corrupted Dragon',
    description: 'fallen dragon consumed by darkness',
    abilities: 'shadow breath, wing storm, tail swipe',
    appearance: 'skeletal dragon with dark energy replacing flesh',
    accessories: 'shadow flames, corrupted scales, dark wings',
    element: 'Dark',
  },
  {
    name: 'Dire Wolf',
    description: 'massive predatory wolf',
    abilities: 'pack tactics, feral rage, howl of fear',
    appearance: 'oversized wolf with glowing red eyes and dark fur',
    accessories: 'blood-stained fangs, spiked collar, shadow aura',
    element: 'Nature',
  },

  // Elemental Horrors
  {
    name: 'Storm Wraith',
    description: 'living lightning entity',
    abilities: 'chain lightning, thunder strike, storm call',
    appearance: 'electrical being made of crackling energy and clouds',
    accessories: 'lightning bolts, storm clouds, electric arcs',
    element: 'Lightning',
  },
  {
    name: 'Magma Golem',
    description: 'volcanic stone construct',
    abilities: 'lava fists, earthquake, molten armor',
    appearance: 'massive stone giant with molten cracks and lava veins',
    accessories: 'lava pools, rock armor, molten core',
    element: 'Fire',
  },
  {
    name: 'Frost Fiend',
    description: 'creature of eternal winter',
    abilities: 'ice spike, freeze aura, blizzard',
    appearance: 'humanoid ice monster with frozen spikes and icy breath',
    accessories: 'ice shards, frost armor, frozen chains',
    element: 'Ice',
  },

  // Aberrations (Chaos Element)
  {
    name: 'Tentacle Horror',
    description: 'eldritch abomination',
    abilities: 'tentacle grab, mental assault, corruption',
    appearance: 'mass of writhing tentacles with multiple eyes',
    accessories: 'grabbing tentacles, slime trails, eldritch symbols',
    element: 'Chaos',
  },
  {
    name: 'Flesh Amalgam',
    description: 'grotesque fusion of body parts',
    abilities: 'regeneration, mutate, absorb',
    appearance: 'disturbing combination of various creatures melded together',
    accessories: 'extra limbs, multiple heads, organic weapons',
    element: 'Chaos',
  },
  {
    name: 'Eye Tyrant',
    description: 'floating sphere of eyes',
    abilities: 'eye rays, levitation, anti-magic cone',
    appearance: 'large floating eye with smaller eyes on stalks',
    accessories: 'eye beams, magical aura, floating debris',
    element: 'Arcane',
  },

  // Mechanical Monsters (Metal Element)
  {
    name: 'War Machine',
    description: 'corrupted military automaton',
    abilities: 'missile barrage, laser cannon, armor plating',
    appearance: 'heavily armed robot with glowing red sensors',
    accessories: 'weapon arrays, armor plates, targeting systems',
    element: 'Metal',
  },
  {
    name: 'Nano Swarm',
    description: 'collective of hostile nanobots',
    abilities: 'swarm attack, disassemble, replicate',
    appearance: 'cloud of metallic particles forming a vague shape',
    accessories: 'particle effects, digital corruption, tech tendrils',
    element: 'Metal',
  },

  // Mythical Horrors
  {
    name: 'Gorgon Medusa',
    description: 'serpent-haired nightmare',
    abilities: 'petrifying gaze, snake strike, poison bite',
    appearance: 'humanoid with serpents for hair and scaled skin',
    accessories: 'snake crown, stone victims, venomous fangs',
    element: 'Poison',
  },
  {
    name: 'Minotaur Berserker',
    description: 'monstrous bull warrior',
    abilities: 'charge attack, axe cleave, rage mode',
    appearance: 'massive bull-headed humanoid with battle scars',
    accessories: 'giant axe, arena chains, blood stains',
    element: 'Nature',
  },
  {
    name: 'Vampire Lord',
    description: 'ancient blood drinker',
    abilities: 'blood drain, bat swarm, hypnosis',
    appearance: 'elegant pale figure with fangs and crimson eyes',
    accessories: 'blood chalice, bat wings, dark cape',
    element: 'Dark',
  },
];

// 5 Monster Rarities
const MONSTER_RARITIES: MonsterRarity[] = [
  { name: 'Common', power: 'basic threat level' },
  { name: 'Uncommon', power: 'enhanced abilities' },
  { name: 'Rare', power: 'dangerous and powerful' },
  { name: 'Epic', power: 'extremely formidable' },
  { name: 'Legendary', power: 'world-ending threat' },
];

// Art Style for Monsters - Anime Emphasis
const MONSTER_ART_STYLES = [
  { name: 'Dark Fantasy Anime', description: 'detailed anime monster design with dark aesthetic, sharp anime linework, dynamic anime shading' },
  { name: 'Horror Anime', description: 'scary anime style with grotesque details, anime character design with horror elements' },
  { name: 'Demon Slayer Style', description: 'high-quality anime monster in Demon Slayer aesthetic, anime art style with detailed features' },
  { name: 'Attack on Titan Style', description: 'terrifying anime monster inspired by Titans, anime character art with dramatic lighting' },
  { name: 'Dark Souls Anime', description: 'souls-like boss design in anime style, anime monster illustration with epic atmosphere' },
];

// Export type for MonsterAttributes
export type MonsterAttributes = {
  type: string;
  rarity: string;
  element: string;
  powerLevel: number;
  level: number;
  palette: MonsterPalette;
  monsterType: MonsterType;
  environment: MonsterEnvironment;
  artStyle: { name: string; description: string };
};

/**
 * Generate deterministic monster attributes based on monster ID
 * Different seed than characters to ensure variety
 */
export function generateMonsterAttributes(monsterId: number): MonsterAttributes {
  // Use different offsets to avoid collision with character generation
  const palette = MONSTER_PALETTES[(monsterId * 7) % MONSTER_PALETTES.length];
  const monsterType = MONSTER_TYPES[(monsterId * 3) % MONSTER_TYPES.length];
  const environment = MONSTER_ENVIRONMENTS[(monsterId * 5) % MONSTER_ENVIRONMENTS.length];
  const rarity = MONSTER_RARITIES[(monsterId * 11) % MONSTER_RARITIES.length];
  const artStyle = MONSTER_ART_STYLES[(monsterId * 13) % MONSTER_ART_STYLES.length];
  const level = 1;
  const powerLevel = getMonsterPowerLevel(monsterId, level);

  return {
    type: monsterType.name,
    rarity: rarity.name,
    element: monsterType.element,
    powerLevel,
    level,
    palette,
    monsterType,
    environment,
    artStyle,
  };
}

/**
 * Generate monster NFT prompt for AI generation
 * Dark, intimidating style for opponents
 */
export function generateMonsterPrompt(attributes: MonsterAttributes): string {
  const { palette, monsterType, environment, artStyle } = attributes;
  const rarity = { name: attributes.rarity, power: '' };

  const prompt = `
Professional dark anime character design of a ${monsterType.name} monster in high-quality anime art style.

MONSTER DETAILS:
- Type: ${monsterType.name} (${monsterType.description})
- Element: ${monsterType.element}
- Rarity: ${rarity.name} (${rarity.power})
- Abilities: ${monsterType.abilities}
- Appearance: ${monsterType.appearance}
- Accessories: ${monsterType.accessories}
- Expression: Menacing, terrifying, hostile look

COLOR SCHEME (${palette.name}):
Primary colors: ${palette.colors.join(', ')}
Vibe: ${palette.vibe}
Apply colors to monster body, effects, and environment

ENVIRONMENT:
${environment.name} - ${environment.description}
Background should be dark and atmospheric, enhancing monster's threat

ART STYLE:
${artStyle.name} - ${artStyle.description}

VISUAL REQUIREMENTS (ANIME STYLE):
- High-quality anime character design with professional anime linework
- Dark, ominous atmosphere with visible details in anime style
- Monster centered in menacing composition, anime character portrait
- Detailed anime art style with sharp lines and clean shading
- Dark but not completely black - maintain visibility of anime features
- Professional anime shading with dramatic lighting and highlights
- Accessories and effects should be prominent and threatening in anime style
- Colors match the ${palette.name} palette with anime color application
- Background reinforces monster's dangerous nature in anime aesthetic
- Clear details on anime-style monster features and expressions
- Japanese anime/manga aesthetic with horror elements
- ${monsterType.element} elemental effects visible in anime style (${monsterType.element} energy, aura, or attacks)
- Anime character illustration quality - NOT realistic, NOT 3D, pure 2D anime art

AVOID:
- Cute or friendly appearance
- Bright cheerful colors
- Heroic or noble poses
- Overly simplified design
- Low-quality art
- Blurred or unclear monster features
- Comical or silly appearance
- Realistic or photographic style
- 3D rendering or CGI look
- Western cartoon style

Focus on creating a threatening, powerful ${monsterType.element} element anime monster in Japanese anime/manga art style that serves as a worthy opponent for FrameFusion heroes.
`.trim();

  return prompt;
}

/**
 * Get monster preview text for UI
 */
export function getMonsterPreview(monsterId: number): string {
  const { monsterType, rarity, palette, element } = generateMonsterAttributes(monsterId);
  
  return `${rarity.name} ${monsterType.name} • ${element} • ${palette.name}`;
}

/**
 * Calculate monster power level for battle system
 * Takes into account rarity, level, and variance
 */
export function getMonsterPowerLevel(monsterId: number, level: number = 1): number {
  // Calculate rarity directly without calling generateMonsterAttributes to avoid circular dependency
  const rarityIndex = (monsterId * 11) % MONSTER_RARITIES.length;
  const rarity = MONSTER_RARITIES[rarityIndex];
  
  const basePower: Record<string, number> = {
    'Common': 100,
    'Uncommon': 200,
    'Rare': 400,
    'Epic': 800,
    'Legendary': 1600,
  };
  
  // Add some variance based on monsterId
  const variance = (monsterId % 50) - 25; // ±25 power
  
  // Level multiplier: each level adds 10% to base power
  const levelMultiplier = 1 + ((level - 1) * 0.1);
  
  return Math.floor((basePower[rarity.name] + variance) * levelMultiplier);
}
