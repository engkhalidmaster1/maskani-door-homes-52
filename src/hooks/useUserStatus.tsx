import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type UserStatus = Database["public"]["Enums"]["user_status"];
type UserStatusRow = Database["public"]["Tables"]["user_statuses"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type UserStatusData = UserStatusRow & {
  current_properties_count?: number;
};

interface UserWithStatus {
  id: ProfileRow["user_id"];
  email: string;
  full_name: ProfileRow["full_name"];
  phone: ProfileRow["phone"];
  status_data: UserStatusData | null;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

export const useUserStatus = () => {
  const [userStatus, setUserStatus] = useState<UserStatusData | null>(null);
  const [allUsersWithStatus, setAllUsersWithStatus] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Get status labels in Arabic
  const getStatusLabel = (status: UserStatus): string => {
    switch (status) {
      case 'publisher':
        return 'ناشر';
      case 'trusted_owner':
        return 'مالك موثوق';
      case 'office_agent':
        return 'مكلف بالنشر';
      default:
        return 'غير محدد';
    }
  };

  // Get status badge color
  const getStatusColor = (status: UserStatus): string => {
    switch (status) {
      case 'publisher':
        return 'bg-gray-100 text-gray-800';
      case 'trusted_owner':
        return 'bg-green-100 text-green-800';
      case 'office_agent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch current user's status
  const fetchCurrentUserStatus = useCallback(async (): Promise<void> => {
    if (!user) {
      setUserStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_statuses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Create default status if none exists
        const { data: newStatus, error: createError } = await supabase
          .from('user_statuses')
          .insert({
            user_id: user.id,
            status: 'publisher',
            properties_limit: 1,
            images_limit: 2,
            can_publish: true,
            is_verified: false
          })
          .select()
          .single();

        if (!createError && newStatus) {
          setUserStatus(newStatus);
        }
        return;
      }

      setUserStatus(data);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error fetching user status:', error);
      toast({
        title: "خطأ في تحميل حالة المستخدم",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, user]);

  // Fetch all users with their statuses (admin only)
  const fetchAllUsersWithStatus = useCallback(async (): Promise<void> => {
    if (!isAdmin) {
      setAllUsersWithStatus([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch users with their profiles and statuses
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          phone
        `);

      if (usersError) {
        throw usersError;
      }

      // Fetch statuses
      const { data: statusesData, error: statusesError } = await supabase
        .from('user_statuses')
        .select('*');

      if (statusesError) {
        throw statusesError;
      }

      // Combine data
      const profiles: ProfileRow[] = usersData ?? [];
      const statuses: UserStatusData[] = statusesData ?? [];

      const combinedData: UserWithStatus[] = profiles.map(profile => {
        const statusData = statuses.find(status => status.user_id === profile.user_id) ?? null;
        return {
          id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name,
          phone: profile.phone,
          status_data: statusData,
        };
      });

      setAllUsersWithStatus(combinedData);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error fetching users with status:', error);
      toast({
        title: "خطأ في تحميل المستخدمين",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, toast]);

  // Update user status (admin only)
  const updateUserStatus = async (targetUserId: string, newStatus: UserStatus) => {
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "فقط المديرون يمكنهم تغيير حالة المستخدمين",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('user_statuses')
        .update({
          status: newStatus
        })
        .eq('user_id', targetUserId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم تحديث الحالة",
        description: `تم تغيير حالة المستخدم إلى ${getStatusLabel(newStatus)}`,
      });

      // Refresh data
      await fetchAllUsersWithStatus();
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error updating user status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if user can add more properties
  const canAddProperty = (): boolean => {
    if (!userStatus) return false;
    return (userStatus.current_properties_count || 0) < userStatus.properties_limit;
  };

  // Get remaining properties count
  const getRemainingProperties = (): number => {
    if (!userStatus) return 0;
    return Math.max(0, userStatus.properties_limit - (userStatus.current_properties_count || 0));
  };

  useEffect(() => {
    if (user) {
      fetchCurrentUserStatus();
    } else {
      setUserStatus(null);
    }
  }, [user, fetchCurrentUserStatus]);

  useEffect(() => {
    fetchAllUsersWithStatus();
  }, [fetchAllUsersWithStatus]);

  return {
    userStatus,
    allUsersWithStatus,
    isLoading,
    isUpdating,
    getStatusLabel,
    getStatusColor,
    updateUserStatus,
    fetchCurrentUserStatus,
    fetchAllUsersWithStatus,
    canAddProperty,
    getRemainingProperties
  };
};