import { useEffect, useState, useCallback } from 'react';

// Type definitions
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Extend interfaces
declare global {
  interface Window {
    gc?: () => void;
  }
  
  interface Performance {
    memory?: PerformanceMemory;
  }
}

interface PerformanceMetrics {
  // Memory metrics
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercentage: number;
  
  // Performance metrics
  loadTime: number;
  renderTime: number;
  navigationTiming?: PerformanceNavigationTiming;
  
  // Component metrics
  componentMountTime: number;
  rerenderCount: number;
}

interface UsePerformanceMonitorOptions {
  enableMemoryTracking?: boolean;
  enableRenderTracking?: boolean;
  logToConsole?: boolean;
  warningThreshold?: number; // Memory usage percentage warning threshold
}

export const usePerformanceMonitor = (
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    enableMemoryTracking = true,
    enableRenderTracking = true,
    logToConsole = process.env.NODE_ENV === 'development',
    warningThreshold = 80
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [mountTime] = useState(Date.now());
  const [renderCount, setRenderCount] = useState(0);

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking || !performance.memory) return null;
    
    const memory = performance.memory;
    const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryUsagePercentage
    };
  }, [enableMemoryTracking]);

  // Track navigation timing
  const getNavigationTiming = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation;
  }, []);

  // Calculate load time
  const calculateLoadTime = useCallback(() => {
    const navigation = getNavigationTiming();
    return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
  }, [getNavigationTiming]);

  // Log performance warning
  const logWarning = useCallback((message: string, data?: Record<string, unknown>) => {
    if (logToConsole) {
      console.warn(`🔔 Performance Warning [${componentName}]: ${message}`, data);
    }
  }, [logToConsole, componentName]);

  // Log performance info
  const logInfo = useCallback((message: string, data?: Record<string, unknown>) => {
    if (logToConsole) {
      console.info(`📊 Performance Info [${componentName}]: ${message}`, data);
    }
  }, [logToConsole, componentName]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    const memoryMetrics = trackMemoryUsage();
    const navigation = getNavigationTiming();
    
    const newMetrics: PerformanceMetrics = {
      ...memoryMetrics,
      loadTime: calculateLoadTime(),
      renderTime: Date.now() - mountTime,
      navigationTiming: navigation,
      componentMountTime: mountTime,
      rerenderCount: renderCount,
      memoryUsagePercentage: memoryMetrics?.memoryUsagePercentage || 0,
      usedJSHeapSize: memoryMetrics?.usedJSHeapSize || 0,
      totalJSHeapSize: memoryMetrics?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memoryMetrics?.jsHeapSizeLimit || 0
    };

    setMetrics(newMetrics);

    // Check for performance issues
    if (memoryMetrics && memoryMetrics.memoryUsagePercentage > warningThreshold) {
      logWarning(`High memory usage: ${memoryMetrics.memoryUsagePercentage.toFixed(2)}%`, {
        used: `${(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memoryMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }

    if (renderCount > 50) {
      logWarning(`High render count: ${renderCount} re-renders`);
    }

  }, [trackMemoryUsage, getNavigationTiming, calculateLoadTime, mountTime, renderCount, warningThreshold, logWarning]);

  // Track renders
  useEffect(() => {
    if (enableRenderTracking) {
      setRenderCount(prev => {
        const newCount = prev + 1;
        if (newCount === 1) {
          logInfo('Component mounted');
        } else if (newCount % 10 === 0) {
          logInfo(`Render count: ${newCount}`);
        }
        return newCount;
      });
    }
  }, [enableRenderTracking, logInfo]);

  // Update metrics on component updates
  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logInfo('Component unmounted', {
        totalRenders: renderCount,
        totalLifetime: Date.now() - mountTime
      });
    };
  }, [logInfo, renderCount, mountTime]);

  // Force garbage collection (only works in Chrome DevTools)
  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
      logInfo('Forced garbage collection');
      setTimeout(updateMetrics, 100);
    } else {
      logWarning('Garbage collection not available. Enable in Chrome DevTools.');
    }
  }, [updateMetrics, logInfo, logWarning]);

  // Get formatted memory info
  const getFormattedMemoryInfo = useCallback(() => {
    if (!metrics) return null;
    
    return {
      used: `${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${metrics.memoryUsagePercentage.toFixed(2)}%`
    };
  }, [metrics]);

  // Check if performance is healthy
  const isPerformanceHealthy = useCallback(() => {
    if (!metrics) return true;
    
    return (
      metrics.memoryUsagePercentage < warningThreshold &&
      renderCount < 100 &&
      metrics.renderTime < 5000
    );
  }, [metrics, warningThreshold, renderCount]);

  return {
    metrics,
    renderCount,
    isPerformanceHealthy: isPerformanceHealthy(),
    getFormattedMemoryInfo,
    forceGarbageCollection,
    updateMetrics
  };
};