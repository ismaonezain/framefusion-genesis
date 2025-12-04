import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

// List of essential files for export
const EXPORTABLE_FILES = [
  // Config files
  'package.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  '.gitignore',
  
  // Core app files
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/providers.tsx',
  'src/app/globals.css',
  'src/middleware.ts',
  
  // Database & contracts
  'src/contracts/SUPABASE_SCHEMA.sql',
  'src/contracts/SUPABASE_USERS_CACHE.sql',
  'src/contracts/SUPABASE_SYNC_CHECKPOINTS.sql',
  'src/contracts/FrameFusionGenesisV3.sol',
  'src/contracts/DEPLOYMENT.md',
  'src/contracts/V3_MIGRATION_GUIDE.md',
  
  // Lib files
  'src/lib/supabase.ts',
  'src/lib/neynar.ts',
  'src/lib/wagmi.ts',
  'src/lib/nft-contract-v3.ts',
  'src/lib/nft-contract-v2.ts',
  'src/lib/tria-rewards-contract.ts',
  'src/lib/tria-contract.ts',
  'src/lib/utils.ts',
  'src/lib/user-cache.ts',
  'src/lib/nft-generator.ts',
  'src/lib/prepare-nft-metadata.ts',
  'src/lib/logger.ts',
  
  // Main components
  'src/components/admin-panel.tsx',
  'src/components/export-to-github.tsx',
  'src/components/notifications-admin-neynar.tsx',
  'src/components/nft-generator.tsx',
  'src/components/checkin-panel.tsx',
  'src/components/collection-stats.tsx',
  'src/components/nft-display.tsx',
  
  // Farcaster
  'public/.well-known/farcaster.json',
  'src/components/FarcasterWrapper.tsx',
  'src/components/FarcasterManifestSigner.tsx',
  'src/components/FarcasterToastManager.tsx',
  'src/hooks/useQuickAuth.tsx',
  'src/hooks/useAddMiniApp.ts',
  'src/hooks/useIsInFarcaster.ts',
  
  // Key API routes
  'src/app/api/checkin/route.ts',
  'src/app/api/notifications/neynar-send/route.ts',
  'src/app/api/notifications/neynar-tokens/route.ts',
  'src/app/api/leaderboard/route.ts',
  'src/app/api/users/sync/route.ts',
  'src/app/api/admin/sync-nfts/route.ts',
  'src/app/api/admin/update-metadata/route.ts',
  'src/app/api/me/route.ts',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const all = searchParams.get('all');
  
  try {
    // Export all files
    if (all === 'true') {
      const files = [];
      
      for (const filePath of EXPORTABLE_FILES) {
        try {
          const fullPath = join(process.cwd(), filePath);
          
          // Check if file exists before trying to read
          try {
            await access(fullPath, constants.R_OK);
          } catch {
            console.warn(`[Export] File not accessible: ${filePath}`);
            continue;
          }
          
          const content = await readFile(fullPath, 'utf-8');
          files.push({ path: filePath, content });
          console.log(`[Export] ✅ Read ${filePath} (${content.length} bytes)`);
        } catch (error: any) {
          console.warn(`[Export] ⚠️ Error reading ${filePath}:`, error.message);
          // Skip files that can't be read
        }
      }
      
      console.log(`[Export] Total files exported: ${files.length}/${EXPORTABLE_FILES.length}`);
      
      return NextResponse.json({
        success: true,
        files,
        total: files.length,
        requested: EXPORTABLE_FILES.length
      });
    }
    
    // Export single file
    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path parameter required' },
        { status: 400 }
      );
    }
    
    // Security: Only allow exportable files
    if (!EXPORTABLE_FILES.includes(path)) {
      return NextResponse.json(
        { success: false, error: `File not in exportable list: ${path}` },
        { status: 403 }
      );
    }
    
    const fullPath = join(process.cwd(), path);
    console.log(`[Export] Reading file: ${fullPath}`);
    
    // Check if file exists
    try {
      await access(fullPath, constants.R_OK);
    } catch (error: any) {
      console.error(`[Export] File not accessible: ${fullPath}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `File not accessible in serverless environment: ${path}. This file may not be available in production builds.`,
          code: 'FILE_NOT_ACCESSIBLE'
        },
        { status: 404 }
      );
    }
    
    const content = await readFile(fullPath, 'utf-8');
    console.log(`[Export] ✅ Successfully read ${path} (${content.length} bytes)`);
    
    return NextResponse.json({
      success: true,
      path,
      content,
      size: content.length
    });
    
  } catch (error: any) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read file',
        code: 'READ_ERROR'
      },
      { status: 500 }
    );
  }
}
