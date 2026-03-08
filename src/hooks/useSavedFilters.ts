import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export function useSavedFilters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPresets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_filters' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setPresets(data as unknown as FilterPreset[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const savePreset = useCallback(async (name: string, filters: Record<string, unknown>) => {
    if (!user) {
      toast({ title: '⚠️ يجب تسجيل الدخول أولاً', variant: 'destructive' });
      return false;
    }
    const { error } = await supabase
      .from('saved_filters' as any)
      .insert({ user_id: user.id, name, filters } as any);
    if (error) {
      toast({ title: '❌ فشل حفظ الفلتر', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: '✅ تم حفظ الفلتر', description: `"${name}"` });
    await fetchPresets();
    return true;
  }, [user, toast, fetchPresets]);

  const deletePreset = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('saved_filters' as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      setPresets((p) => p.filter((x) => x.id !== id));
      toast({ title: '🗑️ تم حذف الفلتر' });
    }
  }, [user, toast]);

  return { presets, isLoading, savePreset, deletePreset, fetchPresets };
}
