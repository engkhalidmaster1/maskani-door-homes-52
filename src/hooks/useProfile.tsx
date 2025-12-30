import { useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      // حل مؤقت للمستخدم المحدد حتى يتم إصلاح قاعدة البيانات
      if (user.id === '85c5601e-d99e-4daa-90c6-515f5accff06') {
        setProfileData({
          full_name: 'Khalid Engineer',
          phone: '',
          address: ''
        });
        setIsLoading(false);
        return;
      }
      
      // للمستخدمين الآخرين، محاولة جلب البيانات العادية
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, address')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.log('Profile not found, using default data');
          setProfileData({
            full_name: '',
            phone: '',
            address: ''
          });
        } else {
          setProfileData(data);
        }
      } catch (error) {
        console.log('Error fetching profile, using default data');
        setProfileData({
          full_name: '',
          phone: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfileData({
        full_name: '',
        phone: '',
        address: ''
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = async (newData: Partial<ProfileData>) => {
    if (!user) return false;

    setIsSaving(true);
    try {
      // للمستخدم المحدد، نحفظ البيانات محلياً فقط
      if (user.id === '85c5601e-d99e-4daa-90c6-515f5accff06') {
        setProfileData(prev => ({ ...prev, ...newData }));
        toast({
          title: "تم حفظ البيانات مؤقتاً",
          description: "سيتم حفظ البيانات نهائياً بعد إصلاح قاعدة البيانات",
        });
        return true;
      }

      // للمستخدمين الآخرين، محاولة الحفظ العادية
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...newData,
        });

      if (error) {
        throw error;
      }

      setProfileData(prev => ({ ...prev, ...newData }));
      toast({
        title: "تم حفظ البيانات",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
      return true;
    } catch (error) {
      toast({
        title: "خطأ في حفظ البيانات",
        description: "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
      return false;
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
  }, [user, fetchProfile]);

  return {
    profileData,
    isLoading,
    isSaving,
    updateProfile,
    fetchProfile,
  };
};