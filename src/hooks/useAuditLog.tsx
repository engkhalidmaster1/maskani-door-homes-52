import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

interface AuditLogEntry {
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  resource_type: 'property' | 'user' | 'banner' | 'auth' | 'office';
  resource_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Hook لتسجيل العمليات المهمة في النظام (Audit Logging)
 */
export const useAuditLog = () => {
  const { user } = useAuth();

  /**
   * تسجيل عملية في سجل المراجعة
   */
  const logAction = useCallback(async (entry: AuditLogEntry) => {
    // لا نسجل العمليات للمستخدمين غير المسجلين
    if (!user) {
      console.warn('Cannot log audit entry: user not authenticated');
      return false;
    }

    try {
      console.log('Logging audit entry:', entry);

      // استخدام stored function لإدراج سجل المراجعة
      const detailsJson: Json | null = entry.details ? (entry.details as Json) : null;
      const { error } = await supabase.rpc('log_audit_entry', {
        p_action: entry.action,
        p_resource_type: entry.resource_type,
        p_resource_id: entry.resource_id || null,
        p_details: detailsJson,
        p_user_id: user?.id || null
      });

      if (error) {
        console.error('Failed to log audit entry:', error);
        return false;
      }

      console.log('Audit entry logged successfully');
      return true;
    } catch (error) {
      console.error('Error in audit logging:', error);
      return false;
    }
  }, [user]);

  /**
   * تسجيل عمليات متعلقة بالعقارات
   */
  const logPropertyAction = useCallback((
    action: 'create' | 'update' | 'delete' | 'view',
    propertyId: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'property',
      resource_id: propertyId,
      details
    });
  }, [logAction]);

  /**
   * تسجيل عمليات المصادقة
   */
  const logAuthAction = useCallback((
    action: 'login' | 'logout',
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'auth',
      details
    });
  }, [logAction]);

  /**
   * تسجيل عمليات متعلقة بالمستخدمين
   */
  const logUserAction = useCallback((
    action: 'create' | 'update' | 'delete',
    userId: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'user',
      resource_id: userId,
      details
    });
  }, [logAction]);

  /**
   * تسجيل عمليات متعلقة بالإعلانات/البانر
   */
  const logBannerAction = useCallback((
    action: 'create' | 'update' | 'delete',
    bannerId?: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'banner',
      resource_id: bannerId,
      details
    });
  }, [logAction]);

  /**
   * تسجيل عمليات متعلقة بالمكاتب العقارية
   */
  const logOfficeAction = useCallback((
    action: 'create' | 'update' | 'delete' | 'view',
    officeId: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'office',
      resource_id: officeId,
      details
    });
  }, [logAction]);

  return {
    logAction,
    logPropertyAction,
    logAuthAction,
    logUserAction,
    logBannerAction,
    logOfficeAction
  };
};