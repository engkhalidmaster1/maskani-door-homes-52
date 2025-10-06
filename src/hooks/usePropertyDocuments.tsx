import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PropertyDocumentData {
  id: string;
  property_id: string;
  document_id: string;
  name: string;
  type: 'ownership' | 'identity' | 'permit' | 'survey' | 'contract' | 'other';
  url: string;
  size: number;
  uploaded_at: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  user_id: string;
}

export interface DocumentVerificationUpdate {
  document_id: string;
  verified: boolean;
  notes?: string;
}

export const usePropertyDocuments = (propertyId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PropertyDocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // جلب المستندات
  const fetchDocuments = useCallback(async (propId?: string) => {
    if (!propId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_documents')
        .select(`
          *,
          verified_by_profile:profiles!property_documents_verified_by_fkey(
            full_name
          )
        `)
        .eq('property_id', propId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "خطأ في جلب المستندات",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // رفع مستند جديد
  const uploadDocument = async (
    file: File, 
    type: PropertyDocumentData['type'],
    targetPropertyId: string
  ) => {
    if (!user) {
      toast({
        title: "خطأ في التحميل",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploading(true);

      // تحديد مسار الملف
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetPropertyId}/${type}/${Date.now()}.${fileExt}`;
      
      // رفع الملف إلى التخزين
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // الحصول على رابط الملف
      const { data: urlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // إنشاء سجل في قاعدة البيانات
      const documentData = {
        property_id: targetPropertyId,
        document_id: `doc_${Date.now()}`,
        name: file.name,
        type,
        url: urlData.publicUrl,
        size: file.size,
        user_id: user.id,
        verified: false
      };

      const { data: dbData, error: dbError } = await supabase
        .from('property_documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) throw dbError;

      // إضافة المستند الجديد للقائمة المحلية
      if (targetPropertyId === propertyId) {
        setDocuments(prev => [dbData, ...prev]);
      }

      toast({
        title: "تم رفع المستند بنجاح",
        description: `تم رفع ${file.name}`,
      });

      return dbData;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في رفع المستند",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // حذف مستند
  const deleteDocument = async (documentId: string) => {
    try {
      const document = documents.find(doc => doc.document_id === documentId);
      if (!document) return false;

      // حذف من التخزين
      const filePath = document.url.split('/').slice(-3).join('/');
      await supabase.storage
        .from('property-documents')
        .remove([filePath]);

      // حذف من قاعدة البيانات
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;

      // إزالة من القائمة المحلية
      setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));

      toast({
        title: "تم حذف المستند",
        description: "تم حذف المستند بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في حذف المستند",
        description: "حدث خطأ أثناء حذف المستند",
        variant: "destructive",
      });
      return false;
    }
  };

  // توثيق مستند (للمكاتب العقارية)
  const verifyDocument = async (update: DocumentVerificationUpdate) => {
    if (!user) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية لتوثيق المستندات",
        variant: "destructive",
      });
      return false;
    }

    try {
      const updateData = {
        verified: update.verified,
        verified_at: update.verified ? new Date().toISOString() : null,
        verified_by: update.verified ? user.id : null,
        notes: update.notes
      };

      const { error } = await supabase
        .from('property_documents')
        .update(updateData)
        .eq('document_id', update.document_id);

      if (error) throw error;

      // تحديث القائمة المحلية
      setDocuments(prev => prev.map(doc => 
        doc.document_id === update.document_id 
          ? { ...doc, ...updateData }
          : doc
      ));

      toast({
        title: update.verified ? "تم توثيق المستند" : "تم إلغاء توثيق المستند",
        description: update.verified 
          ? "تم توثيق المستند بنجاح" 
          : "تم إلغاء توثيق المستند",
      });

      return true;
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "خطأ في توثيق المستند",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    }
  };

  // جلب المستندات غير الموثقة (للمكاتب العقارية)
  const fetchUnverifiedDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_documents')
        .select(`
          *,
          property:properties(
            title,
            location,
            price
          ),
          uploader:profiles!property_documents_user_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('verified', false)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unverified documents:', error);
      toast({
        title: "خطأ في جلب المستندات",
        description: "حدث خطأ أثناء جلب المستندات غير الموثقة",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // جلب إحصائيات المستندات
  const getDocumentStats = async (officeId?: string) => {
    try {
      let query = supabase
        .from('property_documents')
        .select('verified, type', { count: 'exact' });

      if (officeId) {
        // جلب مستندات العقارات التابعة للمكتب العقاري
        const { data: officeProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('office_id', officeId);

        if (officeProperties && officeProperties.length > 0) {
          const propertyIds = officeProperties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          return {
            total: 0,
            verified: 0,
            pending: 0,
            byType: {}
          };
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        verified: data?.filter(d => d.verified).length || 0,
        pending: data?.filter(d => !d.verified).length || 0,
        byType: data?.reduce((acc: Record<string, number>, doc) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        total: 0,
        verified: 0,
        pending: 0,
        byType: {}
      };
    }
  };

  // تأثير جانبي لجلب المستندات عند تغيير معرف العقار
  useEffect(() => {
    if (propertyId) {
      fetchDocuments(propertyId);
    }
  }, [propertyId, fetchDocuments]);

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    verifyDocument,
    fetchDocuments,
    fetchUnverifiedDocuments,
    getDocumentStats,
    refreshDocuments: () => fetchDocuments(propertyId)
  };
};