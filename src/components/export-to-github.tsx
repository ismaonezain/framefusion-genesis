'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Folder, 
  Loader2, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { GitHubAutoPush } from '@/components/github-auto-push';

interface FileItem {
  path: string;
  category: 'core' | 'components' | 'api' | 'lib' | 'config' | 'other';
  priority: 'high' | 'medium' | 'low';
}

const FILE_STRUCTURE: FileItem[] = [
  // Core files (highest priority)
  { path: 'package.json', category: 'config', priority: 'high' },
  { path: 'tsconfig.json', category: 'config', priority: 'high' },
  { path: 'next.config.js', category: 'config', priority: 'high' },
  { path: 'tailwind.config.ts', category: 'config', priority: 'high' },
  { path: 'postcss.config.js', category: 'config', priority: 'high' },
  { path: '.gitignore', category: 'config', priority: 'high' },
  
  // Main app files
  { path: 'src/app/layout.tsx', category: 'core', priority: 'high' },
  { path: 'src/app/page.tsx', category: 'core', priority: 'high' },
  { path: 'src/app/providers.tsx', category: 'core', priority: 'high' },
  { path: 'src/app/globals.css', category: 'core', priority: 'high' },
  { path: 'src/middleware.ts', category: 'core', priority: 'high' },
  
  // Database & contracts
  { path: 'src/contracts/SUPABASE_SCHEMA.sql', category: 'config', priority: 'high' },
  { path: 'src/contracts/SUPABASE_USERS_CACHE.sql', category: 'config', priority: 'medium' },
  { path: 'src/contracts/SUPABASE_SYNC_CHECKPOINTS.sql', category: 'config', priority: 'medium' },
  { path: 'src/contracts/FrameFusionGenesisV3.sol', category: 'config', priority: 'medium' },
  
  // Lib files
  { path: 'src/lib/supabase.ts', category: 'lib', priority: 'high' },
  { path: 'src/lib/neynar.ts', category: 'lib', priority: 'high' },
  { path: 'src/lib/wagmi.ts', category: 'lib', priority: 'high' },
  { path: 'src/lib/nft-contract-v3.ts', category: 'lib', priority: 'medium' },
  { path: 'src/lib/tria-rewards-contract.ts', category: 'lib', priority: 'medium' },
  { path: 'src/lib/utils.ts', category: 'lib', priority: 'medium' },
  
  // Main components
  { path: 'src/components/admin-panel.tsx', category: 'components', priority: 'high' },
  { path: 'src/components/notifications-admin-neynar.tsx', category: 'components', priority: 'high' },
  { path: 'src/components/nft-generator.tsx', category: 'components', priority: 'medium' },
  { path: 'src/components/checkin-panel.tsx', category: 'components', priority: 'medium' },
  
  // Farcaster integration
  { path: 'public/.well-known/farcaster.json', category: 'config', priority: 'high' },
  { path: 'src/components/FarcasterWrapper.tsx', category: 'components', priority: 'medium' },
  { path: 'src/hooks/useQuickAuth.tsx', category: 'lib', priority: 'medium' },
  
  // API routes (key ones)
  { path: 'src/app/api/checkin/route.ts', category: 'api', priority: 'high' },
  { path: 'src/app/api/notifications/neynar-send/route.ts', category: 'api', priority: 'high' },
  { path: 'src/app/api/leaderboard/route.ts', category: 'api', priority: 'medium' },
  { path: 'src/app/api/users/sync/route.ts', category: 'api', priority: 'medium' },
];

export function ExportToGitHub() {
  const [copiedFiles, setCopiedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopyFile = async (filePath: string) => {
    try {
      // Check if already loaded
      let content = fileContents[filePath];
      
      if (!content) {
        toast.loading(`Loading ${filePath}...`, { id: `load-${filePath}` });
        const response = await fetch(`/api/admin/export-files?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load file');
        }
        
        content = data.content;
        setFileContents(prev => ({ ...prev, [filePath]: content }));
      }
      
      await navigator.clipboard.writeText(content);
      setCopiedFiles(prev => new Set(prev).add(filePath));
      
      toast.dismiss(`load-${filePath}`);
      toast.success(`✅ Copied ${filePath}!`, { duration: 2000 });
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopiedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      toast.dismiss(`load-${filePath}`);
      toast.error(`❌ Failed to copy ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCopyAllFiles = async () => {
    const confirmed = confirm(
      `This will copy ${filteredFiles.length} files to your clipboard as a formatted export guide. Continue?`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    toast.loading('📦 Preparing export package...', { id: 'copy-all', duration: Infinity });
    
    try {
      const response = await fetch('/api/admin/export-files?all=true');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load files');
      }
      
      // Create formatted export text
      let exportText = `# FrameFusion Genesis - Complete Export Package\n\n`;
      exportText += `Generated: ${new Date().toISOString()}\n`;
      exportText += `Total Files: ${data.files.length}\n\n`;
      exportText += `---\n\n`;
      
      for (const file of data.files) {
        exportText += `## File: ${file.path}\n\n`;
        exportText += `\`\`\`\n${file.content}\n\`\`\`\n\n`;
        exportText += `---\n\n`;
      }
      
      await navigator.clipboard.writeText(exportText);
      
      toast.dismiss('copy-all');
      toast.success(`✅ Copied ${data.files.length} files to clipboard!`, { duration: 5000 });
    } catch (error) {
      toast.dismiss('copy-all');
      toast.error(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = FILE_STRUCTURE.filter(file => {
    const matchesSearch = searchQuery === '' || 
      file.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryStats = {
    all: FILE_STRUCTURE.length,
    core: FILE_STRUCTURE.filter(f => f.category === 'core').length,
    components: FILE_STRUCTURE.filter(f => f.category === 'components').length,
    api: FILE_STRUCTURE.filter(f => f.category === 'api').length,
    lib: FILE_STRUCTURE.filter(f => f.category === 'lib').length,
    config: FILE_STRUCTURE.filter(f => f.category === 'config').length,
    other: FILE_STRUCTURE.filter(f => f.category === 'other').length,
  };

  const [exportMode, setExportMode] = useState<'manual' | 'auto'>('auto');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export to GitHub
          </CardTitle>
          <CardDescription>
            Auto-push to GitHub or manually copy files to migrate this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selector */}
          <Tabs value={exportMode} onValueChange={(v) => setExportMode(v as 'manual' | 'auto')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="auto" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Auto Push (Recommended)
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Manual Copy
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-sm">
              {exportMode === 'auto' ? (
                <>
                  <strong>🚀 Auto Push:</strong> Directly push all files to your GitHub repo with one click! Just need your GitHub token.
                </>
              ) : (
                <>
                  <strong>📋 Manual Copy:</strong> Copy files one by one, or use "Copy All" to get a complete export package. Then paste into your GitHub repo!
                </>
              )}
            </AlertDescription>
          </Alert>
          
          {exportMode === 'manual' && (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyAllFiles}
                  disabled={loading}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copy All Files ({filteredFiles.length})
                    </>
                  )}
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-purple-700">{FILE_STRUCTURE.length}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">
                    {FILE_STRUCTURE.filter(f => f.priority === 'high').length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Copied</p>
                  <p className="text-2xl font-bold text-green-600">{copiedFiles.size}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Auto Push Mode */}
      {exportMode === 'auto' && (
        <GitHubAutoPush />
      )}

      {/* Manual Copy Mode */}
      {exportMode === 'manual' && (
        <>
      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="all">All ({categoryStats.all})</TabsTrigger>
              <TabsTrigger value="core">Core ({categoryStats.core})</TabsTrigger>
              <TabsTrigger value="components">UI ({categoryStats.components})</TabsTrigger>
              <TabsTrigger value="api">API ({categoryStats.api})</TabsTrigger>
              <TabsTrigger value="lib">Lib ({categoryStats.lib})</TabsTrigger>
              <TabsTrigger value="config">Config ({categoryStats.config})</TabsTrigger>
              <TabsTrigger value="other">Other ({categoryStats.other})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Files ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.path.endsWith('.tsx') || file.path.endsWith('.ts') ? (
                      <FileCode className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : file.path.endsWith('.sql') ? (
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{file.path}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            file.priority === 'high' 
                              ? 'border-red-300 text-red-700 bg-red-50' 
                              : file.priority === 'medium'
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                              : 'border-gray-300 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {file.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {file.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={copiedFiles.has(file.path) ? "default" : "outline"}
                    onClick={() => handleCopyFile(file.path)}
                    className={copiedFiles.has(file.path) ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {copiedFiles.has(file.path) ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-green-800">
          <div className="flex items-start gap-2">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              1
            </div>
            <p>Create a new GitHub repository and clone it locally</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              2
            </div>
            <p>Copy files one by one (or use "Copy All") and paste into your local repo</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              3
            </div>
            <p>Create <code className="bg-white px-1 rounded">.env.local</code> and add your environment variables</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              4
            </div>
            <p>Run <code className="bg-white px-1 rounded">npm install</code> and test locally</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              5
            </div>
            <p>Push to GitHub and deploy to Vercel!</p>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
