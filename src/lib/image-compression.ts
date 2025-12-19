/**
 * Image Compression Utility
 * Compresses images to specified max width while maintaining aspect ratio
 */

export interface CompressionOptions {
  maxWidth: number;
  quality?: number; // 0-1, default 0.9
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

/**
 * Compress an image from a URL
 * @param imageUrl - URL of the image to compress
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function compressImageFromUrl(
  imageUrl: string,
  options: CompressionOptions
): Promise<Blob> {
  const { maxWidth, quality = 0.9, format = 'image/png' } = options;

  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();

  return compressImageBlob(blob, { maxWidth, quality, format });
}

/**
 * Compress an image Blob
 * @param blob - Image blob to compress
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function compressImageBlob(
  blob: Blob,
  options: CompressionOptions
): Promise<Blob> {
  const { maxWidth, quality = 0.9, format = 'image/png' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const aspectRatio = height / width;
          width = maxWidth;
          height = Math.round(maxWidth * aspectRatio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (compressedBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (compressedBlob) {
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Get image dimensions from a Blob
 * @param blob - Image blob
 * @returns Width and height
 */
export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
