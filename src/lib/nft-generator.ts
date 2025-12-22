/**
 * NFT Generator with FID-based Personalization
 * Clean Anime Style with Clear Backgrounds and Defined Accessories
 * Can be male or female characters
 * Classes include both RPG and real-life occupations
 * Items/weapons can be fantasy or everyday objects
 */

type ColorPalette = {
  name: string;
  colors: string[];
  vibe: string;
};

type CharacterClass = {
  name: string;
  description: string;
  items: string; // Can be fantasy weapons or everyday objects
  clothing: string; // Specific clothing type
  accessories: string; // Wings, aura, floating objects, etc.
};

type BackgroundSetting = {
  name: string;
  description: string;
};

type ArtStyle = {
  name: string;
  description: string;
};

// 15 Color Palettes - Deep, Sophisticated
const COLOR_PALETTES: ColorPalette[] = [
  { name: 'Crimson Abyss', colors: ['deep crimson', 'dark gold', 'burgundy'], vibe: 'dramatic and fierce' },
  { name: 'Azure Depths', colors: ['midnight blue', 'steel cyan', 'silver gray'], vibe: 'cool and mysterious' },
  { name: 'Violet Dream', colors: ['deep purple', 'dark magenta', 'midnight pink'], vibe: 'mystical and elegant' },
  { name: 'Emerald Forest', colors: ['forest green', 'dark olive', 'bronze gold'], vibe: 'natural and grounded' },
  { name: 'Shadow Eclipse', colors: ['jet black', 'blood red', 'pearl white'], vibe: 'dark and dramatic' },
  { name: 'Royal Dawn', colors: ['royal blue', 'burnished gold', 'ivory white'], vibe: 'noble and heroic' },
  { name: 'Cosmic Nebula', colors: ['deep violet', 'dark indigo', 'electric cyan'], vibe: 'ethereal and cosmic' },
  { name: 'Inferno Blaze', colors: ['burnt orange', 'deep red', 'golden amber'], vibe: 'passionate and intense' },
  { name: 'Ocean Abyss', colors: ['deep teal', 'dark turquoise', 'navy blue'], vibe: 'serene and deep' },
  { name: 'Rose Twilight', colors: ['dusty rose', 'mauve pink', 'champagne gold'], vibe: 'elegant and refined' },
  { name: 'Storm Surge', colors: ['charcoal gray', 'electric blue', 'silver white'], vibe: 'powerful and dynamic' },
  { name: 'Autumn Dusk', colors: ['rust orange', 'deep brown', 'golden ochre'], vibe: 'warm and nostalgic' },
  { name: 'Cyber Neon', colors: ['neon pink', 'electric blue', 'deep black'], vibe: 'futuristic and edgy' },
  { name: 'Winter Frost', colors: ['ice blue', 'silver white', 'pale lavender'], vibe: 'cold and pristine' },
  { name: 'Desert Mirage', colors: ['sand gold', 'terracotta', 'deep orange'], vibe: 'exotic and adventurous' },
];

// 15 Clear Background Settings
const BACKGROUND_SETTINGS: BackgroundSetting[] = [
  { name: 'Crystal Palace', description: 'grand crystalline hall with pillars and floating light orbs' },
  { name: 'Sky Fortress', description: 'floating castle platform above clouds with clear blue sky' },
  { name: 'Mystic Forest', description: 'enchanted forest with glowing trees and visible foliage' },
  { name: 'Cyberpunk City', description: 'futuristic city streets with neon signs and buildings' },
  { name: 'Desert Temple', description: 'ancient sandstone temple ruins under bright sun' },
  { name: 'Ocean Shrine', description: 'underwater temple with coral and visible water' },
  { name: 'Mountain Peak', description: 'snowy mountain summit with clear sky and distant peaks' },
  { name: 'Magical Academy', description: 'grand library hall with floating books and shelves' },
  { name: 'Urban Rooftop', description: 'modern city rooftop at sunset with skyline view' },
  { name: 'Battle Arena', description: 'stone colosseum with visible architecture and seating' },
  { name: 'Starry Dimension', description: 'cosmic space with visible stars, nebula, and galaxies' },
  { name: 'Cherry Blossom Garden', description: 'Japanese garden with blooming sakura trees and visible petals' },
  { name: 'Volcanic Cavern', description: 'lava cave with glowing magma streams and rock formations' },
  { name: 'Ice Castle', description: 'frozen palace interior with ice sculptures and crystals' },
  { name: 'Zen Dojo', description: 'traditional training hall with wooden floors and paper walls' },
];

// 20 Diverse Character Classes with Clothing & Accessories
const CHARACTER_CLASSES: CharacterClass[] = [
  // RPG Fantasy Classes
  { 
    name: 'Swordmaster', 
    description: 'elite dual-blade wielder', 
    items: 'legendary twin swords with ornate scabbards',
    clothing: 'armored jacket with leather straps and combat boots',
    accessories: 'floating sword aura and glowing blade trails'
  },
  { 
    name: 'Shadow Assassin', 
    description: 'stealth master in the shadows', 
    items: 'obsidian daggers and throwing knives',
    clothing: 'dark hooded cloak over fitted tactical suit',
    accessories: 'purple smoke wisps and shadow tendrils'
  },
  { 
    name: 'Holy Knight', 
    description: 'divine paladin of light', 
    items: 'blessed longsword and radiant shield',
    clothing: 'white armor with gold trim and cape',
    accessories: 'golden angel wings and holy light particles'
  },
  { 
    name: 'Battle Mage', 
    description: 'spellblade fusion warrior', 
    items: 'enchanted staff-sword hybrid and mystical tome',
    clothing: 'battle robes with armored plates and belt',
    accessories: 'orbiting magic circles and floating runes'
  },
  { 
    name: 'Archer Ranger', 
    description: 'precision marksman', 
    items: 'composite bow and quiver of enchanted arrows',
    clothing: 'forest green tunic with leather bracers and pants',
    accessories: 'wind aura and floating arrow trails'
  },
  
  // Modern/Real-Life Inspired (SAO-style mix)
  { 
    name: 'Tech Hacker', 
    description: 'digital warrior with virtual weapons', 
    items: 'holographic tablet and data gloves',
    clothing: 'cyber jacket with glowing circuit patterns and jeans',
    accessories: 'floating holographic screens and data streams'
  },
  { 
    name: 'Street Fighter', 
    description: 'hand-to-hand combat specialist', 
    items: 'fighting gloves and wrapped bandages',
    clothing: 'athletic tank top with cargo pants and sneakers',
    accessories: 'energy aura around fists and motion blur trails'
  },
  { 
    name: 'Musician Bard', 
    description: 'melody-wielding performer', 
    items: 'electric guitar and wireless headphones',
    clothing: 'stylish band jacket with graphic tee and ripped jeans',
    accessories: 'floating music notes and sound wave effects'
  },
  { 
    name: 'Chef Artisan', 
    description: 'culinary blade master', 
    items: 'professional chef knives and cooking tools',
    clothing: 'pristine white chef coat with apron and bandana',
    accessories: 'floating ingredient icons and steam wisps'
  },
  { 
    name: 'Photographer Scout', 
    description: 'reality-capturing observer', 
    items: 'professional camera and lens bag',
    clothing: 'utility vest over casual shirt with cargo pants',
    accessories: 'floating camera frames and light particles'
  },
  
  // Hybrid Classes
  { 
    name: 'Gunslinger', 
    description: 'modern firearms expert', 
    items: 'dual pistols with tactical holsters',
    clothing: 'long coat over tactical vest and combat pants',
    accessories: 'bullet trail effects and gunpowder smoke'
  },
  { 
    name: 'Medic Healer', 
    description: 'life-saving field doctor', 
    items: 'medical kit and healing potions',
    clothing: 'white medical coat with red cross emblem',
    accessories: 'green healing aura and floating medical symbols'
  },
  { 
    name: 'Engineer Builder', 
    description: 'mechanical genius', 
    items: 'high-tech tools and blueprint scrolls',
    clothing: 'work coveralls with tool belt and gloves',
    accessories: 'floating gear icons and mechanical parts'
  },
  { 
    name: 'Detective Investigator', 
    description: 'mystery-solving analyst', 
    items: 'magnifying glass and case files',
    clothing: 'trench coat over formal suit with fedora hat',
    accessories: 'floating clue markers and investigation notes'
  },
  { 
    name: 'Athlete Champion', 
    description: 'peak physical performer', 
    items: 'sports equipment and trophy',
    clothing: 'athletic jersey with track pants and sneakers',
    accessories: 'dynamic motion lines and energy sparks'
  },
  
  // More Fantasy
  { 
    name: 'Beast Tamer', 
    description: 'creature companion master', 
    items: 'summoning orb and beast whistle',
    clothing: 'tribal outfit with fur trim and nature accessories',
    accessories: 'spectral beast companion and nature spirits'
  },
  { 
    name: 'Alchemist Sage', 
    description: 'potion crafting expert', 
    items: 'alchemy vials and ingredient pouches',
    clothing: 'scholarly robes with belt of vials',
    accessories: 'floating potions and alchemical symbols'
  },
  { 
    name: 'Samurai Duelist', 
    description: 'honorable katana wielder', 
    items: 'katana sword in decorative sheath',
    clothing: 'traditional hakama with armored shoulder guards',
    accessories: 'cherry blossom petals and honor seal glyphs'
  },
  { 
    name: 'Ninja Operative', 
    description: 'covert operations specialist', 
    items: 'kunai knives and smoke pellets',
    clothing: 'black ninja outfit with mask and arm guards',
    accessories: 'shadow clones and ninja star trails'
  },
  { 
    name: 'Dragon Knight', 
    description: 'dragon-bonded warrior', 
    items: 'flame-etched spear and dragon emblem shield',
    clothing: 'dragon-scale armor with horned helmet',
    accessories: 'spectral dragon wings and fire particles'
  },
];

// 5 Clean Art Styles
const ART_STYLES: ArtStyle[] = [
  { name: 'Clean Anime Portrait', description: 'polished anime art with clear lines and vibrant colors' },
  { name: 'Modern Light Novel', description: 'commercial anime style with detailed character design' },
  { name: 'High-Quality Anime', description: 'studio-grade anime with refined shading and clean composition' },
  { name: 'SAO Character Style', description: 'Sword Art Online character design with modern anime aesthetics' },
  { name: 'Fantasy Anime Art', description: 'detailed fantasy anime with clear character focus' },
];

// Gender options
const GENDERS = ['male', 'female'];

/**
 * Generate deterministic attributes based on FID
 * Same FID = Same unique combination every time
 */
export function generateNFTAttributes(fid: number) {
  const colorPalette = COLOR_PALETTES[fid % COLOR_PALETTES.length];
  const characterClass = CHARACTER_CLASSES[fid % CHARACTER_CLASSES.length];
  const artStyle = ART_STYLES[fid % ART_STYLES.length];
  const background = BACKGROUND_SETTINGS[fid % BACKGROUND_SETTINGS.length];
  const gender = GENDERS[fid % GENDERS.length];

  return {
    colorPalette,
    characterClass,
    artStyle,
    background,
    gender,
  };
}

/**
 * Generate personalized NFT prompt for FluxPro AI
 * Clean anime style with clear backgrounds and defined accessories
 */
export function generateNFTPrompt(fid: number): string {
  const { colorPalette, characterClass, artStyle, background, gender } = generateNFTAttributes(fid);

  const prompt = `
Clean anime portrait of a ${gender} ${characterClass.name} character.

CHARACTER DETAILS:
- Gender: ${gender}
- Class: ${characterClass.name} (${characterClass.description})
- Items: ${characterClass.items}
- Clothing: ${characterClass.clothing}
- Accessories: ${characterClass.accessories}
- Expression: Confident, heroic, determined look

COLOR SCHEME (${colorPalette.name}):
Primary colors: ${colorPalette.colors.join(', ')}
Vibe: ${colorPalette.vibe}
Apply colors to clothing, accessories, and background elements

BACKGROUND:
${background.name} - ${background.description}
Background should be clearly visible and detailed, not blurred

ART STYLE:
${artStyle.name} - ${artStyle.description}

VISUAL REQUIREMENTS:
- Clear, sharp background with visible details
- Character centered in portrait composition
- Clean anime art style with crisp lines
- Vibrant but not oversaturated colors
- Professional shading and lighting
- Accessories should be clearly visible and prominent
- Clothing colors match the ${colorPalette.name} palette
- Background incorporates color scheme subtly
- No blur effects - everything sharp and clear
- Modern anime aesthetic

AVOID:
- Blurred or bokeh backgrounds
- Cinematic depth of field effects
- Overly dramatic lighting
- Excessive glowing or magical effects
- Motion blur or soft focus
- Messy or cluttered composition
- Low-quality anime style

Focus on creating a clean, polished anime character portrait with a clear, detailed background and prominent accessories.
`.trim();

  return prompt;
}

/**
 * Get character preview text for UI
 */
export function getCharacterPreview(fid: number): string {
  const { colorPalette, characterClass, gender } = generateNFTAttributes(fid);
  
  return `${gender.charAt(0).toUpperCase() + gender.slice(1)} ${characterClass.name} • ${colorPalette.name} • ${characterClass.items}`;
}
