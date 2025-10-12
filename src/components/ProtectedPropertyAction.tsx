import React from 'react';
import { usePropertyPermissions } from '@/hooks/usePropertyPermissions';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProtectedPropertyActionProps {
  propertyId: string;
  action: 'edit' | 'delete' | 'view';
  children: React.ReactNode;
  onAction: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showUnauthorizedMessage?: boolean;
}

/**
 * مكون محمي للعمليات على العقارات
 * يتحقق من صلاحيات المستخدم قبل عرض الزر أو تنفيذ العملية
 */
export const ProtectedPropertyAction = ({
  propertyId,
  action,
  children,
  onAction,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  showUnauthorizedMessage = false
}: ProtectedPropertyActionProps) => {
  const { canEdit, canDelete, canView, isLoading, isOwner } = usePropertyPermissions(propertyId);

  // أثناء التحقق من الصلاحيات
  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        جاري التحقق...
      </Button>
    );
  }

  // تحديد الصلاحية المطلوبة حسب نوع العملية
  let hasPermission = false;
  let permissionMessage = '';

  switch (action) {
    case 'edit':
      hasPermission = canEdit;
      permissionMessage = isOwner 
        ? 'يمكنك تعديل هذا العقار' 
        : 'لا يمكنك تعديل هذا العقار';
      break;
    case 'delete':
      hasPermission = canDelete;
      permissionMessage = isOwner 
        ? 'يمكنك حذف هذا العقار' 
        : 'لا يمكنك حذف هذا العقار';
      break;
    case 'view':
      hasPermission = canView;
      permissionMessage = 'يمكنك عرض هذا العقار';
      break;
    default:
      hasPermission = false;
      permissionMessage = 'عملية غير مدعومة';
  }

  // إذا لم تكن هناك صلاحية
  if (!hasPermission) {
    if (showUnauthorizedMessage) {
      return (
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {permissionMessage}
          </AlertDescription>
        </Alert>
      );
    }
    // إخفاء الزر إذا لم تكن هناك صلاحية
    return null;
  }

  // عرض الزر مع الصلاحية المناسبة
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onAction}
      disabled={disabled}
      title={permissionMessage}
    >
      {children}
    </Button>
  );
};

/**
 * مكون مبسط للتحقق من الصلاحيات فقط دون عرض زر
 */
export const PropertyPermissionGuard = ({
  propertyId,
  action,
  children,
  fallback,
  showLoading = true
}: {
  propertyId: string;
  action: 'edit' | 'delete' | 'view';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}) => {
  const { canEdit, canDelete, canView, isLoading } = usePropertyPermissions(propertyId);

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  let hasPermission = false;
  switch (action) {
    case 'edit':
      hasPermission = canEdit;
      break;
    case 'delete':
      hasPermission = canDelete;
      break;
    case 'view':
      hasPermission = canView;
      break;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};