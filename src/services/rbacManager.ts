/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and access control
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  priority: number;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AccessContext {
  userId: string;
  resource: string;
  action: string;
  data?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Default system permissions
 */
export const DEFAULT_PERMISSIONS: Permission[] = [
  // Property Management
  {
    id: 'property:read',
    name: 'قراءة العقارات',
    description: 'عرض تفاصيل العقارات',
    resource: 'property',
    action: 'read'
  },
  {
    id: 'property:create',
    name: 'إنشاء عقار',
    description: 'إضافة عقارات جديدة',
    resource: 'property',
    action: 'create'
  },
  {
    id: 'property:update',
    name: 'تحديث العقار',
    description: 'تعديل تفاصيل العقارات',
    resource: 'property',
    action: 'update'
  },
  {
    id: 'property:delete',
    name: 'حذف العقار',
    description: 'حذف العقارات',
    resource: 'property',
    action: 'delete'
  },
  {
    id: 'property:publish',
    name: 'نشر العقار',
    description: 'نشر أو إلغاء نشر العقارات',
    resource: 'property',
    action: 'publish'
  },

  // User Management
  {
    id: 'user:read',
    name: 'قراءة المستخدمين',
    description: 'عرض قائمة المستخدمين',
    resource: 'user',
    action: 'read'
  },
  {
    id: 'user:create',
    name: 'إنشاء مستخدم',
    description: 'إضافة مستخدمين جدد',
    resource: 'user',
    action: 'create'
  },
  {
    id: 'user:update',
    name: 'تحديث المستخدم',
    description: 'تعديل بيانات المستخدمين',
    resource: 'user',
    action: 'update'
  },
  {
    id: 'user:delete',
    name: 'حذف المستخدم',
    description: 'حذف المستخدمين',
    resource: 'user',
    action: 'delete'
  },
  {
    id: 'user:ban',
    name: 'حظر المستخدم',
    description: 'حظر أو إلغاء حظر المستخدمين',
    resource: 'user',
    action: 'ban'
  },

  // Office Management
  {
    id: 'office:read',
    name: 'قراءة المكاتب',
    description: 'عرض تفاصيل المكاتب',
    resource: 'office',
    action: 'read'
  },
  {
    id: 'office:create',
    name: 'إنشاء مكتب',
    description: 'إضافة مكاتب جديدة',
    resource: 'office',
    action: 'create'
  },
  {
    id: 'office:update',
    name: 'تحديث المكتب',
    description: 'تعديل تفاصيل المكاتب',
    resource: 'office',
    action: 'update'
  },
  {
    id: 'office:delete',
    name: 'حذف المكتب',
    description: 'حذف المكاتب',
    resource: 'office',
    action: 'delete'
  },

  // Admin Functions
  {
    id: 'admin:dashboard',
    name: 'لوحة الإدارة',
    description: 'الوصول للوحة التحكم الإدارية',
    resource: 'admin',
    action: 'dashboard'
  },
  {
    id: 'admin:settings',
    name: 'إعدادات النظام',
    description: 'تعديل إعدادات النظام',
    resource: 'admin',
    action: 'settings'
  },
  {
    id: 'admin:reports',
    name: 'التقارير',
    description: 'عرض وتصدير التقارير',
    resource: 'admin',
    action: 'reports'
  },
  {
    id: 'admin:audit',
    name: 'سجل التدقيق',
    description: 'عرض سجلات التدقيق الأمني',
    resource: 'admin',
    action: 'audit'
  }
];

/**
 * Default system roles
 */
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'guest',
    name: 'زائر',
    description: 'مستخدم غير مسجل - صلاحيات محدودة',
    permissions: ['property:read'],
    isSystem: true,
    priority: 0
  },
  {
    id: 'user',
    name: 'مستخدم',
    description: 'مستخدم عادي مسجل',
    permissions: [
      'property:read',
      'property:create'
    ],
    isSystem: true,
    priority: 10
  },
  {
    id: 'agent',
    name: 'وسيط عقاري',
    description: 'وسيط عقاري معتمد',
    permissions: [
      'property:read',
      'property:create',
      'property:update',
      'property:publish',
      'office:read'
    ],
    isSystem: true,
    priority: 20
  },
  {
    id: 'office_admin',
    name: 'مدير مكتب',
    description: 'مدير مكتب عقاري',
    permissions: [
      'property:read',
      'property:create',
      'property:update',
      'property:delete',
      'property:publish',
      'office:read',
      'office:update',
      'user:read'
    ],
    isSystem: true,
    priority: 30
  },
  {
    id: 'moderator',
    name: 'مشرف',
    description: 'مشرف على المحتوى',
    permissions: [
      'property:read',
      'property:update',
      'property:delete',
      'property:publish',
      'user:read',
      'user:ban',
      'office:read'
    ],
    isSystem: true,
    priority: 40
  },
  {
    id: 'admin',
    name: 'مدير عام',
    description: 'مدير عام للنظام',
    permissions: [
      'property:read',
      'property:create',
      'property:update',
      'property:delete',
      'property:publish',
      'user:read',
      'user:create',
      'user:update',
      'user:delete',
      'user:ban',
      'office:read',
      'office:create',
      'office:update',
      'office:delete',
      'admin:dashboard',
      'admin:settings',
      'admin:reports'
    ],
    isSystem: true,
    priority: 50
  },
  {
    id: 'super_admin',
    name: 'مدير أعلى',
    description: 'مدير أعلى - جميع الصلاحيات',
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isSystem: true,
    priority: 100
  }
];

/**
 * RBAC Manager Class
 */
export class RBACManager {
  private static instance: RBACManager;
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  private constructor() {
    this.initializeDefaults();
    this.loadFromStorage();
  }

  public static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }

  /**
   * Initialize default permissions and roles
   */
  private initializeDefaults(): void {
    // Load default permissions
    DEFAULT_PERMISSIONS.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });

    // Load default roles
    DEFAULT_ROLES.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Load RBAC data from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load custom permissions
      const storedPermissions = localStorage.getItem('rbac_permissions');
      if (storedPermissions) {
        const customPermissions: Permission[] = JSON.parse(storedPermissions);
        customPermissions.forEach(permission => {
          this.permissions.set(permission.id, permission);
        });
      }

      // Load custom roles
      const storedRoles = localStorage.getItem('rbac_roles');
      if (storedRoles) {
        const customRoles: Role[] = JSON.parse(storedRoles);
        customRoles.forEach(role => {
          this.roles.set(role.id, role);
        });
      }

      // Load user role assignments
      const storedUserRoles = localStorage.getItem('rbac_user_roles');
      if (storedUserRoles) {
        const userRolesData: Record<string, UserRole[]> = JSON.parse(storedUserRoles);
        Object.entries(userRolesData).forEach(([userId, roles]) => {
          this.userRoles.set(userId, roles.map(role => ({
            ...role,
            assignedAt: new Date(role.assignedAt),
            expiresAt: role.expiresAt ? new Date(role.expiresAt) : undefined
          })));
        });
      }
    } catch (error) {
      console.error('Failed to load RBAC data from storage:', error);
    }
  }

  /**
   * Save RBAC data to localStorage
   */
  private saveToStorage(): void {
    try {
      // Save custom permissions (non-system only)
      const customPermissions = Array.from(this.permissions.values()).filter(
        p => !DEFAULT_PERMISSIONS.find(dp => dp.id === p.id)
      );
      localStorage.setItem('rbac_permissions', JSON.stringify(customPermissions));

      // Save custom roles (non-system only)
      const customRoles = Array.from(this.roles.values()).filter(r => !r.isSystem);
      localStorage.setItem('rbac_roles', JSON.stringify(customRoles));

      // Save user role assignments
      const userRolesData: Record<string, UserRole[]> = {};
      this.userRoles.forEach((roles, userId) => {
        userRolesData[userId] = roles;
      });
      localStorage.setItem('rbac_user_roles', JSON.stringify(userRolesData));
    } catch (error) {
      console.error('Failed to save RBAC data to storage:', error);
    }
  }

  /**
   * Check if user has permission
   */
  public hasPermission(
    userId: string, 
    permissionId: string, 
    context?: Partial<AccessContext>
  ): boolean {
    try {
      const userRoles = this.getUserRoles(userId);
      
      for (const userRole of userRoles) {
        if (!userRole.isActive) continue;
        
        // Check if role has expired
        if (userRole.expiresAt && userRole.expiresAt < new Date()) {
          continue;
        }

        const role = this.roles.get(userRole.roleId);
        if (!role) continue;

        if (role.permissions.includes(permissionId)) {
          // Additional context-based checks can be added here
          if (context && this.checkPermissionContext(permissionId, context)) {
            return true;
          } else if (!context) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Check permission with context conditions
   */
  private checkPermissionContext(
    permissionId: string, 
    context: Partial<AccessContext>
  ): boolean {
    const permission = this.permissions.get(permissionId);
    if (!permission?.conditions) return true;

    // Implement context-based permission checks
    // This can include IP restrictions, time-based access, data ownership, etc.
    
    return true; // Simplified for now
  }

  /**
   * Get user roles
   */
  public getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Get user permissions
   */
  public getUserPermissions(userId: string): Permission[] {
    const userRoles = this.getUserRoles(userId);
    const permissionIds = new Set<string>();

    userRoles.forEach(userRole => {
      if (!userRole.isActive) return;
      
      // Check if role has expired
      if (userRole.expiresAt && userRole.expiresAt < new Date()) {
        return;
      }

      const role = this.roles.get(userRole.roleId);
      if (role) {
        role.permissions.forEach(permissionId => {
          permissionIds.add(permissionId);
        });
      }
    });

    return Array.from(permissionIds).map(id => this.permissions.get(id)!).filter(Boolean);
  }

  /**
   * Assign role to user
   */
  public assignRole(
    userId: string, 
    roleId: string, 
    assignedBy: string, 
    expiresAt?: Date
  ): boolean {
    try {
      if (!this.roles.has(roleId)) {
        throw new Error(`Role ${roleId} does not exist`);
      }

      const userRoles = this.getUserRoles(userId);
      
      // Check if user already has this role
      const existingRole = userRoles.find(ur => ur.roleId === roleId && ur.isActive);
      if (existingRole) {
        return false; // Role already assigned
      }

      const newUserRole: UserRole = {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
        expiresAt,
        isActive: true
      };

      userRoles.push(newUserRole);
      this.userRoles.set(userId, userRoles);
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to assign role:', error);
      return false;
    }
  }

  /**
   * Revoke role from user
   */
  public revokeRole(userId: string, roleId: string): boolean {
    try {
      const userRoles = this.getUserRoles(userId);
      const updatedRoles = userRoles.map(ur => {
        if (ur.roleId === roleId && ur.isActive) {
          return { ...ur, isActive: false };
        }
        return ur;
      });

      this.userRoles.set(userId, updatedRoles);
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to revoke role:', error);
      return false;
    }
  }

  /**
   * Get user's highest priority role
   */
  public getUserHighestRole(userId: string): Role | null {
    const userRoles = this.getUserRoles(userId);
    let highestRole: Role | null = null;
    let highestPriority = -1;

    userRoles.forEach(userRole => {
      if (!userRole.isActive) return;
      
      // Check if role has expired
      if (userRole.expiresAt && userRole.expiresAt < new Date()) {
        return;
      }

      const role = this.roles.get(userRole.roleId);
      if (role && role.priority > highestPriority) {
        highestRole = role;
        highestPriority = role.priority;
      }
    });

    return highestRole;
  }

  /**
   * Check if user is admin
   */
  public isAdmin(userId: string): boolean {
    return this.hasPermission(userId, 'admin:dashboard');
  }

  /**
   * Check if user is super admin
   */
  public isSuperAdmin(userId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.some(ur => ur.isActive && ur.roleId === 'super_admin');
  }

  /**
   * Get all permissions
   */
  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get all roles
   */
  public getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Create custom permission
   */
  public createPermission(permission: Permission): boolean {
    try {
      if (this.permissions.has(permission.id)) {
        return false; // Permission already exists
      }

      this.permissions.set(permission.id, permission);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to create permission:', error);
      return false;
    }
  }

  /**
   * Create custom role
   */
  public createRole(role: Role): boolean {
    try {
      if (this.roles.has(role.id)) {
        return false; // Role already exists
      }

      // Validate that all permissions exist
      for (const permissionId of role.permissions) {
        if (!this.permissions.has(permissionId)) {
          throw new Error(`Permission ${permissionId} does not exist`);
        }
      }

      this.roles.set(role.id, role);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to create role:', error);
      return false;
    }
  }

  /**
   * Get role-based navigation menu
   */
  public getNavigationForUser(userId: string): Array<{
    id: string;
    label: string;
    path: string;
    icon?: string;
    permissions: string[];
  }> {
    const userPermissions = this.getUserPermissions(userId).map(p => p.id);
    
    const allMenuItems = [
      {
        id: 'properties',
        label: 'العقارات',
        path: '/properties',
        icon: 'home',
        permissions: ['property:read']
      },
      {
        id: 'add-property',
        label: 'إضافة عقار',
        path: '/add-property',
        icon: 'plus',
        permissions: ['property:create']
      },
      {
        id: 'offices',
        label: 'المكاتب العقارية',
        path: '/offices',
        icon: 'building',
        permissions: ['office:read']
      },
      {
        id: 'users',
        label: 'إدارة المستخدمين',
        path: '/admin/users',
        icon: 'users',
        permissions: ['user:read']
      },
      {
        id: 'dashboard',
        label: 'لوحة التحكم',
        path: '/admin/dashboard',
        icon: 'dashboard',
        permissions: ['admin:dashboard']
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        // Use dashboard tab for settings to maintain a single canonical UI
        path: '/dashboard/settings',
        icon: 'settings',
        permissions: ['admin:settings']
      },
      {
        id: 'reports',
        label: 'التقارير',
        path: '/admin/reports',
        icon: 'chart',
        permissions: ['admin:reports']
      },
      {
        id: 'audit',
        label: 'سجل التدقيق',
        path: '/admin/audit',
        icon: 'shield',
        permissions: ['admin:audit']
      }
    ];

    return allMenuItems.filter(item => 
      item.permissions.some(permission => userPermissions.includes(permission))
    );
  }
}

// Export singleton instance
export const rbacManager = RBACManager.getInstance();