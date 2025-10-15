import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from "@/hooks/use-toast";

interface DashboardUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  properties_count: number;
}

interface DashboardProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  is_published: boolean;
  user_id: string;
  owner_name: string | null;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  publishedProperties: number;
  publishRate: number;
}

export const useDashboardData = () => {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [userProperties, setUserProperties] = useState<DashboardProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      // Fetch users with their profiles and roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          phone,
          email,
          created_at
        `);

      if (usersError) throw usersError;

      // Get property counts for each user
      const { data: propertiesData, error: propertyError } = await supabase
        .from('properties')
        .select('user_id');

      if (propertyError) throw propertyError;

      // Count properties per user
      const propertyCounts = propertiesData?.reduce((acc: Record<string, number>, prop) => {
        acc[prop.user_id] = (acc[prop.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedUsers: DashboardUser[] = usersData?.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email || `user-${profile.user_id.slice(0, 8)}@maskani.com`, // Use real email or fallback
          full_name: profile.full_name,
          phone: profile.phone,
          role: userRole?.role || 'user',
          created_at: profile.created_at,
          properties_count: propertyCounts[profile.user_id] || 0
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستخدمين",
        variant: "destructive",
      });
    }
  }, [isAdmin]);

  const fetchUserProperties = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profilesError) throw profilesError;

      const propertiesWithOwner: DashboardProperty[] = data?.map(prop => {
        const owner = profilesData?.find(p => p.user_id === prop.user_id);
        return {
          id: prop.id,
          title: prop.title,
          price: prop.price,
          location: prop.location,
          property_type: prop.property_type,
          is_published: prop.is_published,
          user_id: prop.user_id,
          owner_name: owner?.full_name || null,
          created_at: prop.created_at
        };
      }) || [];

      setUserProperties(propertiesWithOwner);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العقارات",
        variant: "destructive",
      });
    }
  }, [isAdmin]);

  const deleteUser = async (userId: string) => {
    if (!isAdmin) return;

    try {
      // حذف مؤقت: نحذف من الجداول المتاحة فقط
      // المستخدم سيبقى في auth.users لكن لن يستطيع الدخول
      
      // 1. حذف جميع عقارات المستخدم
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .eq('user_id', userId);

      if (propertiesError) {
        console.error('Error deleting properties:', propertiesError);
        // نتابع حتى لو فشل حذف العقارات
      }

      // 2. حذف الملف الشخصي
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // 3. حذف الدور
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error deleting role:', roleError);
      }

      // 4. حذف من user_statuses إذا وجد
      const { error: statusError } = await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', userId);

      if (statusError) {
        console.error('Error deleting status:', statusError);
      }

      // 5. حذف من favorites إذا وجد
      const { error: favError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      if (favError) {
        console.error('Error deleting favorites:', favError);
      }

      // Refresh data
      await Promise.all([fetchUsers(), fetchUserProperties()]);
      
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف بيانات المستخدم بنجاح (سيبقى في قائمة المصادقة لكن لا يمكنه الدخول)",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : "فشل في حذف المستخدم";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث دور المستخدم بنجاح",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث دور المستخدم",
        variant: "destructive",
      });
    }
  };

  const getUserProfile = async (userId: string) => {
    if (!isAdmin) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const getUserProperties = async (userId: string) => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user properties:', error);
      return [];
    }
  };

  const banUserFromPublishing = async (userId: string) => {
    if (!isAdmin) return;

    try {
      // Update all user properties to be unpublished
      const { error } = await supabase
        .from('properties')
        .update({ is_published: false })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchUsers(), fetchUserProperties()]);
      
      toast({
        title: "تم حظر المستخدم من النشر",
        description: "تم إخفاء جميع عقارات المستخدم",
      });
    } catch (error) {
      console.error('Error banning user from publishing:', error);
      toast({
        title: "خطأ",
        description: "فشل في حظر المستخدم من النشر",
        variant: "destructive",
      });
    }
  };

  const unbanUserFromPublishing = async (userId: string) => {
    if (!isAdmin) return;

    try {
      // Update all user properties to be published
      const { error } = await supabase
        .from('properties')
        .update({ is_published: true })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchUsers(), fetchUserProperties()]);
      
      toast({
        title: "تم إلغاء حظر المستخدم",
        description: "تم نشر جميع عقارات المستخدم",
      });
    } catch (error) {
      console.error('Error unbanning user from publishing:', error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء حظر المستخدم",
        variant: "destructive",
      });
    }
  };

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!isAdmin) return;

    // احفظ العقار المراد حذفه لإعادته في حالة فشل
    const propertyToDelete = userProperties.find(p => p.id === propertyId);
    if (!propertyToDelete) return;

    // حذف العقار فوراً من الحالة المحلية
    setUserProperties(prev => prev.filter(property => property.id !== propertyId));

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      // تم الحذف بنجاح، لا نحتاج لفعل شيء إضافي
    } catch (error) {
      // في حالة فشل، أعد العقار إلى القائمة
      setUserProperties(prev => [...prev, propertyToDelete]);

      console.error('Error deleting property:', error);
      toast({
        title: "خطأ في حذف العقار",
        description: "فشل في حذف العقار من قاعدة البيانات",
        variant: "destructive",
      });
    }
  }, [isAdmin, userProperties]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const totalUsers = users.length;
    const totalProperties = userProperties.length;
    const publishedProperties = userProperties.filter(p => p.is_published).length;
    const publishRate = totalProperties > 0 ? Math.round((publishedProperties / totalProperties) * 100) : 0;

    return {
      totalUsers,
      totalProperties,
      publishedProperties,
      publishRate
    };
  }, [users, userProperties]);

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchUserProperties()])
        .finally(() => setIsLoading(false));
    }
  }, [isAdmin, fetchUsers, fetchUserProperties]);
  
  // Real-time subscription: refresh data when properties change
  useEffect(() => {
    if (!isAdmin) return;
    // Listen to all changes on 'properties' table
    const channel = supabase
      .channel('public:properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        fetchUserProperties();
        fetchUsers();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchUserProperties, fetchUsers]);

  return {
    users,
    userProperties,
    isLoading,
    deleteUser,
    updateUserRole,
    getUserProfile,
    getUserProperties,
    banUserFromPublishing,
    unbanUserFromPublishing,
    deleteProperty,
    getDashboardStats,
    refreshData: () => Promise.all([fetchUsers(), fetchUserProperties()])
  };
};