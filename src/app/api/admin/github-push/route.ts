import { NextRequest, NextResponse } from 'next/server';

// List of essential files for export (synced with export-files API)
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

export async function POST(request: NextRequest) {
  console.log('[GitHub Push] ========== ENDPOINT HIT ==========');
  
  try {
    // Parse body
    const body = await request.json();
    console.log('[GitHub Push] Body parsed:', {
      owner: body.owner,
      repo: body.repo,
      branch: body.branch,
      hasToken: !!body.token,
      fileCount: EXPORTABLE_FILES.length
    });
    
    // Validate fields
    const { token, owner, repo, branch, commitMessage = 'Export from FrameFusion Genesis Admin Panel' } = body;
    
    if (!token || !owner || !repo || !branch) {
      console.error('[GitHub Push] Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['token', 'owner', 'repo', 'branch']
      }, { status: 400 });
    }

    console.log('[GitHub Push] Starting GitHub push to', `${owner}/${repo}`, `(${branch})`);

    // Get base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    console.log(`[GitHub Push] Base URL for file fetching: ${baseUrl}`);

    // GitHub API base URL
    const githubAPI = 'https://api.github.com';
    
    // Results tracking
    const results: Array<{ file: string; status: 'success' | 'failed'; error?: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Push files to GitHub
    for (const filePath of EXPORTABLE_FILES) {
      try {
        console.log(`[GitHub Push] Processing: ${filePath}`);
        
        // Fetch file content via internal API
        let content: string;
        try {
          const exportUrl = `${baseUrl}/api/admin/export-files?path=${encodeURIComponent(filePath)}`;
          console.log(`[GitHub Push] Fetching from: ${exportUrl}`);
          
          const exportResponse = await fetch(exportUrl, {
            headers: {
              'User-Agent': 'FrameFusion-GitHub-Push'
            }
          });
          
          console.log(`[GitHub Push] Export response status: ${exportResponse.status}`);
          
          if (!exportResponse.ok) {
            const errorText = await exportResponse.text();
            console.error(`[GitHub Push] Export API error for ${filePath}:`, errorText);
            throw new Error(`HTTP ${exportResponse.status}: ${exportResponse.statusText}`);
          }
          
          const exportData = await exportResponse.json();
          console.log(`[GitHub Push] Export data for ${filePath}:`, { 
            success: exportData.success, 
            hasContent: !!exportData.content,
            contentLength: exportData.content?.length,
            error: exportData.error,
            code: exportData.code
          });
          
          if (!exportData.success) {
            const errorMsg = exportData.error || 'Failed to read file';
            console.error(`[GitHub Push] Export failed for ${filePath}:`, errorMsg);
            throw new Error(errorMsg);
          }
          
          content = exportData.content;
          console.log(`[GitHub Push] ✅ File fetched successfully (${content.length} bytes)`);
          
        } catch (readError: any) {
          const errorMessage = readError.message || 'Unknown error';
          console.warn(`[GitHub Push] ⚠️ Could not read ${filePath}:`, errorMessage);
          results.push({
            file: filePath,
            status: 'failed',
            error: `Could not read file: ${errorMessage}`
          });
          failureCount++;
          continue;
        }

        // Encode content to base64
        const contentBase64 = Buffer.from(content).toString('base64');

        // Check if file exists to get SHA (for updates)
        let sha: string | undefined;
        try {
          const getFileResponse = await fetch(
            `${githubAPI}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'FrameFusion-Genesis-Exporter'
              }
            }
          );

          if (getFileResponse.ok) {
            const fileData = await getFileResponse.json();
            sha = fileData.sha;
            console.log(`[GitHub Push] File exists, will update (SHA: ${sha.substring(0, 7)}...)`);
          }
        } catch (error) {
          // File doesn't exist, will create new
          console.log(`[GitHub Push] File doesn't exist, will create new`);
        }

        // Push file to GitHub
        const pushResponse = await fetch(
          `${githubAPI}/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'User-Agent': 'FrameFusion-Genesis-Exporter'
            },
            body: JSON.stringify({
              message: commitMessage,
              content: contentBase64,
              branch: branch,
              ...(sha && { sha }) // Include SHA if updating existing file
            })
          }
        );

        if (pushResponse.ok) {
          console.log(`[GitHub Push] ✅ ${filePath} pushed successfully`);
          results.push({
            file: filePath,
            status: 'success'
          });
          successCount++;
        } else {
          const errorData = await pushResponse.json();
          console.error(`[GitHub Push] ❌ Failed to push ${filePath}:`, errorData.message);
          results.push({
            file: filePath,
            status: 'failed',
            error: errorData.message || 'Unknown GitHub API error'
          });
          failureCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error: any) {
        console.error(`[GitHub Push] ❌ Error processing ${filePath}:`, error.message);
        results.push({
          file: filePath,
          status: 'failed',
          error: error.message
        });
        failureCount++;
      }
    }

    console.log('[GitHub Push] ========== PUSH COMPLETE ==========');
    console.log(`[GitHub Push] Success: ${successCount}, Failed: ${failureCount}`);

    return NextResponse.json({
      success: true,
      message: `GitHub push complete: ${successCount} files pushed successfully, ${failureCount} failed`,
      successCount,
      failureCount,
      totalFiles: EXPORTABLE_FILES.length,
      results,
      repoUrl: `https://github.com/${owner}/${repo}`
    });

  } catch (error: any) {
    console.error('[GitHub Push] ========== ERROR ==========');
    console.error('[GitHub Push] Error:', error);
    console.error('[GitHub Push] Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
