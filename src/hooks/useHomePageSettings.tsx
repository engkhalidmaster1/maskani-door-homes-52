import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface HomePageSettings {
  id: string;
  show_search_bar: boolean;
  search_bar_title: string;
  search_bar_subtitle: string;
}

export const useHomePageSettings = () => {
  const queryClient = useQueryClient();

  // جلب الإعدادات
  const { data: settings, isLoading } = useQuery({
    queryKey: ['home-page-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_home_page_settings');

      if (error) throw error;
      return data?.[0] as HomePageSettings;
    },
  });

  // تحديث الإعدادات
  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (newSettings: Omit<HomePageSettings, 'id'>) => {
      const { error } = await supabase.rpc('update_home_page_settings', {
        p_show_search_bar: newSettings.show_search_bar,
        p_search_bar_title: newSettings.search_bar_title,
        p_search_bar_subtitle: newSettings.search_bar_subtitle,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-page-settings'] });
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم حفظ إعدادات الصفحة الرئيسية',
      });
    },
    onError: (error) => {
      toast({
        title: 'فشل التحديث',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
  };
};
