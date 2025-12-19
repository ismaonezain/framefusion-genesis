# Weapon Image Generation Guide

## Overview

This guide explains how to generate 80 unique weapon images (20 weapon types × 4 rarity tiers) using the Flux image generation connection.

---

## Image Requirements

**Total Images Needed:** 80
- 20 weapon types (matching FrameFusion character classes)
- 4 rarity tiers per weapon type (Common, Rare, Epic, Legendary)

**Specifications:**
- Format: PNG with transparency
- Aspect ratio: 1:1 (square)
- Resolution: High quality (Flux default)
- Style: Fantasy RPG, consistent across all weapons

---

## Weapon Types & Visual Descriptions

### 1. Swordmaster - Twin Legendary Blades
**Description:** Dual elegant longswords with ornate hilts
- **Common:** Simple steel dual blades with basic leather grips
- **Rare:** Silver blades with blue gemstone pommels, slight glow
- **Epic:** Purple-tinted blades with intricate runes, moderate glow
- **Legendary:** Golden blades with amber crystals, radiant aura

### 2. Shadow Assassin - Obsidian Daggers
**Description:** Dark, razor-sharp dual daggers
- **Common:** Matte black iron daggers with cloth-wrapped handles
- **Rare:** Obsidian daggers with silver accents, faint dark mist
- **Epic:** Purple-black daggers with shadow energy wisps
- **Legendary:** Jet black daggers with golden runes, intense shadow aura

### 3. Holy Knight - Blessed Longsword
**Description:** Divine greatsword with holy aura
- **Common:** Steel longsword with simple cross guard
- **Rare:** Silver blade with light blue glow, cross-shaped pommel
- **Epic:** Platinum blade with purple holy energy, ornate guard
- **Legendary:** Golden divine blade with amber radiance, angelic wings guard

### 4. Battle Mage - Enchanted Staff-Sword
**Description:** Hybrid weapon combining staff and blade
- **Common:** Wooden staff with basic iron blade attachment
- **Rare:** Oak staff with glowing blue blade, silver runes
- **Epic:** Dark wood staff with purple arcane blade, crystal core
- **Legendary:** Ancient staff with golden radiant blade, floating runes

### 5. Archer Ranger - Composite Bow
**Description:** Elegant recurve bow with mystical string
- **Common:** Simple wooden bow with basic string
- **Rare:** Reinforced ash bow with blue energy string, silver tips
- **Epic:** Dark composite bow with purple arcane string, gemstones
- **Legendary:** Ornate golden bow with amber energy string, ethereal arrows

### 6. Tech Hacker - Holographic Terminal
**Description:** Futuristic holographic device with screens
- **Common:** Basic grey tablet with simple blue interface
- **Rare:** Sleek black device with cyan holograms, animated screens
- **Epic:** Purple neon device with multiple floating displays
- **Legendary:** Golden quantum terminal with amber holograms, circuit patterns

### 7. Street Fighter - Combat Gloves
**Description:** Reinforced fighting gloves
- **Common:** Grey leather boxing gloves with basic stitching
- **Rare:** Black tactical gloves with blue energy nodes, metal knuckles
- **Epic:** Purple combat gloves with arcane circuits, energy cores
- **Legendary:** Golden armored gloves with amber power cells, force field

### 8. Musician Bard - Electric Guitar
**Description:** Magical electric guitar radiating sound energy
- **Common:** Simple black guitar with basic strings
- **Rare:** Blue glowing guitar with silver strings, sound waves
- **Epic:** Purple arcane guitar with magical runes, energy strings
- **Legendary:** Golden celestial guitar with amber sound aura, light trails

### 9. Chef Artisan - Chef's Knife Set
**Description:** Professional culinary knives in a set
- **Common:** Basic steel knives with wooden handles
- **Rare:** Silver chef knives with blue edge glow, elegant handles
- **Epic:** Purple Damascus steel knives with magical patterns
- **Legendary:** Golden master knives with amber enchantments, perfect edge

### 10. Photographer Scout - Pro Camera
**Description:** Advanced camera with mystical lens
- **Common:** Grey DSLR camera with standard lens
- **Rare:** Black pro camera with blue glowing lens, light effects
- **Epic:** Purple arcane camera with magical lens flare, runes
- **Legendary:** Golden divine camera with amber light capture, ethereal frames

### 11. Gunslinger - Dual Pistols
**Description:** Western-style revolvers
- **Common:** Basic grey steel revolvers with wood grips
- **Rare:** Silver revolvers with blue energy chambers, engravings
- **Epic:** Purple revolvers with arcane bullets, magical cylinders
- **Legendary:** Golden revolvers with amber energy cores, light trails

### 12. Medic Healer - Medical Kit
**Description:** Mystical medical bag with healing aura
- **Common:** Basic grey first-aid bag with red cross
- **Rare:** White medical kit with blue healing glow, crystal vials
- **Epic:** Purple healer's case with magical herbs, floating potions
- **Legendary:** Golden divine kit with amber restoration aura, angelic symbols

### 13. Engineer Builder - High-Tech Toolkit
**Description:** Futuristic engineering toolbox
- **Common:** Grey metal toolbox with basic wrenches and screwdrivers
- **Rare:** Black tech case with blue energy tools, holographic displays
- **Epic:** Purple nanotech toolkit with arcane devices, floating parts
- **Legendary:** Golden quantum toolkit with amber power cores, advanced gadgets

### 14. Detective Investigator - Magnifying Glass
**Description:** Mystical magnifying glass revealing truth
- **Common:** Simple glass lens with wooden handle
- **Rare:** Silver magnifying glass with blue truth-revealing glow
- **Epic:** Purple detective lens with arcane insight runes, vision trails
- **Legendary:** Golden divine lens with amber revelation aura, omniscient eye

### 15. Athlete Champion - Sports Equipment
**Description:** Enchanted athletic gear
- **Common:** Basic grey dumbbells and sports gear
- **Rare:** Blue energy-infused athletic equipment, silver accents
- **Epic:** Purple power gear with magical strength aura, crystals
- **Legendary:** Golden champion equipment with amber victory radiance

### 16. Beast Tamer - Summoning Orb
**Description:** Crystal sphere for summoning creatures
- **Common:** Simple grey stone orb with basic texture
- **Rare:** Blue crystal orb with swirling mist, creature silhouettes
- **Epic:** Purple arcane orb with beast runes, floating energy
- **Legendary:** Golden divine orb with amber creature aura, dragon essence

### 17. Alchemist Sage - Alchemy Vials
**Description:** Set of potion bottles with mystical liquids
- **Common:** Basic glass vials with grey potions
- **Rare:** Blue glowing vials with magical liquids, silver caps
- **Epic:** Purple alchemical flasks with arcane substances, floating drops
- **Legendary:** Golden master vials with amber elixirs, transformation aura

### 18. Samurai Duelist - Katana Blade
**Description:** Traditional katana with mystical edge
- **Common:** Basic steel katana with simple wrap
- **Rare:** Silver katana with blue edge glow, ornate tsuba
- **Epic:** Purple spirit katana with arcane waves, dragon engravings
- **Legendary:** Golden legendary katana with amber soul energy, phoenix motif

### 19. Ninja Operative - Kunai Set
**Description:** Throwing knives with shadow energy
- **Common:** Basic grey kunai knives with cloth tags
- **Rare:** Silver kunai with blue stealth glow, shadow trails
- **Epic:** Purple ninja kunai with arcane smoke, magical seals
- **Legendary:** Golden master kunai with amber shadow aura, spirit tags

### 20. Dragon Knight - Flame Spear
**Description:** Dragon-themed spear with fire energy
- **Common:** Basic iron spear with simple dragon head
- **Rare:** Silver spear with blue flame, dragon scale details
- **Epic:** Purple dragon spear with arcane fire, glowing scales
- **Legendary:** Golden legendary spear with amber inferno, dragon soul

---

## Flux Generation Workflow

### Using Flux API (fluxpro-api.ts)

```typescript
import { 
  fluxproSubmit, 
  fluxproPollStatus, 
  fluxproFetchImages 
} from '@/src/fluxpro-api';

// Generate weapon image
async function generateWeaponImage(
  weaponType: string,
  rarity: string,
  description: string
) {
  // 1. Submit generation request
  const requestId = await fluxproSubmit({
    prompt: `${description}, isolated on transparent background, fantasy RPG item icon, ${rarity} tier quality, professional game asset, centered composition, high detail`,
    aspect_ratio: '1:1',
    num_images: 1,
    output_format: 'png',
    safety_tolerance: '3'
  });

  // 2. Wait for completion
  await fluxproPollStatus(requestId);

  // 3. Fetch result
  const images = await fluxproFetchImages(requestId);
  
  return images[0].url; // Return first image URL
}

// Example usage
const url = await generateWeaponImage(
  'Twin Legendary Blades',
  'Legendary',
  'Golden blades with amber crystals, radiant aura, dual elegant longswords'
);
```

---

## Batch Generation Script

Create `scripts/generate-weapon-images.ts`:

```typescript
import { fluxproSubmit, fluxproPollStatus, fluxproFetchImages } from '@/src/fluxpro-api';
import { pinataUploadImageWithMetadata } from '@/src/pinata-media-api';

const WEAPON_PROMPTS = [
  // Array of 80 prompts (weapon type + rarity combinations)
  {
    weaponClass: 0,
    weaponType: 'Twin Legendary Blades',
    rarity: 0, // Common
    prompt: 'Simple steel dual blades with basic leather grips...'
  },
  // ... (79 more entries)
];

async function generateAllWeaponImages() {
  for (const weapon of WEAPON_PROMPTS) {
    console.log(`Generating: ${weapon.weaponType} (${weapon.rarity})...`);
    
    try {
      // 1. Generate image with Flux
      const requestId = await fluxproSubmit({
        prompt: `${weapon.prompt}, isolated on transparent background, fantasy RPG item icon, professional game asset, centered, high detail`,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'png',
      });
      
      await fluxproPollStatus(requestId);
      const images = await fluxproFetchImages(requestId);
      
      // 2. Upload to Pinata
      const result = await pinataUploadImageWithMetadata({
        image: images[0].url,
        filename: `weapon-${weapon.weaponClass}-${weapon.rarity}.png`,
        metadata: {
          name: weapon.weaponType,
          description: `${weapon.weaponType} weapon asset`,
          attributes: [
            { trait_type: 'Class', value: weapon.weaponClass },
            { trait_type: 'Rarity', value: weapon.rarity }
          ]
        }
      });
      
      console.log(`✅ ${weapon.weaponType}: ${result.image.pin.gatewayUrl}`);
      
      // Save URL mapping for database
      // TODO: Store in database or JSON file
      
    } catch (error) {
      console.error(`❌ Failed: ${weapon.weaponType}`, error);
    }
    
    // Rate limit delay (5 seconds between generations)
    await new Promise(r => setTimeout(r, 5000));
  }
}

generateAllWeaponImages();
```

---

## Estimated Time & Cost

**Time Estimate:**
- Flux generation: ~30 seconds per image
- Pinata upload: ~5 seconds per image
- **Total per image:** ~35 seconds
- **Total for 80 images:** ~47 minutes (with rate limiting)

**Storage:**
- Pinata: Unlimited uploads (included in connection)
- Each image: ~500KB-1MB
- Total storage: ~40-80MB

---

## Manual Generation Alternative

If batch generation fails, generate manually:

1. Open your app's built-in Flux interface
2. Use the prompts from the descriptions above
3. Download each generated image
4. Upload to Pinata via UI
5. Record IPFS URLs in a spreadsheet
6. Update database with image URLs

---

## After Generation

Once all images are generated and uploaded:

1. **Update Database:** Insert image URLs into `weapons` table
2. **Test Metadata:** Verify `/api/weapons/metadata/[tokenId]` returns correct images
3. **OpenSea Refresh:** Trigger metadata refresh on OpenSea
4. **Document URLs:** Keep a mapping file of weapon class/rarity → image URL

---

## Example Weapon Naming Convention

**Database Storage:**
- `weapon_type`: "Twin Legendary Blades"
- `token_id`: 1234

**Display Name:**
- Frontend: "Twin Legendary Blades #1234"
- OpenSea: "Twin Legendary Blades #1234"
- Metadata: `name: "Twin Legendary Blades #1234"`

---

## Tips for Best Results

1. **Consistency:** Use similar prompt structure for all rarities of same weapon
2. **Background:** Always specify "transparent background" or "isolated on white"
3. **Style:** Maintain "fantasy RPG item icon" style across all weapons
4. **Rarity Indicators:**
   - Common: Simple, grey tones
   - Rare: Blue glow effects
   - Epic: Purple arcane energy
   - Legendary: Golden radiance, intense aura

5. **Retry Failed Generations:** If Flux produces low-quality result, regenerate with adjusted prompt

---

## Next Steps

Ready to start generation? Follow this order:

1. ✅ Test generate 1 weapon (all 4 rarities) to verify prompts
2. ✅ If satisfied, run batch generation script
3. ✅ Upload all images to Pinata
4. ✅ Update weapon contract with correct image URLs
5. ✅ Test minting a weapon to verify image appears correctly
6. ✅ Deploy to production

Let me know when you're ready to generate the images! 🎨
