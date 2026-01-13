'use client';

import React from 'react';
import { useCache, useImageCompression } from '../../hooks/use-cache';
import { usePowerManagement } from '../../hooks/use-power-management';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ResourceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export function ResourceMonitor({ 
  showDetails = true, 
  className = '' 
}: ResourceMonitorProps) {
  const { stats, clear, prefetchCritical } = useCache();
  const { powerState, getResourceOptimizations } = usePowerManagement();
  const { compressing, progress } = useImageCompression();

  const optimizations = getResourceOptimizations();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className="text-xs">
          Cache: {formatBytes(stats.totalSize)}
        </Badge>
        {powerState.ecoModeActive && (
          <Badge variant="secondary" className="text-xs">
            Eco Mode
          </Badge>
        )}
        {compressing && (
          <Badge variant="default" className="text-xs">
            Compressing {progress.toFixed(0)}%
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cache Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cache Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Size:</span>
              <span className="ml-1 font-medium">{formatBytes(stats.totalSize)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Entries:</span>
              <span className="ml-1 font-medium">{stats.entryCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Hit Rate:</span>
              <span className="ml-1 font-medium">{formatPercentage(stats.hitRate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Compression:</span>
              <span className="ml-1 font-medium">{formatPercentage(stats.compressionRatio)}</span>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prefetchCritical}
              className="text-xs"
            >
              Prefetch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="text-xs"
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Power Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Resource Optimization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Max Cache:</span>
              <span className="ml-1 font-medium">{formatBytes(optimizations.cacheSize)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Image Quality:</span>
              <span className="ml-1 font-medium">{formatPercentage(optimizations.imageQuality)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Concurrent:</span>
              <span className="ml-1 font-medium">{optimizations.maxConcurrentOperations}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sync Interval:</span>
              <span className="ml-1 font-medium">{Math.round(optimizations.syncInterval / 1000)}s</span>
            </div>
          </div>

          {powerState.ecoModeActive && (
            <div className="pt-2">
              <Badge 
                variant={powerState.powerSavingLevel === 'aggressive' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {powerState.powerSavingLevel === 'aggressive' ? 'Aggressive' : 'Light'} Power Saving
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compression Status */}
      {compressing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Image Compression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress:</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Compact resource indicator for status bars
 */
export function ResourceIndicator({ className = '' }: { className?: string }) {
  return <ResourceMonitor showDetails={false} className={className} />;
}