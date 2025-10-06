import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ContactRequest {
  id: string;
  office_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  message: string;
  contact_method: 'whatsapp' | 'phone' | 'email';
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  responded_at?: string;
  created_at: string;
}

export interface ContactRequestData {
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  message: string;
  contact_method?: 'whatsapp' | 'phone' | 'email';
}

export const useContactRequests = () => {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // إرسال طلب تواصل جديد
  const sendContactRequest = useCallback(async (
    officeId: string, 
    requestData: ContactRequestData
  ) => {
    try {
      setLoading(true);

      const requestToInsert = {
        office_id: officeId,
        sender_name: requestData.sender_name,
        sender_phone: requestData.sender_phone,
        sender_email: requestData.sender_email,
        message: requestData.message,
        contact_method: requestData.contact_method || 'whatsapp',
        status: 'pending' as const
      };

      const { error } = await supabase
        .from('office_contact_requests')
        .insert([requestToInsert]);

      if (error) {
        console.error('Error sending contact request:', error);
        toast({
          title: "خطأ في إرسال الطلب",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سيتم التواصل معك قريباً",
      });

      return true;
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast({
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // جلب طلبات التواصل لمكتب معين (للمالك)
  const fetchOfficeRequests = useCallback(async (officeId: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // التحقق من أن المستخدم يملك المكتب
      const { data: office } = await supabase
        .from('real_estate_offices')
        .select('user_id')
        .eq('id', officeId)
        .eq('user_id', user.id)
        .single();

      if (!office) {
        toast({
          title: "غير مخول",
          description: "ليس لديك صلاحية لعرض هذه الطلبات",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('office_contact_requests')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact requests:', error);
        toast({
          title: "خطأ في جلب الطلبات",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب الطلبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // جلب جميع طلبات التواصل للمستخدم الحالي (جميع مكاتبه)
  const fetchUserRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // جلب مكاتب المستخدم أولاً
      const { data: userOffices } = await supabase
        .from('real_estate_offices')
        .select('id')
        .eq('user_id', user.id);

      if (!userOffices || userOffices.length === 0) {
        setRequests([]);
        return;
      }

      const officeIds = userOffices.map(office => office.id);

      const { data, error } = await supabase
        .from('office_contact_requests')
        .select(`
          *,
          real_estate_offices!inner(name)
        `)
        .in('office_id', officeIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user requests:', error);
        toast({
          title: "خطأ في جلب الطلبات",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب الطلبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // تحديث حالة طلب التواصل
  const updateRequestStatus = useCallback(async (
    requestId: string, 
    status: ContactRequest['status']
  ) => {
    if (!user) return false;

    try {
      setLoading(true);

      const updateData: Partial<Pick<ContactRequest, 'status' | 'responded_at'>> & { responded_at?: string } = { status };
      
      // إضافة تاريخ الرد إذا تم التواصل
      if (status === 'contacted' || status === 'completed') {
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('office_contact_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        toast({
          title: "خطأ في التحديث",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      const statusMessages = {
        contacted: 'تم وضع علامة "تم التواصل"',
        completed: 'تم وضع علامة "مكتمل"',
        cancelled: 'تم إلغاء الطلب',
        pending: 'تم وضع علامة "قيد الانتظار"'
      };

      toast({
        title: "تم التحديث",
        description: statusMessages[status],
      });

      // إعادة جلب الطلبات
      await fetchUserRequests();

      return true;
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "خطأ في التحديث",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchUserRequests]);

  // إحصائيات طلبات التواصل
  const getRequestsStats = useCallback((requestsList: ContactRequest[] = requests) => {
    const stats = {
      total: requestsList.length,
      pending: requestsList.filter(r => r.status === 'pending').length,
      contacted: requestsList.filter(r => r.status === 'contacted').length,
      completed: requestsList.filter(r => r.status === 'completed').length,
      cancelled: requestsList.filter(r => r.status === 'cancelled').length,
    };
    return stats;
  }, [requests]);

  return {
    requests,
    loading,
    sendContactRequest,
    fetchOfficeRequests,
    fetchUserRequests,
    updateRequestStatus,
    getRequestsStats
  };
};