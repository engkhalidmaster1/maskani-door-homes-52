import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type BannerSettings = Database['public']['Tables']['banner_settings']['Row'];

export const useBannerSettings = () => {
  const queryClient = useQueryClient();

  // Fetch active banner settings (for public use)
  const { data: activeBanner, isLoading: isLoadingActive } = useQuery({
    queryKey: ['banner-settings', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching active banner:', error);
        return null;
      }

      // Check if banner is within date range
      if (data) {
        const now = new Date();
        const startDate = data.start_date ? new Date(data.start_date) : null;
        const endDate = data.end_date ? new Date(data.end_date) : null;

        if (startDate && now < startDate) return null;
        if (endDate && now > endDate) return null;
      }

      return data;
    },
  });

  // Fetch all banner settings (for admin use)
  const { data: allBanners, isLoading: isLoadingAll, error: allBannersError } = useQuery({
    queryKey: ['banner-settings', 'all'],
    queryFn: async () => {
      console.log('Fetching all banners...');
      const { data, error } = await supabase
        .from('banner_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all banners:', error);
        throw error;
      }

      console.log('Banners fetched successfully:', data);
      return data || [];
    },
    retry: 1,
  });

  // Create new banner setting
  const createBannerMutation = useMutation({
    mutationFn: async (newBanner: Omit<BannerSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('banner_settings')
        .insert(newBanner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-settings'] });
      toast({
        title: "تم إنشاء الشريط بنجاح",
        description: "تم إضافة الشريط الجديد إلى النظام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الشريط",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update banner setting
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BannerSettings> }) => {
      const { data, error } = await supabase
        .from('banner_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-settings'] });
      toast({
        title: "تم تحديث الشريط بنجاح",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الشريط",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete banner setting
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banner_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-settings'] });
      toast({
        title: "تم حذف الشريط بنجاح",
        description: "تم حذف الشريط من النظام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الشريط",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Public data
    activeBanner,
    isLoadingActive,
    
    // Admin data
    allBanners,
    isLoadingAll,
    
    // Mutations
    createBanner: createBannerMutation.mutate,
    updateBanner: updateBannerMutation.mutate,
    deleteBanner: deleteBannerMutation.mutate,
    
    // Loading states
    isCreating: createBannerMutation.isPending,
    isUpdating: updateBannerMutation.isPending,
    isDeleting: deleteBannerMutation.isPending,
  };
};
