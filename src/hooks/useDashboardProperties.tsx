import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardProperty {
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

export interface PropertyFilters {
  location?: string;
  property_type?: string;
  status?: 'published' | 'unpublished';
  searchTerm?: string;
}

export function useDashboardProperties(filters: PropertyFilters = {}) {
  return useQuery<DashboardProperty[], Error>({
    queryKey: ['dashboard-properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          price,
          location,
          property_type,
          is_published,
          user_id,
          created_at,
          profiles!inner(full_name)
        `);

      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters.status) {
        const published = filters.status === 'published';
        query = query.eq('is_published', published);
      }
      if (filters.searchTerm) {
        query = query.ilike('title', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map((prop) => ({
        id: prop.id,
        title: prop.title,
        price: prop.price,
        location: prop.location,
        property_type: prop.property_type,
        is_published: prop.is_published,
        user_id: prop.user_id,
        owner_name: ((prop.profiles as unknown) as { full_name: string } | null)?.full_name || null,
        created_at: prop.created_at,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}