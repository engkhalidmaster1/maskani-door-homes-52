import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export type DashboardMetrics = {
  total_properties: number;
  published: number;
  unpublished: number;
  avg_price: number;
  avg_price_by_market: Record<string, number>;
};

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics, PostgrestError>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // @ts-expect-error: custom RPC not in generated types
      const { data, error } = await supabase.rpc('get_dashboard_metrics');
      if (error) throw error;
      return data as unknown as DashboardMetrics;
    },
    staleTime: 1000 * 60 * 5,
  });
}
