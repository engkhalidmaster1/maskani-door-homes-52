import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { useOfficeReviews } from '@/hooks/useOfficeReviews';

interface ReviewsModalProps {
  office: RealEstateOffice;
}

// تم إزالة البيانات التجريبية - سيتم استخدام البيانات من قاعدة البيانات

const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange?: (rating: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
          onClick={() => onRatingChange && onRatingChange(star)}
        />
      ))}
    </div>
  );
};

export const ReviewsModal = ({ office }: ReviewsModalProps) => {
  const [open, setOpen] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const { toast } = useToast();
  
  const {
    reviews,
    loading,
    addReview,
    fetchOfficeReviews,
    calculateAverageRating,
    getReviewsStats,
  } = useOfficeReviews();

  React.useEffect(() => {
    if (open) {
      fetchOfficeReviews(office.id);
    }
  }, [open, fetchOfficeReviews, office.id]);

  const ratingCounts = getReviewsStats(reviews);
  const averageRating = calculateAverageRating(reviews);
  const reviewsCount = reviews.length;
  const averageRatingDisplay = reviewsCount > 0 ? averageRating.toFixed(1) : '0.0';
  const averageStarValue = reviewsCount > 0 ? Math.round(averageRating) : 0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewerName.trim() || !comment.trim() || rating === 0) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول وتحديد التقييم",
        variant: "destructive"
      });
      return;
    }

    const success = await addReview(office.id, {
      reviewer_name: reviewerName.trim(),
      rating,
      comment: comment.trim()
    });

    if (success) {
      toast({
        title: "تم إرسال التقييم",
        description: "شكراً لك! سيتم مراجعة تقييمك قبل النشر",
      });
      await fetchOfficeReviews(office.id);
    }

    // إعادة تعيين النموذج
    setRating(0);
    setComment('');
    setReviewerName('');
    setShowAddReview(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          المراجعات ({reviewsCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            مراجعات {office.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* إحصائيات التقييم */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {averageRatingDisplay}
                  </div>
                  <StarRating rating={averageStarValue} />
                  <div className="text-sm text-gray-600 mt-1">
                    {reviewsCount} مراجعة
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const key = stars as 1 | 2 | 3 | 4 | 5;
                      const count = ratingCounts[key] ?? 0;
                      const percentage = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span>{stars}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Progress
                            value={percentage}
                            className="h-2 flex-1 bg-gray-200 [&>div]:bg-yellow-400"
                          />
                          <span className="text-gray-600">({count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة المراجعات */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">المراجعات</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddReview(!showAddReview)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                أضف مراجعة
              </Button>
            </div>

            {/* نموذج إضافة مراجعة */}
            {showAddReview && (
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div>
                      <Label htmlFor="reviewerName">اسمك</Label>
                      <Input
                        id="reviewerName"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="أدخل اسمك"
                        required
                      />
                    </div>
                    <div>
                      <Label>التقييم</Label>
                      <StarRating rating={rating} onRatingChange={setRating} />
                    </div>
                    <div>
                      <Label htmlFor="comment">تعليقك</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="اكتب تجربتك مع هذا المكتب..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">إرسال المراجعة</Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowAddReview(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* المراجعات الموجودة */}
            {reviews.length === 0 && !loading && (
              <div className="text-center text-sm text-gray-500 py-6">
                لا توجد مراجعات بعد. كن أول من يشارك تجربته مع هذا المكتب.
              </div>
            )}

            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{review.reviewer_name}</span>
                      {review.verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          عميل متحقق
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} />
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(review.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};