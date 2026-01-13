'use client';

import { useEffect, useState, useCallback } from 'react';
import { cacheManager, CacheStats } from '../lib/cache-manager';

/**
 * React hook for cache management
 */
export function useCache() {
  const [stats, setStats] = useState<CacheStats>({
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    missRate: 0,
    compressionRatio: 0
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    cacheManager.initialize().then(() => {
      setIsInitialized(true);
      updateStats();
    });

    // Update stats periodically
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = useCallback(() => {
    setStats(cacheManager.getStats());
  }, []);

  const get = useCallback(<T,>(key: string): T | null => {
    const result = cacheManager.get<T>(key);
    updateStats();
    return result;
  }, [updateStats]);

  const set = useCallback(<T,>(
    key: string,
    data: T,
    options?: Parameters<typeof cacheManager.set>[2]
  ) => {
    cacheManager.set(key, data, options);
    updateStats();
  }, [updateStats]);

  const remove = useCallback((key: string) => {
    const result = cacheManager.delete(key);
    updateStats();
    return result;
  }, [updateStats]);

  const clear = useCallback(() => {
    cacheManager.clear();
    updateStats();
  }, [updateStats]);

  const prefetchCritical = useCallback(async () => {
    await cacheManager.prefetchCriticalData();
    updateStats();
  }, [updateStats]);

  return {
    isInitialized,
    stats,
    get,
    set,
    remove,
    clear,
    prefetchCritical,
    updateConfig: cacheManager.updateConfig.bind(cacheManager)
  };
}

/**
 * Hook for caching API responses
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    enabled?: boolean;
  } = {}
) {
  const { get, set } = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { ttl, priority = 'medium', enabled = true } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      set(key, freshData, { ttl, priority });
      setData(freshData);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, get, set, ttl, priority, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for image compression
 */
export function useImageCompression() {
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = useCallback(async (
    file: File,
    options?: Parameters<typeof import('../lib/image-compression').imageCompression.compressImage>[1]
  ) => {
    setCompressing(true);
    setProgress(0);

    try {
      const { imageCompression } = await import('../lib/image-compression');
      const result = await imageCompression.compressImage(file, options);
      setProgress(100);
      return result;
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, []);

  const compressImages = useCallback(async (
    files: File[],
    options?: Parameters<typeof import('../lib/image-compression').imageCompression.compressImages>[1]
  ) => {
    setCompressing(true);
    setProgress(0);

    try {
      const { imageCompression } = await import('../lib/image-compression');
      const results = await imageCompression.compressImages(
        files,
        options,
        (completed, total) => {
          setProgress((completed / total) * 100);
        }
      );
      return results;
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, []);

  const shouldCompress = useCallback((file: File, maxSize?: number) => {
    return import('../lib/image-compression').then(({ imageCompression }) =>
      imageCompression.shouldCompress(file, maxSize)
    );
  }, []);

  const getRecommendedSettings = useCallback((useCase: Parameters<typeof import('../lib/image-compression').imageCompression.getRecommendedSettings>[0]) => {
    return import('../lib/image-compression').then(({ imageCompression }) =>
      imageCompression.getRecommendedSettings(useCase)
    );
  }, []);

  return {
    compressing,
    progress,
    compressImage,
    compressImages,
    shouldCompress,
    getRecommendedSettings
  };
}