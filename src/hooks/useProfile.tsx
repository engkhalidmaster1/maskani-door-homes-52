import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: null,
    phone: null,
    address: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await createProfile();
          return;
        }
        throw error;
      }

      setProfileData({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
        address: data?.address || '',
      });
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: "خطأ في تحميل البيانات",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: '',
          phone: '',
          address: '',
        });

      if (error) throw error;

      setProfileData({
        full_name: '',
        phone: '',
        address: '',
      });
    } catch (error: unknown) {
      console.error('Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: "خطأ في إنشاء الملف الشخصي",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (data: ProfileData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfileData(data);
      toast({
        title: "تم حفظ التغييرات بنجاح!",
        description: "تم تحديث معلومات الملف الشخصي",
      });
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: "خطأ في حفظ البيانات",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return {
    profileData,
    isLoading,
    isSaving,
    updateProfile,
    fetchProfile,
  };
};
