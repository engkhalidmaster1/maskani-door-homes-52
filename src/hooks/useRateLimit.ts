import { useState, useCallback, useEffect, useMemo } from 'react';

interface RateLimitRule {
  id: string;
  endpoint: string;
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded
  skipSuccessful?: boolean; // Skip counting successful responses
  message?: string;
}

interface RequestLog {
  timestamp: number;
  endpoint: string;
  success: boolean;
  ip?: string;
}

interface RateLimitStatus {
  remaining: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

interface UseRateLimitOptions {
  rules: RateLimitRule[];
  enableLogging?: boolean;
  persistAcrossReloads?: boolean;
  onLimitExceeded?: (rule: RateLimitRule, status: RateLimitStatus) => void;
  onBlockExpired?: (rule: RateLimitRule) => void;
}

interface RateLimitResult {
  isAllowed: boolean;
  status: RateLimitStatus;
  rule: RateLimitRule;
}

// Default rate limit rules
const DEFAULT_RULES: RateLimitRule[] = [
  {
    id: 'api_general',
    endpoint: '/api/**',
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
    message: 'تم تجاوز الحد المسموح للطلبات. حاول مرة أخرى بعد قليل.'
  },
  {
    id: 'auth_login',
    endpoint: '/auth/login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    skipSuccessful: true, // Only count failed login attempts
    message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح. حسابك محظور مؤقتاً.'
  },
  {
    id: 'auth_signup',
    endpoint: '/auth/signup',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    message: 'تم تجاوز عدد محاولات إنشاء الحساب المسموح لهذا اليوم.'
  },
  {
    id: 'property_add',
    endpoint: '/properties/add',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    message: 'تم تجاوز عدد العقارات المسموح إضافتها في الساعة.'
  },
  {
    id: 'property_search',
    endpoint: '/properties/search',
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'تم تجاوز عدد عمليات البحث المسموح. حاول مرة أخرى بعد قليل.'
  },
  {
    id: 'image_upload',
    endpoint: '/upload/**',
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    message: 'تم تجاوز عدد الصور المسموح رفعها في الساعة.'
  }
];

export const useRateLimit = (options: UseRateLimitOptions = { rules: DEFAULT_RULES }) => {
  const {
    rules = DEFAULT_RULES,
    enableLogging = true,
    persistAcrossReloads = true,
    onLimitExceeded,
    onBlockExpired
  } = options;

  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [blockedEndpoints, setBlockedEndpoints] = useState<Map<string, number>>(new Map());

  // Storage keys
  const LOGS_STORAGE_KEY = 'rate_limit_logs';
  const BLOCKS_STORAGE_KEY = 'rate_limit_blocks';

  // Load persisted data on mount
  useEffect(() => {
    if (!persistAcrossReloads) return;

    try {
      // Load request logs
      const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (savedLogs) {
        const logs: RequestLog[] = JSON.parse(savedLogs);
        // Filter out old logs (older than maximum window)
        const maxWindow = Math.max(...rules.map(r => r.windowMs));
        const cutoff = Date.now() - maxWindow;
        const validLogs = logs.filter(log => log.timestamp > cutoff);
        setRequestLogs(validLogs);
      }

      // Load blocked endpoints
      const savedBlocks = localStorage.getItem(BLOCKS_STORAGE_KEY);
      if (savedBlocks) {
        const blocks = new Map(JSON.parse(savedBlocks));
        // Remove expired blocks
        const now = Date.now();
        const activeBlocks = new Map();
        
        blocks.forEach((blockUntil: unknown, endpoint) => {
          const blockTime = typeof blockUntil === 'number' ? blockUntil : 0;
          if (blockTime > now) {
            activeBlocks.set(endpoint, blockTime);
          }
        });
        
        setBlockedEndpoints(activeBlocks);
      }
    } catch (error) {
      console.error('Failed to load rate limit data:', error);
    }
  }, [rules, persistAcrossReloads]);

  // Persist data when it changes
  useEffect(() => {
    if (!persistAcrossReloads) return;

    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(requestLogs));
    } catch (error) {
      console.error('Failed to persist request logs:', error);
    }
  }, [requestLogs, persistAcrossReloads]);

  useEffect(() => {
    if (!persistAcrossReloads) return;

    try {
      localStorage.setItem(
        BLOCKS_STORAGE_KEY, 
        JSON.stringify(Array.from(blockedEndpoints.entries()))
      );
    } catch (error) {
      console.error('Failed to persist blocks:', error);
    }
  }, [blockedEndpoints, persistAcrossReloads]);

  // Match endpoint pattern
  const matchEndpoint = useCallback((pattern: string, endpoint: string): boolean => {
    // Simple glob matching (* and **)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** matches everything
      .replace(/\*/g, '[^/]*') // * matches everything except /
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }, []);

  // Find applicable rule for endpoint
  const findRule = useCallback((endpoint: string): RateLimitRule | null => {
    return rules.find(rule => matchEndpoint(rule.endpoint, endpoint)) || null;
  }, [rules, matchEndpoint]);

  // Clean up old logs periodically
  useEffect(() => {
    const cleanup = () => {
      const maxWindow = Math.max(...rules.map(r => r.windowMs));
      const cutoff = Date.now() - maxWindow * 2; // Keep logs for 2x the longest window
      
      setRequestLogs(prev => prev.filter(log => log.timestamp > cutoff));
      
      // Clean up expired blocks
      const now = Date.now();
      setBlockedEndpoints(prev => {
        const newMap = new Map(prev);
        prev.forEach((blockUntil, endpoint) => {
          if (blockUntil <= now) {
            newMap.delete(endpoint);
            
            // Notify about expired block
            const rule = rules.find(r => matchEndpoint(r.endpoint, endpoint));
            if (rule && onBlockExpired) {
              onBlockExpired(rule);
            }
          }
        });
        return newMap;
      });
    };

    // Cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [rules, onBlockExpired, matchEndpoint]);

  // Get current status for a rule
  const getRuleStatus = useCallback((rule: RateLimitRule, endpoint: string): RateLimitStatus => {
    const now = Date.now();
    const windowStart = now - rule.windowMs;
    
    // Check if endpoint is currently blocked
    const blockUntil = blockedEndpoints.get(endpoint);
    if (blockUntil && blockUntil > now) {
      return {
        remaining: 0,
        resetTime: windowStart + rule.windowMs,
        blocked: true,
        blockUntil
      };
    }

    // Count requests in current window
    const relevantLogs = requestLogs.filter(log => 
      matchEndpoint(rule.endpoint, log.endpoint) &&
      log.timestamp > windowStart &&
      (!rule.skipSuccessful || !log.success)
    );

    const remaining = Math.max(0, rule.maxRequests - relevantLogs.length);

    return {
      remaining,
      resetTime: windowStart + rule.windowMs,
      blocked: false
    };
  }, [requestLogs, blockedEndpoints, matchEndpoint]);

  // Check if request is allowed
  const checkLimit = useCallback((endpoint: string): RateLimitResult => {
    const rule = findRule(endpoint);
    
    if (!rule) {
      // No rule found, allow request
      return {
        isAllowed: true,
        status: {
          remaining: Infinity,
          resetTime: Date.now(),
          blocked: false
        },
        rule: {
          id: 'default',
          endpoint: '**',
          maxRequests: Infinity,
          windowMs: 0
        }
      };
    }

    const status = getRuleStatus(rule, endpoint);
    const isAllowed = !status.blocked && status.remaining > 0;

    return {
      isAllowed,
      status,
      rule
    };
  }, [findRule, getRuleStatus]);

  // Record a request
  const recordRequest = useCallback((
    endpoint: string,
    success: boolean = true,
    ip?: string
  ): RateLimitResult => {
    const result = checkLimit(endpoint);
    
    if (result.isAllowed) {
      // Record the request
      const log: RequestLog = {
        timestamp: Date.now(),
        endpoint,
        success,
        ip
      };
      
      setRequestLogs(prev => [...prev, log]);
      
      if (enableLogging) {
        console.log(`📊 Rate Limit - Request recorded:`, {
          endpoint,
          success,
          remaining: result.status.remaining - 1,
          rule: result.rule.id
        });
      }
    } else {
      // Request not allowed
      if (!result.status.blocked && result.rule.blockDurationMs) {
        // Apply block
        const blockUntil = Date.now() + result.rule.blockDurationMs;
        setBlockedEndpoints(prev => new Map(prev).set(endpoint, blockUntil));
        
        if (onLimitExceeded) {
          onLimitExceeded(result.rule, {
            ...result.status,
            blocked: true,
            blockUntil
          });
        }
        
        if (enableLogging) {
          console.warn(`🚫 Rate Limit - Endpoint blocked:`, {
            endpoint,
            rule: result.rule.id,
            blockUntil: new Date(blockUntil).toISOString()
          });
        }
      }
    }
    
    return result;
  }, [checkLimit, enableLogging, onLimitExceeded]);

  // Get statistics for all rules
  const getStatistics = useMemo(() => {
    const stats = rules.map(rule => {
      const now = Date.now();
      const windowStart = now - rule.windowMs;
      
      const relevantLogs = requestLogs.filter(log =>
        matchEndpoint(rule.endpoint, log.endpoint) &&
        log.timestamp > windowStart
      );
      
      const successfulRequests = relevantLogs.filter(log => log.success).length;
      const failedRequests = relevantLogs.filter(log => !log.success).length;
      
      const status = getRuleStatus(rule, rule.endpoint);
      
      return {
        ruleId: rule.id,
        endpoint: rule.endpoint,
        totalRequests: relevantLogs.length,
        successfulRequests,
        failedRequests,
        remaining: status.remaining,
        maxRequests: rule.maxRequests,
        windowMs: rule.windowMs,
        utilizationPercent: ((rule.maxRequests - status.remaining) / rule.maxRequests) * 100,
        blocked: status.blocked,
        blockUntil: status.blockUntil
      };
    });
    
    return stats;
  }, [rules, requestLogs, matchEndpoint, getRuleStatus]);

  // Reset specific endpoint
  const resetEndpoint = useCallback((endpoint: string) => {
    setRequestLogs(prev => prev.filter(log => !matchEndpoint(endpoint, log.endpoint)));
    setBlockedEndpoints(prev => {
      const newMap = new Map(prev);
      newMap.delete(endpoint);
      return newMap;
    });
    
    if (enableLogging) {
      console.log(`🔄 Rate Limit - Reset endpoint: ${endpoint}`);
    }
  }, [matchEndpoint, enableLogging]);

  // Reset all limits
  const resetAll = useCallback(() => {
    setRequestLogs([]);
    setBlockedEndpoints(new Map());
    
    if (persistAcrossReloads) {
      localStorage.removeItem(LOGS_STORAGE_KEY);
      localStorage.removeItem(BLOCKS_STORAGE_KEY);
    }
    
    if (enableLogging) {
      console.log('🔄 Rate Limit - Reset all limits');
    }
  }, [persistAcrossReloads, enableLogging]);

  return {
    // Main methods
    checkLimit,
    recordRequest,
    
    // Utils
    resetEndpoint,
    resetAll,
    
    // Data
    statistics: getStatistics,
    blockedEndpoints: Array.from(blockedEndpoints.entries()),
    
    // Status
    hasActiveBlocks: blockedEndpoints.size > 0,
    totalRequests: requestLogs.length
  };
};