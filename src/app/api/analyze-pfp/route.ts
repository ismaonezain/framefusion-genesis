import { NextRequest, NextResponse } from 'next/server';

type AnalysisResult = {
  dominantColors: string[];
  colorPalette: string;
  style: string;
  accessories: string[];
  vibe: string;
  mmorpgClass: string;
  gender: string;
  prompt: string;
};

/**
 * Generate personalized anime MMORPG character attributes based on FID
 * Uses deterministic randomization so each user gets consistent unique attributes
 */
function generatePersonalizedAttributes(fid: number): Omit<AnalysisResult, 'prompt'> {
  // Seed random with FID for consistency
  const seed = fid;
  
  // Color palettes - more cinematic and refined
  const colorPalettes = [
    { colors: ['deep crimson', 'dark gold', 'burgundy'], palette: 'dramatic warm tones', vibe: 'intense' },
    { colors: ['midnight blue', 'silver', 'slate gray'], palette: 'cool cinematic', vibe: 'stoic' },
    { colors: ['deep purple', 'violet', 'dark rose'], palette: 'mystical elegance', vibe: 'enigmatic' },
    { colors: ['forest green', 'olive', 'earth brown'], palette: 'natural depth', vibe: 'grounded' },
    { colors: ['charcoal', 'steel blue', 'ash gray'], palette: 'monochromatic dramatic', vibe: 'serious' },
    { colors: ['navy blue', 'bronze', 'cream'], palette: 'refined classic', vibe: 'noble' },
    { colors: ['indigo', 'deep teal', 'sapphire'], palette: 'oceanic depth', vibe: 'mysterious' },
    { colors: ['burnt orange', 'copper', 'terracotta'], palette: 'warm cinematic', vibe: 'passionate' },
    { colors: ['jade', 'emerald', 'seafoam'], palette: 'elegant cool', vibe: 'serene' },
    { colors: ['plum', 'mauve', 'dusty rose'], palette: 'soft dramatic', vibe: 'graceful' },
  ];

  // MMORPG classes with cinematic accessories
  const classes = [
    { name: 'Swordmaster', accessories: ['ornate longsword', 'battle-worn armor', 'leather straps'] },
    { name: 'Spellblade', accessories: ['enchanted blade', 'magic-infused coat', 'arcane jewelry'] },
    { name: 'Shadow Assassin', accessories: ['elegant daggers', 'tactical gear', 'hooded cloak'] },
    { name: 'Holy Knight', accessories: ['blessed sword', 'ceremonial armor', 'sacred emblem'] },
    { name: 'Ranger', accessories: ['refined bow', 'leather armor', 'tactical cloak'] },
    { name: 'Battle Mage', accessories: ['combat staff', 'armored robes', 'grimoire'] },
    { name: 'Berserker', accessories: ['great axe', 'tribal armor', 'war paint'] },
    { name: 'Summoner', accessories: ['ritual blade', 'mystical coat', 'spirit charm'] },
    { name: 'Blade Dancer', accessories: ['twin katanas', 'flowing garments', 'ornate mask'] },
    { name: 'Druid Warrior', accessories: ['nature-forged weapon', 'organic armor', 'elemental runes'] },
  ];

  // Gender options
  const genders = ['male', 'female'];

  // Art styles - more cinematic
  const styles = [
    'cinematic anime',
    'high-budget anime production',
    'theatrical anime',
    'cinematic JRPG',
    'anime movie quality',
  ];

  // Use FID to consistently select attributes
  const colorIndex = seed % colorPalettes.length;
  const classIndex = Math.floor(seed / 10) % classes.length;
  const styleIndex = Math.floor(seed / 100) % styles.length;
  const genderIndex = Math.floor(seed / 50) % genders.length;

  const selectedColor = colorPalettes[colorIndex];
  const selectedClass = classes[classIndex];
  const selectedStyle = styles[styleIndex];
  const selectedGender = genders[genderIndex];

  return {
    dominantColors: selectedColor.colors,
    colorPalette: selectedColor.palette,
    style: selectedStyle,
    accessories: selectedClass.accessories,
    vibe: selectedColor.vibe,
    mmorpgClass: selectedClass.name,
    gender: selectedGender,
  };
}

/**
 * Generate personalized cinematic anime MMORPG character prompt
 * No external API needed - uses FID-based deterministic generation
 */
export async function POST(request: NextRequest) {
  try {
    const { pfpUrl, username, fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    console.log('[Analyze PFP] Generating personalized attributes for:', username, fid);

    // Generate personalized attributes based on FID
    const analysis = generatePersonalizedAttributes(fid)

    // Generate cinematic anime MMORPG character prompt
    const colorDescription = analysis.dominantColors && analysis.dominantColors.length > 0
      ? `featuring ${analysis.dominantColors.join(', ')}`
      : 'with refined colors';

    const accessoryDescription = analysis.accessories && analysis.accessories.length > 0
      ? `equipped with ${analysis.accessories.join(', ')}`
      : 'with distinctive gear';

    const personalizedPrompt = `Create a cinematic anime character portrait for ${username || `user ${fid}`}'s avatar.

CHARACTER: ${analysis.gender} ${analysis.mmorpgClass || 'warrior'} with ${analysis.vibe || 'powerful'} presence

COLOR PALETTE: ${colorDescription}, maintaining ${analysis.colorPalette || 'dramatic'} tones throughout the composition

EQUIPMENT: ${accessoryDescription}, styled for a ${analysis.style || 'cinematic anime'} aesthetic

VISUAL STYLE:
- High-quality ${analysis.style || 'cinematic anime'} art direction
- Theatrical lighting with dramatic shadows and highlights
- Professional anime production quality
- Movie poster composition
- Refined character design without excessive effects
- Subtle atmospheric depth

CHARACTER DETAILS:
- Detailed facial features with expressive eyes
- Realistic fabric and material textures
- Natural pose with confident stance
- Clean composition with cinematic framing
- Minimal but elegant FrameFusion branding overlay (subtle UI elements)
- Professional fantasy character art quality

ATMOSPHERE:
- Cinematic depth of field
- Refined color grading matching the palette
- Clean background with subtle environmental hints
- Portrait orientation, gallery-quality NFT artwork
- Sophisticated and memorable design

The character should feel like a hero from a high-budget anime production or premium JRPG, with refined aesthetics and cinematic presentation. Avoid overly bright glowing effects or excessive magical auras - keep it sophisticated and dramatic.`;

    const result: AnalysisResult = {
      dominantColors: analysis.dominantColors || [],
      colorPalette: analysis.colorPalette || 'dramatic',
      style: analysis.style || 'cinematic anime',
      accessories: analysis.accessories || [],
      vibe: analysis.vibe || 'intense',
      mmorpgClass: analysis.mmorpgClass || 'Swordmaster',
      gender: analysis.gender || 'male',
      prompt: personalizedPrompt,
    };

    console.log('[Analyze PFP] Generated cinematic prompt preview:', personalizedPrompt.substring(0, 200) + '...');

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Analyze PFP] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze PFP' },
      { status: 500 }
    );
  }
}
