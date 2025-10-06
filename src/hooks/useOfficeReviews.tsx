import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OfficeReview {
  id: string;
  office_id: string;
  user_id?: string;
  reviewer_name: string;
  reviewer_email?: string;
  reviewer_phone?: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  approved: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewFormData {
  reviewer_name: string;
  reviewer_email?: string;
  reviewer_phone?: string;
  rating: number;
  comment: string;
}

export const useOfficeReviews = () => {
  const [reviews, setReviews] = useState<OfficeReview[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // جلب المراجعات المعتمدة لمكتب معين
  const fetchOfficeReviews = useCallback(async (officeId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('office_reviews')
        .select('*')
        .eq('office_id', officeId)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: "خطأ في جلب المراجعات",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب المراجعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // إضافة مراجعة جديدة
  const addReview = useCallback(async (officeId: string, reviewData: ReviewFormData) => {
    try {
      setLoading(true);

      const reviewToInsert = {
        office_id: officeId,
        user_id: user?.id || null,
        reviewer_name: reviewData.reviewer_name,
        reviewer_email: reviewData.reviewer_email,
        reviewer_phone: reviewData.reviewer_phone,
        rating: reviewData.rating,
        comment: reviewData.comment,
        verified_purchase: !!user, // المستخدمون المسجلون يعتبرون متحققين
        approved: false // يحتاج موافقة أولاً
      };

      const { error } = await supabase
        .from('office_reviews')
        .insert([reviewToInsert]);

      if (error) {
        console.error('Error adding review:', error);
        toast({
          title: "خطأ في إضافة المراجعة",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "تم إرسال المراجعة",
        description: "شكراً لك! سيتم مراجعة تقييمك قبل النشر",
      });

      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      toast({
        title: "خطأ في إرسال المراجعة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // حساب متوسط التقييم
  const calculateAverageRating = useCallback((reviewsList: OfficeReview[] = reviews) => {
    if (reviewsList.length === 0) return 0;
    const sum = reviewsList.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviewsList.length;
  }, [reviews]);

  // إحصائيات التقييمات
  const getReviewsStats = useCallback((reviewsList: OfficeReview[] = reviews) => {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewsList.forEach(review => {
      stats[review.rating as keyof typeof stats]++;
    });
    return stats;
  }, [reviews]);

  // جلب المراجعات المعلقة لمكتب معين (للمالك)
  const fetchPendingReviews = useCallback(async (officeId: string) => {
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
          description: "ليس لديك صلاحية لعرض هذه المراجعات",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('office_reviews')
        .select('*')
        .eq('office_id', officeId)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending reviews:', error);
        toast({
          title: "خطأ في جلب المراجعات",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب المراجعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // الموافقة على مراجعة
  const approveReview = useCallback(async (reviewId: string) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('office_reviews')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', reviewId);

      if (error) {
        console.error('Error approving review:', error);
        toast({
          title: "خطأ في الموافقة",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "تم قبول المراجعة",
        description: "تم نشر المراجعة بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "خطأ في الموافقة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    reviews,
    loading,
    fetchOfficeReviews,
    addReview,
    calculateAverageRating,
    getReviewsStats,
    fetchPendingReviews,
    approveReview
  };
};