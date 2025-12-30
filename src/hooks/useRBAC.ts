import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import { rbacManager, Role, Permission, UserRole, AccessContext } from '@/services/rbacManager';
import { useAuth } from './useAuth';

interface UseRBACOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

interface UseRBACReturn {
  // Permission checks
  hasPermission: (permissionId: string, context?: Partial<AccessContext>) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  
  // Role checks
  hasRole: (roleId: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  highestRole: Role | null;
  
  // User data
  userRoles: UserRole[];
  userPermissions: Permission[];
  
  // Navigation
  allowedNavigation: Array<{
    id: string;
    label: string;
    path: string;
    icon?: string;
    permissions: string[];
  }>;
  
  // Actions
  checkAccess: (resource: string, action: string, context?: Partial<AccessContext>) => boolean;
  refreshPermissions: () => void;
  
  // State
  isLoading: boolean;
  error: string | null;
}

export const useRBAC = (options: UseRBACOptions = {}): UseRBACReturn => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    refreshInterval = 30000,
    enableAutoRefresh = true
  } = options;

  // Get user ID
  const userId = user?.id || 'guest';

  // Memoized user roles
  const userRoles = useMemo(() => {
    try {
      setIsLoading(true);
      const roles = rbacManager.getUserRoles(userId);
      setError(null);
      return refreshTrigger ? roles : roles;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user roles');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshTrigger]);

  // Memoized user permissions
  const userPermissions = useMemo(() => {
    try {
      const permissions = rbacManager.getUserPermissions(userId);
      return refreshTrigger ? permissions : permissions;
    } catch (err) {
      console.error('Failed to get user permissions:', err);
      return [];
    }
  }, [userId, refreshTrigger]);

  // Memoized highest role
  const highestRole = useMemo(() => {
    try {
      const currentHighestRole = rbacManager.getUserHighestRole(userId);
      return refreshTrigger ? currentHighestRole : currentHighestRole;
    } catch (err) {
      console.error('Failed to get highest role:', err);
      return null;
    }
  }, [userId, refreshTrigger]);

  // Memoized admin checks
  const isAdmin = useMemo(() => {
    const adminStatus = rbacManager.isAdmin(userId);
    return refreshTrigger ? adminStatus : adminStatus;
  }, [userId, refreshTrigger]);

  const isSuperAdmin = useMemo(() => {
    const superAdminStatus = rbacManager.isSuperAdmin(userId);
    return refreshTrigger ? superAdminStatus : superAdminStatus;
  }, [userId, refreshTrigger]);

  // Memoized navigation
  const allowedNavigation = useMemo(() => {
    try {
      const navigation = rbacManager.getNavigationForUser(userId);
      return refreshTrigger ? navigation : navigation;
    } catch (err) {
      console.error('Failed to get navigation:', err);
      return [];
    }
  }, [userId, refreshTrigger]);

  // Permission check functions
  const hasPermission = useCallback((
    permissionId: string, 
    context?: Partial<AccessContext>
  ): boolean => {
    try {
      return rbacManager.hasPermission(userId, permissionId, context);
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }, [userId]);

  const hasAnyPermission = useCallback((permissionIds: string[]): boolean => {
    return permissionIds.some(permissionId => hasPermission(permissionId));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionIds: string[]): boolean => {
    return permissionIds.every(permissionId => hasPermission(permissionId));
  }, [hasPermission]);

  const hasRole = useCallback((roleId: string): boolean => {
    return userRoles.some(ur => ur.roleId === roleId && ur.isActive);
  }, [userRoles]);

  // Access check function
  const checkAccess = useCallback((
    resource: string, 
    action: string, 
    context?: Partial<AccessContext>
  ): boolean => {
    const permissionId = `${resource}:${action}`;
    return hasPermission(permissionId, context);
  }, [hasPermission]);

  // Refresh function
  const refreshPermissions = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      refreshPermissions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, refreshPermissions]);

  // Initial load effect
  useEffect(() => {
    if (userId) {
      refreshPermissions();
    }
  }, [userId, refreshPermissions]);

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checks
    hasRole,
    isAdmin,
    isSuperAdmin,
    highestRole,
    
    // User data
    userRoles,
    userPermissions,
    
    // Navigation
    allowedNavigation,
    
    // Actions
    checkAccess,
    refreshPermissions,
    
    // State
    isLoading,
    error
  };
};

// Permission validator function
export const validatePermission = (
  userId: string,
  permissionId: string,
  context?: Partial<AccessContext>
): boolean => {
  try {
    return rbacManager.hasPermission(userId, permissionId, context);
  } catch (error) {
    console.error('Permission validation failed:', error);
    return false;
  }
};

// Hook for role-based rendering
export const usePermissionCheck = (permissionId: string): boolean => {
  const { hasPermission } = useRBAC();
  return hasPermission(permissionId);
};

// Hook for multiple permission checks
export const useMultiPermissionCheck = (
  permissionIds: string[],
  requireAll = false
): boolean => {
  const { hasAllPermissions, hasAnyPermission } = useRBAC();
  
  return requireAll 
    ? hasAllPermissions(permissionIds) 
    : hasAnyPermission(permissionIds);
};

// Hook for access control with context
export const useAccessControl = () => {
  const { checkAccess, hasPermission } = useRBAC();
  const { user } = useAuth();

  const checkResourceAccess = useCallback((
    resource: string,
    action: string,
    data?: Record<string, unknown>
  ): boolean => {
    const context: Partial<AccessContext> = {
      userId: user?.id,
      resource,
      action,
      data
    };

    return checkAccess(resource, action, context);
  }, [checkAccess, user?.id]);

  const canCreateProperty = useCallback((): boolean => {
    return hasPermission('property:create');
  }, [hasPermission]);

  const canEditProperty = useCallback((propertyId?: string, ownerId?: string): boolean => {
    const hasUpdatePermission = hasPermission('property:update');
    
    // Check if user owns the property
    if (propertyId && ownerId && user?.id === ownerId) {
      return hasUpdatePermission;
    }
    
    // Check if user has admin permissions
    if (hasPermission('admin:dashboard')) {
      return true;
    }
    
    return hasUpdatePermission;
  }, [hasPermission, user?.id]);

  const canDeleteProperty = useCallback((propertyId?: string, ownerId?: string): boolean => {
    const hasDeletePermission = hasPermission('property:delete');
    
    // Check if user owns the property
    if (propertyId && ownerId && user?.id === ownerId) {
      return hasDeletePermission;
    }
    
    // Check if user has admin permissions
    if (hasPermission('admin:dashboard')) {
      return true;
    }
    
    return hasDeletePermission;
  }, [hasPermission, user?.id]);

  const canManageUsers = useCallback((): boolean => {
    return hasPermission('user:read') || hasPermission('admin:dashboard');
  }, [hasPermission]);

  const canAccessAdminPanel = useCallback((): boolean => {
    return hasPermission('admin:dashboard');
  }, [hasPermission]);

  return {
    checkResourceAccess,
    canCreateProperty,
    canEditProperty,
    canDeleteProperty,
    canManageUsers,
    canAccessAdminPanel
  };
};