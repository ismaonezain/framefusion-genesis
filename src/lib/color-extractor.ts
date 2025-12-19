/**
 * Color Extractor for PFP Analysis
 * Uses ColorThief to extract dominant colors from user's profile picture
 * This replaces OpenAI Vision API for color analysis
 */

import ColorThief from 'colorthief';

export type ExtractedColors = {
  dominantColor: string; // RGB string like "rgb(255, 128, 64)"
  palette: string[]; // Array of RGB strings
  colorNames: string[]; // Human-readable color names
};

/**
 * Extract dominant colors from image URL
 * Returns color palette for personalization
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Enable CORS
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        
        // Get dominant color [R, G, B]
        const dominantRgb = colorThief.getColor(img);
        const dominantColor = `rgb(${dominantRgb[0]}, ${dominantRgb[1]}, ${dominantRgb[2]})`;
        
        // Get color palette (5 colors)
        const paletteRgb = colorThief.getPalette(img, 5);
        const palette = paletteRgb.map((rgb: number[]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
        
        // Convert RGB to human-readable color names
        const colorNames = paletteRgb.map((rgb: number[]) => rgbToColorName(rgb));
        
        resolve({
          dominantColor,
          palette,
          colorNames,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Convert RGB to approximate color name
 * Simple color naming based on RGB values
 */
function rgbToColorName(rgb: number[]): string {
  const [r, g, b] = rgb;
  
  // Calculate brightness
  const brightness = (r + g + b) / 3;
  
  // Dark colors
  if (brightness < 50) {
    return 'black';
  }
  
  // Light colors
  if (brightness > 200) {
    if (r > 230 && g > 230 && b > 230) return 'white';
    if (r > g && r > b) return 'light pink';
    if (b > r && b > g) return 'light blue';
    return 'light gray';
  }
  
  // Determine dominant hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  // Gray (low saturation)
  if (diff < 30) {
    if (brightness < 100) return 'dark gray';
    return 'gray';
  }
  
  // Color hues
  if (r === max) {
    if (g > b) return 'orange';
    return 'red';
  } else if (g === max) {
    if (r > b) return 'yellow';
    return 'green';
  } else {
    if (r > g) return 'purple';
    if (g > r) return 'cyan';
    return 'blue';
  }
}

/**
 * Determine color vibe/mood from palette
 */
export function getColorVibe(colors: ExtractedColors): string {
  const { colorNames } = colors;
  
  // Analyze color names to determine vibe
  const hasWarm = colorNames.some(c => ['red', 'orange', 'yellow'].includes(c));
  const hasCool = colorNames.some(c => ['blue', 'cyan', 'purple'].includes(c));
  const hasDark = colorNames.some(c => c.includes('black') || c.includes('dark'));
  const hasLight = colorNames.some(c => c.includes('light') || c.includes('white'));
  
  if (hasDark && hasWarm) return 'dramatic and fierce';
  if (hasDark && hasCool) return 'mysterious and cool';
  if (hasLight && hasWarm) return 'warm and inviting';
  if (hasLight && hasCool) return 'serene and ethereal';
  if (hasWarm) return 'energetic and passionate';
  if (hasCool) return 'calm and mystical';
  
  return 'balanced and harmonious';
}
