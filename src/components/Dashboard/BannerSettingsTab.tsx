import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Clock
} from "lucide-react";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { toast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

type BannerSettings = Database['public']['Tables']['banner_settings']['Row'];

export const BannerSettingsTab = () => {
  const { 
    allBanners, 
    isLoadingAll, 
    createBanner, 
    updateBanner, 
    deleteBanner,
    isCreating,
    isUpdating,
    isDeleting
  } = useBannerSettings();

  // Debug information
  console.log('BannerSettingsTab - allBanners:', allBanners);
  console.log('BannerSettingsTab - isLoadingAll:', isLoadingAll);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSettings | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const resetForm = () => {
    setFormData({
      text: '',
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال نص الشريط",
        variant: "destructive",
      });
      return;
    }

    const bannerData = {
      text: formData.text.trim(),
      is_active: formData.is_active,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingBanner) {
      updateBanner({ id: editingBanner.id, updates: bannerData });
    } else {
      createBanner(bannerData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (banner: BannerSettings) => {
    setEditingBanner(banner);
    setFormData({
      text: banner.text,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBanner(id);
  };

      const formatDate = (dateString: string | null) => {
      if (!dateString) return 'غير محدد';
      return new Date(dateString).toLocaleDateString('en-US');
    };

  const getStatusBadge = (banner: BannerSettings) => {
    if (!banner.is_active) {
      return <Badge variant="secondary">معطل</Badge>;
    }

    const now = new Date();
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;

    if (startDate && now < startDate) {
      return <Badge variant="outline">قادم</Badge>;
    }

    if (endDate && now > endDate) {
      return <Badge variant="destructive">منتهي</Badge>;
    }

    return <Badge variant="default">نشط</Badge>;
  };

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2">جاري تحميل الشعارات...</p>
      </div>
    );
  }

  // Show error if any
  if (!allBanners) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">خطأ في تحميل الشعارات</p>
          <p className="text-sm text-muted-foreground">يرجى المحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  // Debug information
  console.log('BannerSettingsTab - allBanners:', allBanners);
  console.log('BannerSettingsTab - isLoadingAll:', isLoadingAll);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الشريط العلوي</h2>
          <p className="text-muted-foreground">
            إدارة النصوص والتواريخ التي تظهر في الشريط العلوي للموقع
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة شريط جديد
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'تعديل الشريط' : 'إضافة شريط جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">نص الشريط</Label>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="أدخل نص الشريط الذي سيظهر للمستخدمين..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">تفعيل الشريط</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">تاريخ البداية (اختياري)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">تاريخ النهاية (اختياري)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  ) : (
                    <>{editingBanner ? 'تحديث' : 'إضافة'}</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            الشعارات الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBanners && allBanners.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النص</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allBanners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={banner.text}>
                        {banner.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(banner)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(banner.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(banner.end_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(banner.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا الشريط؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(banner.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد شعارات مضافة حتى الآن
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
