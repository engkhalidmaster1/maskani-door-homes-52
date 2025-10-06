import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import type { Database } from '@/integrations/supabase/types';

// استخدام نوع Supabase مباشرة
export type RealEstateOffice = Database['public']['Tables']['real_estate_offices']['Row'];

export type OfficeFormData = Database['public']['Tables']['real_estate_offices']['Insert'];

export const useRealEstateOfficesDB = () => {
  const [offices, setOffices] = useState<RealEstateOffice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // جلب المكاتب من قاعدة البيانات
  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching offices from database...');
      
      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Database response:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ Error fetching offices:', error);
        toast({
          title: "خطأ في جلب البيانات",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Found ${data?.length || 0} offices`);
      setOffices(data || []);
    } catch (error) {
      console.error('❌ Exception fetching offices:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب المكاتب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // جلب مكتب واحد حسب المعرف
  const fetchOfficeById = useCallback(async (id: string): Promise<RealEstateOffice | null> => {
    try {
      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching office:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching office:', error);
      return null;
    }
  }, []);

  // إنشاء مكتب جديد
  const createOffice = useCallback(async (formData: OfficeFormData) => {
    if (!user) {
      toast({
        title: "خطأ في التسجيل",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);

      const officeData = {
        user_id: user.id,
        name: formData.name,
        license_number: formData.license_number,
        description: formData.description,
        services: formData.services,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        working_hours: formData.working_hours,
        verified: false,
        status: 'pending' as const
      };

      console.log('📝 Creating office with data:', officeData);

      const { data, error } = await supabase
        .from('real_estate_offices')
        .insert([officeData])
        .select()
        .single();

      console.log('📊 Create office response:', { data, error });

      if (error) {
        console.error('❌ Error creating office:', error);
        toast({
          title: "خطأ في التسجيل",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Office created successfully:', data);

      // تحديث قائمة المكاتب
      await fetchOffices();

      toast({
        title: "تم التسجيل بنجاح",
        description: "سيتم مراجعة طلبك خلال 24 ساعة",
      });

      return data;
    } catch (error) {
      console.error('Error creating office:', error);
      toast({
        title: "خطأ في التسجيل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchOffices]);

  // تحديث مكتب موجود
  const updateOffice = useCallback(async (id: string, updates: Partial<OfficeFormData>) => {
    if (!user) {
      toast({
        title: "خطأ في التحديث",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('real_estate_offices')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id); // التأكد من أن المستخدم يملك المكتب

      if (error) {
        console.error('Error updating office:', error);
        toast({
          title: "خطأ في التحديث",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // تحديث قائمة المكاتب
      await fetchOffices();

      toast({
        title: "تم التحديث بنجاح",
        description: "تم حفظ التعديلات بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Error updating office:', error);
      toast({
        title: "خطأ في التحديث",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchOffices]);

  // البحث في المكاتب
  const searchOffices = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchOffices();
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching offices:', error);
        toast({
          title: "خطأ في البحث",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setOffices(data || []);
    } catch (error) {
      console.error('Error searching offices:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchOffices]);

  // جلب مكاتب المستخدم الحالي
  const fetchUserOffices = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user offices:', error);
        return;
      }

      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching user offices:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  return {
    offices,
    loading,
    fetchOffices,
    fetchOfficeById,
    createOffice,
    updateOffice,
    searchOffices,
    fetchUserOffices
  };
};