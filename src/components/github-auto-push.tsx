'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertCircle, CheckCircle, Loader2, ExternalLink, Key, GitBranch, GitCommit } from 'lucide-react';

interface PushResult {
  file: string;
  success: boolean;
  error?: string;
}

interface PushResponse {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  totalFiles: number;
  results: PushResult[];
}

export function GitHubAutoPush() {
  const [token, setToken] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState<string>('Export FrameFusion Genesis from Ohara');
  
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushResponse, setPushResponse] = useState<PushResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handlePush = async () => {
    // Validate
    if (!token || !owner || !repo || !branch) {
      setError('Please fill in all required fields');
      return;
    }

    setIsPushing(true);
    setError('');
    setPushResponse(null);

    try {
      const response = await fetch('/api/admin/github-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          owner,
          repo,
          branch,
          commitMessage,
        }),
      });

      // Check if response has content before parsing
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server. Check your authorization and server logs.');
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to push to GitHub');
      }

      setPushResponse(data);
      console.log('[GitHub Push] Response:', data);
    } catch (err: any) {
      setError(err.message || 'Failed to push to GitHub');
      console.error('[GitHub Push] Error:', err);
    } finally {
      setIsPushing(false);
    }
  };

  const repoUrl = owner && repo ? `https://github.com/${owner}/${repo}` : '';

  return (
    <div className="space-y-6">
      {/* Critical Warning - Serverless Limitation */}
      <Card className="border-4 border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-500 text-white rounded-full p-3 flex-shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-3">
                ⚠️ GitHub Auto-Push Does NOT Work in Production
              </h3>
              <div className="space-y-3 text-sm text-red-900">
                <div>
                  <p className="font-semibold mb-1">Why is this failing?</p>
                  <p>
                    You're running this app on <strong>Vercel's serverless platform</strong>. When your app is deployed, 
                    all your source files (<code>.tsx</code>, <code>.ts</code>, <code>.json</code>, etc.) are <strong>compiled 
                    into optimized JavaScript bundles</strong>. The original source files <strong>no longer exist as separate 
                    files</strong> that can be read by the filesystem at runtime.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold mb-1">What you're seeing:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>HTTP 404 errors</strong> - The export-files API can't find the source files because they don't exist in the deployed bundle</li>
                    <li><strong>50+ failed files</strong> - Only compiled outputs and root config files remain accessible</li>
                    <li><strong>1 success (package.json)</strong> - Root files sometimes remain, but source code does not</li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                  <p className="font-bold text-lg text-green-700 mb-2">✅ Solution: Use Manual Copy Instead</p>
                  <p className="text-gray-700">
                    Switch to the <strong className="text-purple-600">"Manual Copy"</strong> tab above. That method provides 
                    all the code in a copy-paste format that works regardless of the deployment environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-400">🚀 Auto Push to GitHub (Development Only)</h2>
        <p className="text-gray-500">
          This feature only works in local development where source files exist on disk.
        </p>
      </div>

      {/* Setup Instructions */}
      <Card className="border-blue-200 bg-blue-50 opacity-60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Step 1: Create GitHub Personal Access Token</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></li>
              <li>Click "Generate new token (classic)"</li>
              <li>Give it a name: "FrameFusion Export"</li>
              <li>Select scopes: <code className="bg-white px-1">repo</code> (Full control of private repositories)</li>
              <li>Click "Generate token" and copy it</li>
            </ol>
          </div>
          
          <div>
            <strong>Step 2: Create GitHub Repository</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              <li>Go to <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub → New Repository</a></li>
              <li>Name it: "framefusion-genesis" (or any name)</li>
              <li>Choose Public or Private</li>
              <li>Don't initialize with README (we'll push files directly)</li>
              <li>Click "Create repository"</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <strong className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Important:
            </strong>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Keep your token secure - don't share it!</li>
              <li>Token will be used only for this push (not stored)</li>
              <li>Existing files in repo will be overwritten</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Configuration</CardTitle>
          <CardDescription>Enter your GitHub repository details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub Personal Access Token *
            </label>
            <Input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isPushing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your token with 'repo' scope access
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub Username/Org *
              </label>
              <Input
                placeholder="your-username"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={isPushing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Repository Name *
              </label>
              <Input
                placeholder="framefusion-genesis"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                disabled={isPushing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Branch Name
            </label>
            <Input
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isPushing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: main (use 'main' or 'master')
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Commit Message
            </label>
            <Input
              placeholder="Export FrameFusion Genesis from Ohara"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={isPushing}
            />
          </div>

          {repoUrl && (
            <div className="bg-gray-50 border rounded p-3">
              <p className="text-sm font-medium mb-1">Target Repository:</p>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {repoUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handlePush}
            disabled={isPushing || !token || !owner || !repo}
            className="w-full"
            size="lg"
          >
            {isPushing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pushing to GitHub...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Push to GitHub
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {pushResponse && (
        <Card className={pushResponse.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {pushResponse.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Push Complete!
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Push Completed with Errors
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-600">
                ✅ {pushResponse.successCount} Success
              </Badge>
              <Badge variant="destructive">
                ❌ {pushResponse.failureCount} Failed
              </Badge>
              <Badge variant="outline">
                📦 {pushResponse.totalFiles} Total
              </Badge>
            </div>

            <p className="text-sm">{pushResponse.message}</p>

            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
              >
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Failed files */}
            {pushResponse.failureCount > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">Failed Files:</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {pushResponse.results
                    .filter((r) => !r.success)
                    .map((result, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-white border rounded p-2 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs truncate">{result.file}</p>
                          <p className="text-xs text-red-600">{result.error}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            <div className="bg-white border rounded p-3 mt-4">
              <p className="font-medium text-sm mb-2">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your repository: <code className="bg-gray-100 px-1">{owner}/{repo}</code></li>
                <li>Create <code className="bg-gray-100 px-1">.env.local</code> file with your environment variables</li>
                <li>Run <code className="bg-gray-100 px-1">npm install</code> to install dependencies</li>
                <li>Run <code className="bg-gray-100 px-1">npm run dev</code> to test locally</li>
                <li>Deploy to Vercel or your preferred platform</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-3">
              <div>
                <p className="font-medium text-orange-900">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>This will attempt to push 60+ files to your repository</li>
                  <li>Existing files with same names will be overwritten</li>
                  <li>Process takes 2-3 minutes (GitHub API rate limiting)</li>
                  <li>Don't close this tab while pushing</li>
                  <li>Environment variables (.env) are NOT pushed (security)</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="font-medium text-yellow-900 mb-1">⚠️ Serverless Environment Limitation:</p>
                <p className="text-yellow-800">
                  In production (Vercel), some source files may not be accessible via the filesystem after compilation. 
                  If many files fail, this is expected behavior. Use the <strong>Manual Copy</strong> mode instead, 
                  or run this feature in a local development environment where all source files are accessible.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
