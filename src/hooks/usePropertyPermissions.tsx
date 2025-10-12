import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PropertyPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  isOwner: boolean;
  isLoading: boolean;
}

/**
 * Hook للتحقق من صلاحيات المستخدم على عقار معين
 * @param propertyId معرف العقار
 * @returns كائن يحتوي على الصلاحيات المختلفة
 */
export const usePropertyPermissions = (propertyId: string): PropertyPermissions => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<PropertyPermissions>({
    canEdit: false,
    canDelete: false,
    canView: true, // افتراضياً يمكن عرض العقارات
    isOwner: false,
    isLoading: true
  });

  useEffect(() => {
    const checkPermissions = async () => {
      // انتظر اكتمال تحميل حالة المستخدم لتجنب وميض الرسالة
      if (authLoading) {
        setPermissions(prev => ({ ...prev, isLoading: true }));
        return;
      }

      if (!propertyId) {
        setPermissions(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // المدراء لديهم صلاحيات كاملة
        if (isAdmin) {
          setPermissions({
            canEdit: true,
            canDelete: true,
            canView: true,
            isOwner: false,
            isLoading: false
          });
          return;
        }

        // فحص ملكية العقار
        const { data: property, error } = await supabase
          .from('properties')
          .select('user_id, is_published')
          .eq('id', propertyId)
          .single<{ user_id: string; is_published: boolean | null }>();

        if (error) {
          console.error('Error fetching property permissions:', error);
          setPermissions({
            canEdit: false,
            canDelete: false,
            canView: true, // في حالة الخطأ لا نمنع العرض لتفادي التجربة السيئة
            isOwner: false,
            isLoading: false
          });
          return;
        }

        if (!property) {
          setPermissions({
            canEdit: false,
            canDelete: false,
            canView: false,
            isOwner: false,
            isLoading: false
          });
          return;
        }

  const isOwner = Boolean(user && property.user_id === user.id);
        const canEdit = isOwner || isAdmin;
        const canDelete = isOwner || isAdmin;
        
        // يمكن عرض العقار إذا كان منشوراً أو إذا كان المستخدم مالكه أو مدير
  const canView = Boolean(property.is_published) || isOwner || isAdmin;

        setPermissions({
          canEdit,
          canDelete,
          canView,
          isOwner: Boolean(isOwner),
          isLoading: false
        });

        console.log('Property permissions:', {
          propertyId,
          userId: user?.id,
          ownerId: property.user_id,
          isOwner,
          canEdit,
          canDelete,
          canView,
          isAdmin
        });

      } catch (error) {
        console.error('Error in checkPermissions:', error);
        setPermissions({
          canEdit: false,
          canDelete: false,
          canView: true, // في حالة الخطأ، نسمح بالعرض
          isOwner: false,
          isLoading: false
        });
      }
    };

    checkPermissions();
  }, [propertyId, user, isAdmin, authLoading]);

  return permissions;
};