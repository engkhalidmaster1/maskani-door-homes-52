import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from "@/hooks/use-toast";

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
  const [userProperties, setUserProperties] = useState<DashboardProperty[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      // Fetch properties
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (propsError) throw propsError;

      // Fetch profiles for owner names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .limit(1000);

      const properties: DashboardProperty[] = (propsData ?? []).map(prop => {
        const owner = profilesData?.find(p => p.user_id === prop.user_id);
        return {
          id: prop.id,
          title: prop.title,
          price: prop.price,
          location: prop.location ?? '',
          property_type: prop.property_type,
          is_published: prop.is_published,
          user_id: prop.user_id,
          owner_name: owner?.full_name || null,
          created_at: prop.created_at,
        };
      });
      setUserProperties(properties);

      // Get total users count from profiles
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setTotalUsers(count ?? 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: "خطأ", description: "فشل في تحميل البيانات", variant: "destructive" });
      setUserProperties([]);
    }
  }, [isAdmin]);

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!isAdmin) return;
    const toDelete = userProperties.find(p => p.id === propertyId);
    if (!toDelete) return;
    setUserProperties(prev => prev.filter(p => p.id !== propertyId));
    try {
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) throw error;
    } catch {
      setUserProperties(prev => [...prev, toDelete]);
      toast({ title: "خطأ في حذف العقار", variant: "destructive" });
    }
  }, [isAdmin, userProperties]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const totalProperties = userProperties.length;
    const publishedProperties = userProperties.filter(p => p.is_published).length;
    const publishRate = totalProperties > 0 ? Math.round((publishedProperties / totalProperties) * 100) : 0;
    return { totalUsers, totalProperties, publishedProperties, publishRate };
  }, [userProperties, totalUsers]);

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }
  }, [isAdmin, fetchData]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('public:properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchData]);

  return { userProperties, isLoading, deleteProperty, getDashboardStats, refreshData: fetchData };
};
