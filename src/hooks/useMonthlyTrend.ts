import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyTrend {
  month: string;
  count: number;
}

/**
 * Fetches monthly trend data for properties from Supabase RPC 'get_monthly_trend'.
 */
export const useMonthlyTrend = () => {
  return useQuery<MonthlyTrend[], Error>({
    queryKey: ['monthly-trend'],
    queryFn: async () => {
      try {
        // @ts-expect-error: custom RPC not in generated types
        const { data, error } = await supabase.rpc('get_monthly_trend');
        if (error) {
          console.warn('Monthly trend RPC error:', error.message);
          return [] as MonthlyTrend[];
        }
        return (data as unknown as MonthlyTrend[]) || [];
      } catch (err) {
        console.error('Error fetching monthly trend:', err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};