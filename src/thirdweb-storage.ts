/**
 * ================================================================================
 * Thirdweb Storage API Helpers
 * ------------------------------------------------------------------------------
 * Free IPFS storage with persistent pinning, no rate limits for reasonable use.
 * Compatible interface with Pinata helpers for easy migration.
 * ================================================================================
 */

import { ThirdwebStorage } from '@thirdweb-dev/storage';

// Initialize Thirdweb Storage (no API key needed for free tier)
const storage = new ThirdwebStorage({
  // Free tier - no secretKey needed for basic uploads
  // For higher rate limits, add: secretKey: process.env.THIRDWEB_SECRET_KEY
});

export type ThirdwebFileSource =
  | File
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | string;

export interface ThirdwebMetadataAttribute {
  trait_type: string;
  value: string | number;
}

export interface ThirdwebMetadataInput {
  name: string;
  description?: string;
  attributes?: ThirdwebMetadataAttribute[];
  external_url?: string;
  properties?: Record<string, unknown>;
}

export interface ThirdwebMetadataDocument extends ThirdwebMetadataInput {
  image: string;
  image_gateway: string;
}

export interface ThirdwebUploadInput {
  source: ThirdwebFileSource;
  filename?: string;
  displayName?: string;
  mimeType?: string;
}

export interface ThirdwebPin {
  id: string;
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
  name?: string;
  size?: number;
  mimeType?: string;
  createdAt?: string;
}

export interface ThirdwebUploadResult {
  pin: ThirdwebPin;
}

export interface ThirdwebMetadataUploadInput {
  metadata: ThirdwebMetadataInput;
  filename?: string;
}

export interface ThirdwebMetadataUploadResult {
  document: ThirdwebMetadataDocument;
  pin: ThirdwebPin;
}

export interface ThirdwebImageWithMetadataInput {
  image: ThirdwebFileSource;
  filename?: string;
  mimeType?: string;
  metadata: ThirdwebMetadataInput;
}

export interface ThirdwebImageWithMetadataResult {
  image: ThirdwebUploadResult;
  metadata: ThirdwebMetadataUploadResult;
}

/**
 * Upload a file to IPFS via Thirdweb Storage
 */
export async function thirdwebUploadFile(input: ThirdwebUploadInput): Promise<ThirdwebUploadResult> {
  if (!input?.source) throw new Error('Thirdweb: source is required');
  
  const normalized = await normalizeBinary(input.source, input.filename || 'upload', input.mimeType);
  
  try {
    console.log('[Thirdweb] Uploading file to IPFS...');
    const ipfsUri = await storage.upload(normalized.blob);
    
    // Extract CID from ipfs:// URI
    const cid = ipfsUri.replace('ipfs://', '');
    
    // Get gateway URL using Thirdweb's resolver
    const gatewayUrl = storage.resolveScheme(ipfsUri);
    
    console.log('[Thirdweb] Upload successful!', { cid, gatewayUrl });
    
    return {
      pin: {
        id: cid,
        cid,
        ipfsUri,
        gatewayUrl,
        name: input.displayName || input.filename,
        size: normalized.blob.size,
        mimeType: normalized.blob.type,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('[Thirdweb] Upload failed:', err);
    throw new Error(`Thirdweb upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Upload metadata JSON document to IPFS
 */
export async function thirdwebUploadMetadataDocument(
  input: ThirdwebMetadataUploadInput,
  imagePin?: ThirdwebPin,
): Promise<ThirdwebMetadataUploadResult> {
  if (!input?.metadata?.name) throw new Error('Thirdweb: metadata.name is required');
  
  const filename = input.filename || `${slugify(input.metadata.name)}.json`;
  const doc = buildMetadataDocument(input.metadata, imagePin);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  
  const upload = await thirdwebUploadFile({
    source: blob,
    filename,
    displayName: doc.name,
    mimeType: 'application/json',
  });

  return {
    document: doc,
    pin: upload.pin,
  };
}

/**
 * Upload image with metadata to IPFS (main function for NFT generation)
 */
export async function thirdwebUploadImageWithMetadata(
  input: ThirdwebImageWithMetadataInput,
): Promise<ThirdwebImageWithMetadataResult> {
  if (!input?.metadata?.name) throw new Error('Thirdweb: metadata.name is required');
  
  console.log('[Thirdweb] Starting image + metadata upload...');
  
  // Upload image first
  const imageResult = await thirdwebUploadFile({
    source: input.image,
    filename: input.filename,
    displayName: input.metadata.name,
    mimeType: input.mimeType,
  });
  
  // Upload metadata with image reference
  const metadataResult = await thirdwebUploadMetadataDocument(
    { metadata: input.metadata },
    imageResult.pin,
  );
  
  console.log('[Thirdweb] Image + metadata upload complete!');
  
  return {
    image: imageResult,
    metadata: metadataResult,
  };
}

/**
 * Normalize various file sources into Blob
 */
async function normalizeBinary(
  source: ThirdwebFileSource,
  fallbackName: string,
  mimeType?: string,
): Promise<{ blob: Blob; filename: string }> {
  const fileCtorAvailable = typeof File !== 'undefined';
  const blobCtorAvailable = typeof Blob !== 'undefined';

  if (fileCtorAvailable && source instanceof File) {
    return {
      blob: source,
      filename: source.name || fallbackName,
    };
  }

  if (blobCtorAvailable && source instanceof Blob) {
    return {
      blob: source,
      filename: fallbackName,
    };
  }

  if (source instanceof ArrayBuffer) {
    const blob = new Blob([source], { type: mimeType || 'application/octet-stream' });
    return { blob, filename: fallbackName };
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(source)) {
    const view = source as ArrayBufferView;
    const slice = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    const blob = new Blob([slice], { type: mimeType || 'application/octet-stream' });
    return { blob, filename: fallbackName };
  }

  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const blob = dataUrlToBlob(source);
      return { blob, filename: fallbackName };
    }
    if (isHttpUrl(source)) {
      // Download from URL
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const delay = attempt * 2000;
            console.log(`[Thirdweb] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log(`[Thirdweb] Fetching image from URL (attempt ${attempt}/${maxRetries})...`);
          const response = await fetch(source, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ThirdwebUpload/1.0)',
              'Accept': 'image/*,*/*',
            },
            cache: 'no-cache',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Downloaded image is empty (0 bytes)');
          }
          
          console.log(`[Thirdweb] Successfully downloaded image: ${blob.size} bytes`);
          return {
            blob: blob.type.startsWith('image/') ? blob : new Blob([blob], { type: 'image/png' }),
            filename: deriveFilenameFromUrl(source) || fallbackName,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          console.error(`[Thirdweb] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
          
          if (attempt === maxRetries) {
            break;
          }
        }
      }
      
      throw new Error(`Image download failed after ${maxRetries} attempts: ${lastError?.message}`);
    }
    const blob = new Blob([source], { type: mimeType || 'text/plain' });
    return { blob, filename: fallbackName };
  }

  throw new Error('Unsupported file source');
}

/**
 * Build metadata document with image references
 */
function buildMetadataDocument(
  metadata: ThirdwebMetadataInput,
  imagePin?: ThirdwebPin,
): ThirdwebMetadataDocument {
  const doc: ThirdwebMetadataDocument = {
    name: metadata.name,
    description: metadata.description,
    image: imagePin?.ipfsUri || '',
    image_gateway: imagePin?.gatewayUrl || '',
  };

  if (metadata.attributes?.length) {
    doc.attributes = metadata.attributes;
  }
  if (metadata.external_url) {
    doc.external_url = metadata.external_url;
  }
  if (metadata.properties && Object.keys(metadata.properties).length > 0) {
    for (const [key, value] of Object.entries(metadata.properties)) {
      (doc as Record<string, unknown>)[key] = value;
    }
  }

  return doc;
}

/**
 * Convert data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  if (!base64) throw new Error('Invalid data URL');
  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = decodeBase64(base64);
  return new Blob([binary], { type: mime });
}

/**
 * Decode base64 string to Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const globalObj = globalThis as typeof globalThis & {
    Buffer?: typeof Buffer;
    atob?: (input: string) => string;
  };
  
  if (typeof globalObj.atob === 'function') {
    const binaryString = globalObj.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  if (globalObj.Buffer) {
    return Uint8Array.from(globalObj.Buffer.from(base64, 'base64'));
  }

  throw new Error('Base64 decoding is not supported in this environment');
}

/**
 * Check if string is HTTP URL
 */
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Derive filename from URL
 */
function deriveFilenameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length) return null;
    return segments[segments.length - 1];
  } catch {
    return null;
  }
}

/**
 * Slugify string for filenames
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    || 'metadata';
}
