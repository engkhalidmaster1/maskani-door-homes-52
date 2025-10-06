import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import type { Database } from '@/integrations/supabase/types';

// أنواع البيانات
export type RealEstateOffice = Database['public']['Tables']['real_estate_offices']['Row'];
export type AdminUser = {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  permissions: {
    approve_offices?: boolean;
    manage_users?: boolean;
    view_reports?: boolean;
    [key: string]: boolean | undefined;
  };
  created_at: string;
  active: boolean;
};

export type OfficeStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface OfficeActionData {
  officeId: string;
  status: OfficeStatus;
  reason?: string;
  notes?: string;
}

export const useOfficeManagement = () => {
  const [offices, setOffices] = useState<RealEstateOffice[]>([]);
  const [pendingOffices, setPendingOffices] = useState<RealEstateOffice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // التحقق من صلاحيات المدير
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminUser(null);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error) {
        console.log('User is not an admin:', error);
        setIsAdmin(false);
        setAdminUser(null);
        return false;
      }

      setIsAdmin(true);
      setAdminUser(data);
      return true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminUser(null);
      return false;
    }
  }, [user]);

  // جلب جميع المكاتب للمدير
  const fetchAllOffices = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('real_estate_offices')
        .select(`
          *,
          profiles!real_estate_offices_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offices:', error);
        toast({
          title: "خطأ في جلب المكاتب",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب المكاتب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  // جلب المكاتب المعلقة فقط
  const fetchPendingOffices = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('real_estate_offices')
        .select(`
          *,
          profiles!real_estate_offices_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }); // الأقدم أولاً

      if (error) {
        console.error('Error fetching pending offices:', error);
        toast({
          title: "خطأ في جلب المكاتب المعلقة",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPendingOffices(data || []);
    } catch (error) {
      console.error('Error fetching pending offices:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب المكاتب المعلقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  // الموافقة على مكتب
  const approveOffice = useCallback(async (officeData: OfficeActionData) => {
    if (!isAdmin || !user) {
      toast({
        title: "غير مخول",
        description: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // تحديث حالة المكتب
      const { error: updateError } = await supabase
        .from('real_estate_offices')
        .update({
          status: 'active',
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', officeData.officeId);

      if (updateError) {
        console.error('Error approving office:', updateError);
        toast({
          title: "خطأ في الموافقة",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      // إضافة إلى سجل الأنشطة
      const { error: logError } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action: 'approve',
          target_office_id: officeData.officeId,
          reason: officeData.reason || 'تم قبول المكتب',
          notes: officeData.notes
        });

      if (logError) {
        console.error('Error logging activity:', logError);
      }

      toast({
        title: "تمت الموافقة",
        description: "تم قبول المكتب وتفعيله بنجاح",
      });

      // تحديث البيانات
      await fetchPendingOffices();
      await fetchAllOffices();

      return true;
    } catch (error) {
      console.error('Error approving office:', error);
      toast({
        title: "خطأ في الموافقة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, toast, fetchPendingOffices, fetchAllOffices]);

  // رفض مكتب
  const rejectOffice = useCallback(async (officeData: OfficeActionData) => {
    if (!isAdmin || !user) {
      toast({
        title: "غير مخول",
        description: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // تحديث حالة المكتب
      const { error: updateError } = await supabase
        .from('real_estate_offices')
        .update({
          status: 'inactive',
          verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', officeData.officeId);

      if (updateError) {
        console.error('Error rejecting office:', updateError);
        toast({
          title: "خطأ في الرفض",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      // إضافة إلى سجل الأنشطة
      const { error: logError } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action: 'reject',
          target_office_id: officeData.officeId,
          reason: officeData.reason || 'تم رفض المكتب',
          notes: officeData.notes
        });

      if (logError) {
        console.error('Error logging activity:', logError);
      }

      toast({
        title: "تم الرفض",
        description: "تم رفض المكتب وإرسال إشعار لصاحبه",
        variant: "destructive",
      });

      // تحديث البيانات
      await fetchPendingOffices();
      await fetchAllOffices();

      return true;
    } catch (error) {
      console.error('Error rejecting office:', error);
      toast({
        title: "خطأ في الرفض",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, toast, fetchPendingOffices, fetchAllOffices]);

  // تعليق مكتب
  const suspendOffice = useCallback(async (officeData: OfficeActionData) => {
    if (!isAdmin || !user) {
      toast({
        title: "غير مخول",
        description: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // تحديث حالة المكتب
      const { error: updateError } = await supabase
        .from('real_estate_offices')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', officeData.officeId);

      if (updateError) {
        console.error('Error suspending office:', updateError);
        toast({
          title: "خطأ في التعليق",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      // إضافة إلى سجل الأنشطة
      const { error: logError } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action: 'suspend',
          target_office_id: officeData.officeId,
          reason: officeData.reason || 'تم تعليق المكتب',
          notes: officeData.notes
        });

      if (logError) {
        console.error('Error logging activity:', logError);
      }

      toast({
        title: "تم التعليق",
        description: "تم تعليق المكتب مؤقتاً",
        variant: "destructive",
      });

      // تحديث البيانات
      await fetchAllOffices();

      return true;
    } catch (error) {
      console.error('Error suspending office:', error);
      toast({
        title: "خطأ في التعليق",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, toast, fetchAllOffices]);

  // إعادة تفعيل مكتب
  const reactivateOffice = useCallback(async (officeData: OfficeActionData) => {
    if (!isAdmin || !user) {
      toast({
        title: "غير مخول",
        description: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // تحديث حالة المكتب
      const { error: updateError } = await supabase
        .from('real_estate_offices')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', officeData.officeId);

      if (updateError) {
        console.error('Error reactivating office:', updateError);
        toast({
          title: "خطأ في إعادة التفعيل",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      // إضافة إلى سجل الأنشطة
      const { error: logError } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action: 'activate',
          target_office_id: officeData.officeId,
          reason: officeData.reason || 'تم إعادة تفعيل المكتب',
          notes: officeData.notes
        });

      if (logError) {
        console.error('Error logging activity:', logError);
      }

      toast({
        title: "تم إعادة التفعيل",
        description: "تم إعادة تفعيل المكتب بنجاح",
      });

      // تحديث البيانات
      await fetchAllOffices();

      return true;
    } catch (error) {
      console.error('Error reactivating office:', error);
      toast({
        title: "خطأ في إعادة التفعيل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, toast, fetchAllOffices]);

  // تحديث الصلاحيات عند تغيير المستخدم
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // جلب البيانات عند تفعيل صلاحيات المدير
  useEffect(() => {
    if (isAdmin) {
      fetchPendingOffices();
      fetchAllOffices();
    }
  }, [isAdmin, fetchPendingOffices, fetchAllOffices]);

  return {
    // البيانات
    offices,
    pendingOffices,
    loading,
    isAdmin,
    adminUser,
    
    // الوظائف
    checkAdminStatus,
    fetchAllOffices,
    fetchPendingOffices,
    approveOffice,
    rejectOffice,
    suspendOffice,
    reactivateOffice,
    
    // الإحصائيات
    totalOffices: offices.length,
    pendingCount: pendingOffices.length,
    activeCount: offices.filter(o => o.status === 'active').length,
    suspendedCount: offices.filter(o => o.status === 'suspended').length,
    inactiveCount: offices.filter(o => o.status === 'inactive').length,
  };
};