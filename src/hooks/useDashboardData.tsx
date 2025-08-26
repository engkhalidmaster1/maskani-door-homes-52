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
          created_at
        `);

      if (usersError) throw usersError;

      // Get auth users for email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get property counts for each user
      const { data: propertyCounts, error: propertyError } = await supabase
        .from('properties')
        .select('user_id')
        .then(({ data, error }) => {
          if (error) throw error;
          const counts = data?.reduce((acc: Record<string, number>, prop) => {
            acc[prop.user_id] = (acc[prop.user_id] || 0) + 1;
            return acc;
          }, {}) || {};
          return { data: counts, error: null };
        });

      if (propertyError) throw propertyError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedUsers: DashboardUser[] = usersData?.map(profile => {
        const authUser = authUsers.users.find((u: any) => u.id === profile.user_id);
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: authUser?.email || '',
          full_name: profile.full_name,
          phone: profile.phone,
          role: userRole?.role || 'user',
          created_at: profile.created_at,
          properties_count: propertyCounts.data?.[profile.user_id] || 0
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

      // Delete from auth (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Refresh data
      await Promise.all([fetchUsers(), fetchUserProperties()]);
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
    getDashboardStats,
    refreshData: () => Promise.all([fetchUsers(), fetchUserProperties()])
  };
};