import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { RealEstateOffice, OfficeFormData, OfficeFilters } from '@/types/offices';

export const useRealEstateOffices = () => {
  const [offices, setOffices] = useState<RealEstateOffice[]>([]);
  const [loading, setLoading] = useState(false);
  const [userOffice, setUserOffice] = useState<RealEstateOffice | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // جلب جميع المكاتب العقارية
  const fetchOffices = async (filters?: OfficeFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('real_estate_offices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (filters?.search) {
        query = query.or(`office_name.ilike.%${filters.search}%,owner_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }
      
      if (filters?.verified !== undefined) {
        query = query.eq('is_verified', filters.verified);
      }

      if (filters?.rating) {
        query = query.gte('rating', filters.rating);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      toast({
        title: "خطأ في جلب المكاتب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب مكتب المستخدم الحالي
  const fetchUserOffice = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserOffice(data || null);
    } catch (error) {
      console.error('Error fetching user office:', error);
    }
  };

  // إنشاء مكتب عقاري جديد
  const createOffice = async (formData: OfficeFormData) => {
    if (!user) {
      toast({
        title: "خطأ في التسجيل",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // رفع الشعار إذا كان موجود
      let logoUrl = '';
      if (formData.logo) {
        const logoFile = `${user.id}/logo-${Date.now()}.${formData.logo.name.split('.').pop()}`;
        const { error: logoError } = await supabase.storage
          .from('office-documents')
          .upload(logoFile, formData.logo);

        if (logoError) throw logoError;

        const { data: logoUrlData } = supabase.storage
          .from('office-documents')
          .getPublicUrl(logoFile);
        
        logoUrl = logoUrlData.publicUrl;
      }

      // رفع الصورة الغلاف إذا كانت موجودة
      let coverImageUrl = '';
      if (formData.cover_image) {
        const coverFile = `${user.id}/cover-${Date.now()}.${formData.cover_image.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from('office-documents')
          .upload(coverFile, formData.cover_image);

        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from('office-documents')
          .getPublicUrl(coverFile);
        
        coverImageUrl = coverUrlData.publicUrl;
      }

      // رفع المستندات
      const documents = [];
      for (const doc of formData.documents) {
        const docFile = `${user.id}/doc-${Date.now()}-${doc.name}`;
        const { error: docError } = await supabase.storage
          .from('office-documents')
          .upload(docFile, doc);

        if (docError) throw docError;

        const { data: docUrlData } = supabase.storage
          .from('office-documents')
          .getPublicUrl(docFile);

        documents.push({
          id: Date.now().toString(),
          name: doc.name,
          type: 'other' as const,
          url: docUrlData.publicUrl,
          uploaded_at: new Date().toISOString(),
        });
      }

      // إنشاء سجل المكتب
      const officeData = {
        user_id: user.id,
        office_name: formData.office_name,
        owner_name: formData.owner_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        license_number: formData.license_number || null,
        license_expiry: formData.license_expiry || null,
        description: formData.description || null,
        website: formData.website || null,
        social_media: formData.social_media || {},
        working_hours: formData.working_hours || {},
        services: formData.services || [],
        logo_url: logoUrl || null,
        cover_image_url: coverImageUrl || null,
        documents: documents,
        is_verified: false,
        is_active: true,
        rating: 0.0,
        reviews_count: 0,
        properties_count: 0,
      };

      const { data, error } = await supabase
        .from('real_estate_offices')
        .insert([officeData])
        .select()
        .single();

      if (error) throw error;

      setUserOffice(data);
      toast({
        title: "تم إنشاء المكتب بنجاح!",
        description: "سيتم مراجعة بياناتك وتوثيق المكتب خلال 48 ساعة",
      });

      return true;
    } catch (error) {
      console.error('Error creating office:', error);
      toast({
        title: "خطأ في إنشاء المكتب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // تحديث مكتب عقاري
  const updateOffice = async (id: string, formData: Partial<OfficeFormData>) => {
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

      const updateData: Partial<RealEstateOffice> = {
        office_name: formData.office_name,
        owner_name: formData.owner_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry,
        description: formData.description,
        website: formData.website,
        social_media: formData.social_media,
        working_hours: formData.working_hours,
        services: formData.services,
      };

      // رفع شعار جديد إذا كان موجود
      if (formData.logo) {
        const logoFile = `${user.id}/logo-${Date.now()}.${formData.logo.name.split('.').pop()}`;
        const { error: logoError } = await supabase.storage
          .from('office-documents')
          .upload(logoFile, formData.logo);

        if (logoError) throw logoError;

        const { data: logoUrlData } = supabase.storage
          .from('office-documents')
          .getPublicUrl(logoFile);
        
        updateData.logo_url = logoUrlData.publicUrl;
      }

      // رفع صورة غلاف جديدة إذا كانت موجودة
      if (formData.cover_image) {
        const coverFile = `${user.id}/cover-${Date.now()}.${formData.cover_image.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from('office-documents')
          .upload(coverFile, formData.cover_image);

        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from('office-documents')
          .getPublicUrl(coverFile);
        
        updateData.cover_image_url = coverUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('real_estate_offices')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserOffice(data);
      toast({
        title: "تم تحديث المكتب بنجاح!",
        description: "تم حفظ التغييرات",
      });

      return true;
    } catch (error) {
      console.error('Error updating office:', error);
      toast({
        title: "خطأ في تحديث المكتب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // حذف مكتب عقاري
  const deleteOffice = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('real_estate_offices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserOffice(null);
      toast({
        title: "تم حذف المكتب",
        description: "تم حذف المكتب العقاري بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Error deleting office:', error);
      toast({
        title: "خطأ في حذف المكتب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // جلب مكتب واحد بالمعرف
  const getOfficeById = async (id: string): Promise<RealEstateOffice | null> => {
    try {
      const { data, error } = await supabase
        .from('real_estate_offices')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching office:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchOffices();
      if (user) {
        await fetchUserOffice();
      }
    };
    loadData();
  }, [user]);

  return {
    offices,
    userOffice,
    loading,
    fetchOffices,
    fetchUserOffice,
    createOffice,
    updateOffice,
    deleteOffice,
    getOfficeById,
  };
};