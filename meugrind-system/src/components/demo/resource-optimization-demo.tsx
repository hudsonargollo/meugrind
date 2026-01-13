'use client';

import React, { useState } from 'react';
import { PowerManagementIndicator } from '../interface/power-management-indicator';
import { ResourceMonitor } from '../interface/resource-monitor';
import { useCache, useImageCompression } from '../../hooks/use-cache';
import { usePowerManagement } from '../../hooks/use-power-management';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * Demo component showcasing resource optimization features
 */
export function ResourceOptimizationDemo() {
  const [demoData, setDemoData] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const { get, set, stats } = useCache();
  const { powerState, toggleEcoMode } = usePowerManagement();
  const { compressImage, compressing, progress } = useImageCompression();

  const handleCacheDemo = () => {
    const key = 'demo-data';
    const data = { message: demoData, timestamp: new Date() };
    
    set(key, data, { priority: 'high', ttl: 60000 });
    
    const retrieved = get(key);
    alert(`Cached and retrieved: ${JSON.stringify(retrieved)}`);
  };

  const handleImageCompression = async () => {
    if (!imageFile) {
      alert('Please select an image file first');
      return;
    }

    try {
      const result = await compressImage(imageFile);
      const savings = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
      
      alert(`Image compressed successfully!\nOriginal: ${(result.originalSize / 1024).toFixed(1)}KB\nCompressed: ${(result.compressedSize / 1024).toFixed(1)}KB\nSavings: ${savings}%`);
    } catch (error) {
      alert(`Compression failed: ${error}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Resource Optimization Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating power management, caching, and image compression features
        </p>
      </div>

      {/* Power Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Power Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PowerManagementIndicator showDetails={true} />
          
          <div className="flex space-x-2">
            <Button onClick={toggleEcoMode} variant="outline">
              {powerState.ecoModeActive ? 'Disable' : 'Enable'} Eco Mode
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Battery Level: {powerState.batteryLevel ?? 'Unknown'}%</p>
            <p>Charging: {powerState.isCharging ? 'Yes' : 'No'}</p>
            <p>Power Saving Level: {powerState.powerSavingLevel}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cache Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter some data to cache..."
              value={demoData}
              onChange={(e) => setDemoData(e.target.value)}
            />
            <Button onClick={handleCacheDemo} disabled={!demoData}>
              Cache & Retrieve
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Cache Size: {(stats.totalSize / 1024).toFixed(1)} KB</p>
            <p>Entries: {stats.entryCount}</p>
            <p>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Image Compression Section */}
      <Card>
        <CardHeader>
          <CardTitle>Image Compression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Button 
              onClick={handleImageCompression} 
              disabled={!imageFile || compressing}
            >
              {compressing ? `Compressing ${progress.toFixed(0)}%` : 'Compress'}
            </Button>
          </div>
          
          {imageFile && (
            <div className="text-sm text-muted-foreground">
              <p>Selected: {imageFile.name}</p>
              <p>Size: {(imageFile.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Monitor */}
      <ResourceMonitor />
    </div>
  );
}