import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'session_expired' | 'permission_denied';
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface SecurityMetrics {
  failedLoginAttempts: number;
  activeSessionsCount: number;
  lastLoginTime?: Date;
  suspiciousActivities: number;
  sessionTimeout: number;
}

interface UseSecurityMonitorOptions {
  maxFailedAttempts?: number;
  sessionTimeoutMinutes?: number;
  enableActivityTracking?: boolean;
  enableLocationTracking?: boolean;
}

interface LocationInfo {
  country?: string;
  city?: string;
  ip?: string;
}

export const useSecurityMonitor = (
  user: User | null,
  session: Session | null,
  options: UseSecurityMonitorOptions = {}
) => {
  const {
    maxFailedAttempts = 5,
    sessionTimeoutMinutes = 60,
    enableActivityTracking = true,
    enableLocationTracking = false
  } = options;

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLoginAttempts: 0,
    activeSessionsCount: 0,
    suspiciousActivities: 0,
    sessionTimeout: sessionTimeoutMinutes * 60 * 1000 // Convert to milliseconds
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const { toast } = useToast();

  // Generate unique event ID
  const generateEventId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Get user's IP and location (if enabled)
  const getUserLocation = useCallback(async (): Promise<LocationInfo> => {
    if (!enableLocationTracking) return {};

    try {
      // Simple IP detection (in production, use a proper geolocation service)
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      
      return {
        ip: data.ip,
        // In production, add proper geolocation lookup
        country: 'Unknown',
        city: 'Unknown'
      };
    } catch (error) {
      console.error('Failed to get user location:', error);
      return {};
    }
  }, [enableLocationTracking]);

  // Log security event
  const logSecurityEvent = useCallback(async (
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    message: string,
    metadata?: Record<string, unknown>
  ) => {
    const event: SecurityEvent = {
      id: generateEventId(),
      type,
      userId: user?.id,
      timestamp: new Date(),
      severity,
      message,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...(enableLocationTracking ? locationInfo : {})
      }
    };

    setSecurityEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events

    // Store in localStorage for persistence across sessions
    try {
      const existingEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      const updatedEvents = [event, ...existingEvents.slice(0, 199)]; // Keep last 200 events
      localStorage.setItem('security_events', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Failed to store security event:', error);
    }

    // Show critical security alerts to user
    if (severity === 'critical' || severity === 'high') {
      toast({
        title: "تنبيه أمني",
        description: message,
        variant: "destructive"
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🔒 Security Event [${severity.toUpperCase()}]:`, {
        type,
        message,
        userId: user?.id,
        metadata
      });
    }
  }, [user?.id, locationInfo, enableLocationTracking, generateEventId, toast]);

  // Check for suspicious activity
  const checkSuspiciousActivity = useCallback(() => {
    const recentEvents = securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );

    const failedLogins = recentEvents.filter(event => event.type === 'failed_login').length;
    const suspiciousEvents = recentEvents.filter(
      event => event.type === 'suspicious_activity'
    ).length;

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      failedLoginAttempts: failedLogins,
      suspiciousActivities: suspiciousEvents
    }));

    // Block user if too many failed attempts
    if (failedLogins >= maxFailedAttempts && !isBlocked) {
      setIsBlocked(true);
      logSecurityEvent(
        'suspicious_activity',
        'critical',
        `حساب محظور بسبب ${failedLogins} محاولات دخول فاشلة`,
        { failedAttempts: failedLogins, blockedAt: new Date().toISOString() }
      );

      // Auto-unblock after 30 minutes (in production, implement proper unblock mechanism)
      setTimeout(() => {
        setIsBlocked(false);
        logSecurityEvent(
          'suspicious_activity',
          'medium',
          'تم رفع الحظر تلقائياً',
          { unblockedAt: new Date().toISOString() }
        );
      }, 30 * 60 * 1000);
    }
  }, [securityEvents, maxFailedAttempts, isBlocked, logSecurityEvent]);

  // Monitor session timeout
  const monitorSessionTimeout = useCallback(() => {
    if (!session || !user) return;

    const sessionStart = new Date(session.refresh_token ? 
      session.refresh_token.split('.')[1] : Date.now());
    const timeSinceStart = Date.now() - sessionStart.getTime();

    if (timeSinceStart > metrics.sessionTimeout) {
      logSecurityEvent(
        'session_expired',
        'medium',
        'انتهت صلاحية الجلسة بسبب انتهاء الوقت المحدد',
        { 
          sessionDuration: timeSinceStart,
          timeoutLimit: metrics.sessionTimeout 
        }
      );

      // Force logout
      supabase.auth.signOut();
    }
  }, [session, user, metrics.sessionTimeout, logSecurityEvent]);

  // Track user activity
  const trackActivity = useCallback((activityType: string, metadata?: Record<string, unknown>) => {
    if (!enableActivityTracking || !user) return;

    const suspiciousPatterns = [
      'rapid_clicks',
      'unusual_navigation',
      'invalid_input_patterns',
      'automated_behavior'
    ];

    if (suspiciousPatterns.includes(activityType)) {
      logSecurityEvent(
        'suspicious_activity',
        'medium',
        `نشاط مشبوه: ${activityType}`,
        { activityType, ...metadata }
      );
    }
  }, [enableActivityTracking, user, logSecurityEvent]);

  // Validate session integrity
  const validateSession = useCallback(async () => {
    if (!session || !user) return true;

    try {
      // Check if session is still valid on server
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        logSecurityEvent(
          'session_expired',
          'high',
          'تم العثور على جلسة غير صالحة',
          { error: error?.message }
        );
        return false;
      }

      // Check for session hijacking indicators
      const currentFingerprint = btoa(navigator.userAgent + navigator.language);
      const storedFingerprint = sessionStorage.getItem('session_fingerprint');
      
      if (storedFingerprint && storedFingerprint !== currentFingerprint) {
        logSecurityEvent(
          'suspicious_activity',
          'critical',
          'تم اكتشاف محاولة اختطاف جلسة محتملة',
          { 
            currentFingerprint: currentFingerprint.slice(0, 20),
            storedFingerprint: storedFingerprint.slice(0, 20)
          }
        );
        
        // Force logout
        supabase.auth.signOut();
        return false;
      }

      // Store fingerprint for future checks
      if (!storedFingerprint) {
        sessionStorage.setItem('session_fingerprint', currentFingerprint);
      }

      return true;
    } catch (error) {
      logSecurityEvent(
        'session_expired',
        'medium',
        'خطأ في التحقق من صحة الجلسة',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      return false;
    }
  }, [session, user, logSecurityEvent]);

  // Initialize security monitoring
  useEffect(() => {
    if (user && session) {
      // Get location info
      getUserLocation().then(setLocationInfo);

      // Load existing events from storage
      try {
        const storedEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
        const validEvents = storedEvents.map((event: Partial<SecurityEvent>) => ({
          ...event,
          timestamp: new Date(event.timestamp || Date.now())
        } as SecurityEvent));
        setSecurityEvents(validEvents.slice(0, 100));
      } catch (error) {
        console.error('Failed to load security events:', error);
      }

      // Log successful login
      logSecurityEvent(
        'login_attempt',
        'low',
        'تسجيل دخول ناجح',
        { 
          loginTime: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 100)
        }
      );

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        lastLoginTime: new Date(),
        activeSessionsCount: 1
      }));
    }
  }, [user, session, getUserLocation, logSecurityEvent]);

  // Periodic security checks
  useEffect(() => {
    if (!user) return;

    const securityInterval = setInterval(() => {
      validateSession();
      monitorSessionTimeout();
      checkSuspiciousActivity();
    }, 60000); // Check every minute

    return () => clearInterval(securityInterval);
  }, [user, validateSession, monitorSessionTimeout, checkSuspiciousActivity]);

  // Security score calculation
  const securityScore = useMemo(() => {
    let score = 100;

    // Deduct points for security issues
    score -= metrics.failedLoginAttempts * 5;
    score -= metrics.suspiciousActivities * 10;
    
    if (isBlocked) score -= 50;
    
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical').length;
    score -= criticalEvents * 15;

    return Math.max(0, Math.min(100, score));
  }, [metrics, isBlocked, securityEvents]);

  // Get recent security alerts
  const recentAlerts = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return securityEvents.filter(
      event => event.timestamp.getTime() > oneDayAgo && 
               ['high', 'critical'].includes(event.severity)
    );
  }, [securityEvents]);

  return {
    // State
    securityEvents: securityEvents.slice(0, 20), // Return recent events
    metrics,
    isBlocked,
    securityScore,
    recentAlerts,
    locationInfo,

    // Methods
    logSecurityEvent,
    trackActivity,
    validateSession,
    
    // Utils
    isSecure: securityScore >= 70,
    needsAttention: recentAlerts.length > 0 || securityScore < 50
  };
};