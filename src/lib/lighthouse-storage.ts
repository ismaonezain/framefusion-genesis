/**
 * ================================================================================
 * Lighthouse.Storage API Helpers
 * ------------------------------------------------------------------------------
 * 500GB FREE storage with persistent IPFS pinning, NFT-focused service.
 * Compatible interface with Thirdweb/Pinata helpers for easy migration.
 * ================================================================================
 */

import lighthouse from '@lighthouse-web3/sdk';

// Lighthouse API Key - 500GB FREE storage tier!
const LIGHTHOUSE_API_KEY = '';

export type LighthouseFileSource =
  | File
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | string;

export interface LighthouseMetadataAttribute {
  trait_type: string;
  value: string | number;
}

export interface LighthouseMetadataInput {
  name: string;
  description?: string;
  attributes?: LighthouseMetadataAttribute[];
  external_url?: string;
  properties?: Record<string, unknown>;
}

export interface LighthouseMetadataDocument extends LighthouseMetadataInput {
  image: string;
  image_gateway: string;
}

export interface LighthouseUploadInput {
  source: LighthouseFileSource;
  filename?: string;
  displayName?: string;
  mimeType?: string;
}

export interface LighthousePin {
  id: string;
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
  name?: string;
  size?: number;
  mimeType?: string;
  createdAt?: string;
}

export interface LighthouseUploadResult {
  pin: LighthousePin;
}

export interface LighthouseMetadataUploadInput {
  metadata: LighthouseMetadataInput;
  filename?: string;
}

export interface LighthouseMetadataUploadResult {
  document: LighthouseMetadataDocument;
  pin: LighthousePin;
}

export interface LighthouseImageWithMetadataInput {
  image: LighthouseFileSource;
  filename?: string;
  mimeType?: string;
  metadata: LighthouseMetadataInput;
}

export interface LighthouseImageWithMetadataResult {
  image: LighthouseUploadResult;
  metadata: LighthouseMetadataUploadResult;
}

/**
 * Upload a file to IPFS via Lighthouse Storage
 */
export async function lighthouseUploadFile(input: LighthouseUploadInput): Promise<LighthouseUploadResult> {
  if (!input?.source) throw new Error('Lighthouse: source is required');
  if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse: API key not configured. Get one at https://files.lighthouse.storage/');
  
  const normalized = await normalizeBinary(input.source, input.filename || 'upload', input.mimeType);
  
  try {
    console.log('[Lighthouse] Uploading file to IPFS...');
    
    // Convert Blob to File for Lighthouse SDK
    const file = new File([normalized.blob], normalized.filename, { type: normalized.blob.type });
    
    // Upload using Lighthouse SDK
    const uploadResponse = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
    
    if (!uploadResponse?.data?.Hash) {
      throw new Error('Upload failed: No CID returned');
    }
    
    const cid = uploadResponse.data.Hash;
    const ipfsUri = `ipfs://${cid}`;
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    
    console.log('[Lighthouse] Upload successful!', { cid, gatewayUrl });
    
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
    console.error('[Lighthouse] Upload failed:', err);
    throw new Error(`Lighthouse upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Upload metadata JSON document to IPFS
 */
export async function lighthouseUploadMetadataDocument(
  input: LighthouseMetadataUploadInput,
  imagePin?: LighthousePin,
): Promise<LighthouseMetadataUploadResult> {
  if (!input?.metadata?.name) throw new Error('Lighthouse: metadata.name is required');
  
  const filename = input.filename || `${slugify(input.metadata.name)}.json`;
  const doc = buildMetadataDocument(input.metadata, imagePin);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  
  const upload = await lighthouseUploadFile({
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
export async function lighthouseUploadImageWithMetadata(
  input: LighthouseImageWithMetadataInput,
): Promise<LighthouseImageWithMetadataResult> {
  if (!input?.metadata?.name) throw new Error('Lighthouse: metadata.name is required');
  
  console.log('[Lighthouse] Starting image + metadata upload...');
  
  // Upload image first
  const imageResult = await lighthouseUploadFile({
    source: input.image,
    filename: input.filename,
    displayName: input.metadata.name,
    mimeType: input.mimeType,
  });
  
  // Upload metadata with image reference
  const metadataResult = await lighthouseUploadMetadataDocument(
    { metadata: input.metadata },
    imageResult.pin,
  );
  
  console.log('[Lighthouse] Image + metadata upload complete!');
  
  return {
    image: imageResult,
    metadata: metadataResult,
  };
}

/**
 * Normalize various file sources into Blob
 */
async function normalizeBinary(
  source: LighthouseFileSource,
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
            console.log(`[Lighthouse] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log(`[Lighthouse] Fetching image from URL (attempt ${attempt}/${maxRetries})...`);
          const response = await fetch(source, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; LighthouseUpload/1.0)',
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
          
          console.log(`[Lighthouse] Successfully downloaded image: ${blob.size} bytes`);
          return {
            blob: blob.type.startsWith('image/') ? blob : new Blob([blob], { type: 'image/png' }),
            filename: deriveFilenameFromUrl(source) || fallbackName,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          console.error(`[Lighthouse] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
          
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
  metadata: LighthouseMetadataInput,
  imagePin?: LighthousePin,
): LighthouseMetadataDocument {
  const doc: LighthouseMetadataDocument = {
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
