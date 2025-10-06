import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// نوع البيانات للمكتب العقاري (مؤقت)
export interface RealEstateOffice {
  id: string;
  user_id: string;
  name: string;
  license_number: string;
  description?: string;
  services?: string[];
  phone: string;
  email?: string;
  website?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  working_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  social_media?: Record<string, string>;
  logo_url?: string;
  verified: boolean;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OfficeFormData {
  name: string;
  license_number: string;
  description?: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  services: string[];
  working_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

// بيانات تجريبية مؤقتة
const TEMP_OFFICES: RealEstateOffice[] = [
  {
    id: '1',
    user_id: 'temp-user-1',
    name: 'مكتب العقارات الذهبية',
    license_number: 'RE-2024-001',
    description: 'مكتب عقاري متخصص في العقارات السكنية والتجارية الفاخرة',
    services: ['بيع العقارات', 'شراء العقارات', 'تأجير العقارات', 'إدارة العقارات'],
    phone: '+966501234567',
    email: 'info@golden-estates.com',
    website: 'https://golden-estates.com',
    address: 'الرياض، حي الملز، المملكة العربية السعودية',
    latitude: 24.7136,
    longitude: 46.6753,
    verified: true,
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    user_id: 'temp-user-2',
    name: 'مكتب النجمة للعقارات',
    license_number: 'RE-2024-002',
    description: 'خبراء في العقارات السكنية بأسعار مناسبة للجميع',
    services: ['بيع العقارات', 'شراء العقارات', 'استشارات عقارية'],
    phone: '+966507654321',
    email: 'contact@star-realestate.com',
    address: 'جدة، حي الروضة، المملكة العربية السعودية',
    latitude: 21.5433,
    longitude: 39.1728,
    verified: true,
    status: 'active',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  }
];

// Hook مؤقت يعمل مع البيانات المحلية
export const useRealEstateOfficesDB = () => {
  const [offices, setOffices] = useState<RealEstateOffice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // جلب المكاتب (من البيانات المؤقتة)
  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Using temporary local data (database not configured)');
      
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOffices(TEMP_OFFICES);
      console.log(`✅ Loaded ${TEMP_OFFICES.length} temporary offices`);
      
      toast({
        title: "تحذير",
        description: "يتم عرض بيانات تجريبية. لعرض البيانات الحقيقية، يجب إعداد قاعدة البيانات.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('❌ Error loading temporary data:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // جلب مكتب واحد حسب المعرف
  const fetchOfficeById = useCallback(async (id: string): Promise<RealEstateOffice | null> => {
    const office = TEMP_OFFICES.find(o => o.id === id);
    return office || null;
  }, []);

  // إنشاء مكتب جديد (مؤقت)
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
      
      const newOffice: RealEstateOffice = {
        id: `temp-${Date.now()}`,
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
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // إضافة للقائمة المؤقتة
      TEMP_OFFICES.unshift(newOffice);
      setOffices([...TEMP_OFFICES]);

      toast({
        title: "تم التسجيل (بيانات مؤقتة)",
        description: "لحفظ المكتب بشكل دائم، يجب إعداد قاعدة البيانات",
        variant: "destructive",
      });

      return newOffice;
    } catch (error) {
      console.error('Error creating office:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // تحديث مكتب موجود (مؤقت)
  const updateOffice = useCallback(async (id: string, updates: Partial<OfficeFormData>) => {
    console.log('🔄 Temporary update operation (database not configured)');
    return true;
  }, []);

  // البحث في المكاتب (مؤقت)
  const searchOffices = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOffices(TEMP_OFFICES);
      return;
    }

    const filtered = TEMP_OFFICES.filter(office => 
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setOffices(filtered);
  }, []);

  // جلب مكاتب المستخدم الحالي (مؤقت)
  const fetchUserOffices = useCallback(async () => {
    if (!user) return;
    
    const userOffices = TEMP_OFFICES.filter(office => office.user_id === user.id);
    setOffices(userOffices);
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