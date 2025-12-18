'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Sword, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  message: string;
  synced: Array<{
    tokenId: number;
    weaponClass: number;
    weaponType: string;
    rarity: number;
    attackPower: number;
    txHash: string;
  }>;
  errors?: Array<{
    tokenId?: number;
    error: string;
  }>;
  totalEvents: number;
}

export function WeaponRecoveryTool() {
  const { address, status } = useAccount();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/weapons/sync-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync weapons');
      }

      setSyncResult(data);

      if (data.synced.length > 0) {
        toast.success(`Successfully recovered ${data.synced.length} weapons! ⚔️`, {
          description: 'Your weapons have been added to your inventory',
        });
      } else if (data.totalEvents === 0) {
        toast.info('No minted weapons found on blockchain', {
          description: 'Mint some weapons to get started!',
        });
      } else {
        toast.info('All weapons already synced', {
          description: 'Your inventory is up to date',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync weapons', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (status !== 'connected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Weapon Recovery Tool
          </CardTitle>
          <CardDescription>
            Recover weapons that were minted but not saved to database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Connect your wallet to recover weapons
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Weapon Recovery Tool
        </CardTitle>
        <CardDescription>
          Scan the blockchain for minted weapons and sync them to your inventory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool will scan the blockchain for all weapons you have minted and add any missing weapons to your database inventory. Use this if weapons were minted but did not appear in your inventory.
          </AlertDescription>
        </Alert>

        {/* Connected Wallet */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connected Wallet:</span>
            <span className="text-sm font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full"
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning Blockchain...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recover Missing Weapons
            </>
          )}
        </Button>

        {/* Sync Results */}
        {syncResult && (
          <div className="space-y-4 mt-6 pt-6 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Sync Results
            </h3>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {syncResult.synced.length}
                </div>
                <div className="text-sm text-muted-foreground">Recovered</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">
                  {syncResult.totalEvents}
                </div>
                <div className="text-sm text-muted-foreground">Total Mints</div>
              </div>
            </div>

            {/* Recovered Weapons List */}
            {syncResult.synced.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recovered Weapons:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {syncResult.synced.map((weapon) => (
                    <div
                      key={weapon.tokenId}
                      className="bg-muted/50 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Sword className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">
                            Token #{weapon.tokenId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {weapon.weaponType}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Rarity {weapon.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Errors ({syncResult.errors.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {syncResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="bg-destructive/10 p-3 rounded-lg text-sm text-destructive"
                    >
                      {error.tokenId && <span>Token #{error.tokenId}: </span>}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {syncResult.synced.length === 0 && syncResult.totalEvents === 0 && (
              <Alert>
                <AlertDescription>
                  No minted weapons found on blockchain. Mint your first weapon to get started!
                </AlertDescription>
              </Alert>
            )}

            {syncResult.synced.length === 0 && syncResult.totalEvents > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  All your weapons are already synced to the database. Your inventory is up to date!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
