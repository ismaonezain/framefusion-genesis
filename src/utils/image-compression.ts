/**
 * Image Compression Utility (Server-Side Only)
 * Uses Sharp for efficient image compression
 */

import sharp from 'sharp';

/**
 * Compress image URL to reduce file size before uploading to IPFS
 * Target: ~1-1.5MB, max width 1200px, quality 80%
 * Optimized for NFT images - balances quality and file size
 * 
 * @param imageUrl - URL of the image to compress
 * @returns Compressed image as Buffer
 */
export async function compressImageFromUrl(imageUrl: string): Promise<Buffer> {
  try {
    console.log('[ImageCompression] Fetching image from URL:', imageUrl);
    
    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageCompression/1.0)',
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = buffer.length;
    
    console.log('[ImageCompression] Original image size:', `${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Skip compression for small images (< 500KB)
    if (originalSize < 500 * 1024) {
      console.log('[ImageCompression] Image already small, skipping compression');
      return buffer;
    }
    
    // Compress with Sharp - OPTIMIZED settings for ~1-1.5MB target
    console.log('[ImageCompression] Compressing image...');
    const compressed = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();
    
    const compressedSize = compressed.length;
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log('[ImageCompression] Compression complete!', {
      original: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressed: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${reduction}%`,
    });
    
    return compressed;
  } catch (error) {
    console.error('[ImageCompression] Compression failed:', error);
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compress image buffer
 * Target: ~1-1.5MB, max width 1200px, quality 80%
 * 
 * @param buffer - Image buffer to compress
 * @returns Compressed image as Buffer
 */
export async function compressImageBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    const originalSize = buffer.length;
    console.log('[ImageCompression] Original buffer size:', `${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Skip compression for small images (< 500KB)
    if (originalSize < 500 * 1024) {
      console.log('[ImageCompression] Buffer already small, skipping compression');
      return buffer;
    }
    
    // Compress with Sharp - OPTIMIZED settings for ~1-1.5MB target
    console.log('[ImageCompression] Compressing buffer...');
    const compressed = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();
    
    const compressedSize = compressed.length;
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log('[ImageCompression] Compression complete!', {
      original: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      compressed: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${reduction}%`,
    });
    
    return compressed;
  } catch (error) {
    console.error('[ImageCompression] Buffer compression failed:', error);
    throw new Error(`Buffer compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
