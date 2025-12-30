import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSettings, setAppSettings, setMaintenanceMode } from '@/services/settingsService';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'حدث خطأ غير متوقع';

export const useAppSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, refetch } = useQuery<Json | null>({
    queryKey: ['app-settings', 'current'],
    queryFn: async () => {
      return await fetchAppSettings();
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Json) => {
      return await setAppSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: '✅ تم الحفظ', description: 'تم تحديث إعدادات النظام بنجاح' });
    },
    onError: (error: unknown) => {
      toast({ title: 'خطأ في حفظ الإعدادات', description: getErrorMessage(error), variant: 'destructive' });
    }
  });

  const toggleMaintenance = useMutation({
    mutationFn: async (on: boolean) => {
      return await setMaintenanceMode(on);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: '✅ تم الحفظ', description: 'تم تحديث حالة الصيانة' });
    },
    onError: (error: unknown) => {
      toast({ title: 'خطأ', description: getErrorMessage(error), variant: 'destructive' });
    }
  });

  return {
    settings,
    isLoading,
    reload: refetch,
    updateSettings: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
    toggleMaintenance: toggleMaintenance.mutateAsync,
    isTogglingMaintenance: toggleMaintenance.isPending,
  };
};
