import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const imageCache = new MemoryCache<string>();
const dataCache = new MemoryCache<unknown>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  imageCache.cleanup();
  dataCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Hook for caching image URLs and blob data
 */
export const useImageCache = () => {
  const cacheImage = useCallback((url: string, blob: string, ttl?: number) => {
    imageCache.set(url, blob, ttl);
  }, []);

  const getCachedImage = useCallback((url: string): string | null => {
    return imageCache.get(url);
  }, []);

  const hasCachedImage = useCallback((url: string): boolean => {
    return imageCache.has(url);
  }, []);

  const clearImageCache = useCallback(() => {
    imageCache.clear();
  }, []);

  return {
    cacheImage,
    getCachedImage,
    hasCachedImage,
    clearImageCache,
  };
};

/**
 * Hook for caching API data
 */
export const useDataCache = <T,>() => {
  const cacheData = useCallback((key: string, data: T, ttl?: number) => {
    dataCache.set(key, data, ttl);
  }, []);

  const getCachedData = useCallback((key: string): T | null => {
    const cached = dataCache.get(key);
    return (cached as T | null) ?? null;
  }, []);

  const hasCachedData = useCallback((key: string): boolean => {
    return dataCache.has(key);
  }, []);

  const clearDataCache = useCallback((key?: string) => {
    if (key) {
      dataCache.delete(key);
    } else {
      dataCache.clear();
    }
  }, []);

  return {
    cacheData,
    getCachedData,
    hasCachedData,
    clearDataCache,
  };
};

/**
 * Hook for cached data fetching with automatic caching
 */
export const useCachedFetch = <T,>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { cacheData, getCachedData, hasCachedData } = useDataCache<T>();

  const { ttl = 5 * 60 * 1000, enabled = true, onSuccess, onError } = options;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    if (!force && hasCachedData(key)) {
      const cachedData = getCachedData(key);
      if (cachedData) {
        setData(cachedData);
        onSuccess?.(cachedData);
        return cachedData;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      cacheData(key, result, ttl);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl, enabled, cacheData, getCachedData, hasCachedData, onSuccess, onError]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    fetchData,
  };
};