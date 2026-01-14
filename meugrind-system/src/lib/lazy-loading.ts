/**
 * Lazy Loading Utilities
 * 
 * Provides intelligent lazy loading for components, images, and data
 * to optimize performance in the MEUGRIND system.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Lazy image loading hook
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (!isIntersecting) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
}

/**
 * Lazy data loading hook with caching
 */
export function useLazyData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    cacheTime?: number;
    staleTime?: number;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const { enabled = true, cacheTime = 300000, staleTime = 60000 } = options;

  const fetchData = useCallback(async () => {
    const now = Date.now();
    
    // Check if data is still fresh
    if (data && (now - lastFetch) < staleTime) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastFetch(now);
      
      // Cache the result
      if (typeof window !== 'undefined') {
        const cacheKey = `lazy-data-${key}`;
        const cacheData = {
          data: result,
          timestamp: now,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, data, lastFetch, staleTime]);

  // Load from cache on mount
  useEffect(() => {
    if (!enabled) return;

    const loadFromCache = () => {
      if (typeof window === 'undefined') return;

      const cacheKey = `lazy-data-${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          if ((now - timestamp) < cacheTime) {
            setData(cachedData);
            setLastFetch(timestamp);
            return;
          }
        } catch (err) {
          // Invalid cache, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    };

    loadFromCache();
  }, [key, enabled, cacheTime]);

  // Fetch data when enabled
  useEffect(() => {
    if (enabled && !data && !isLoading) {
      fetchData();
    }
  }, [enabled, data, isLoading, fetchData]);

  const refetch = useCallback(() => {
    setData(null);
    setLastFetch(0);
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    if (typeof window !== 'undefined') {
      const cacheKey = `lazy-data-${key}`;
      localStorage.removeItem(cacheKey);
    }
    setData(null);
    setLastFetch(0);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isStale: data && (Date.now() - lastFetch) > staleTime,
  };
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight,
  }));

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex,
  };
}

/**
 * Lazy component loading with dynamic imports
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return React.lazy(importFn);
}

/**
 * Image compression utility
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Lazy loading component wrapper
 */
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyWrapper({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded" />,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyWrapperProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  return (
    <div ref={ref}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

/**
 * Lazy image component
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  fallback?: React.ReactNode;
}

export function LazyImage({
  src,
  placeholder,
  fallback,
  className = '',
  ...props
}: LazyImageProps) {
  const { ref, src: imageSrc, isLoaded, isError } = useLazyImage(src, placeholder);

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <img
        {...props}
        src={imageSrc}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${props.className || ''}`}
        loading="lazy"
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
    </div>
  );
}

/**
 * Bundle splitting utilities
 */
export const bundleSplitting = {
  // Lazy load heavy libraries
  loadChartLibrary: () => import('recharts'),
  loadDateLibrary: () => import('date-fns'),
  loadPDFLibrary: () => import('jspdf'),
  
  // Preload critical resources
  preloadResource: (href: string, as: string = 'script') => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
  
  // Prefetch next page resources
  prefetchPage: (href: string) => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },
};

/**
 * Memory management utilities
 */
export const memoryManagement = {
  // Clean up unused cache entries
  cleanupCache: (maxAge: number = 3600000) => { // 1 hour default
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('lazy-data-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && (now - data.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return keysToRemove.length;
  },
  
  // Monitor memory usage
  getMemoryUsage: () => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }
    
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  },
};