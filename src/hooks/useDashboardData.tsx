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
      // Delete user properties first
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .eq('user_id', userId);

      if (propertiesError) throw propertiesError;

      // Delete user profile and role
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Note: Cannot delete from auth.users with client-side key
      // The user will remain in auth.users but won't have access to the app
      // since their profile and role are deleted

      // Refresh data
      await Promise.all([fetchUsers(), fetchUserProperties()]);
      
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم وجميع عقاراته بنجاح",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المستخدم",
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
    getDashboardStats,
    refreshData: () => Promise.all([fetchUsers(), fetchUserProperties()])
  };
};