import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  property_type: string;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  building: string;
  apartment: string;
  floor: number;
  market: string;
  furnished: boolean;
  amenities: string[];
  images: string[];
  is_published: boolean;
  user_id: string;
}

export const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    address: '',
    property_type: '',
    listing_type: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    building: '',
    apartment: '',
    floor: '',
    market: '',
    furnished: false,
    amenities: [] as string[],
    images: [] as string[],
    is_published: false
  });

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "خطأ",
          description: "العقار غير موجود",
          variant: "destructive",
        });
        navigate("/properties");
        return;
      }

      // Check if user can edit this property
      if (!isAdmin && data.user_id !== user?.id) {
        toast({
          title: "خطأ",
          description: "ليس لديك صلاحية لتعديل هذا العقار",
          variant: "destructive",
        });
        navigate("/properties");
        return;
      }

      setProperty({
        ...data,
        building: (data as any).building || '',
        apartment: (data as any).apartment || '',
        floor: (data as any).floor || 0,
        market: (data as any).market || '',
        furnished: (data as any).furnished || false
      } as Property);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        location: data.location || '',
        address: data.address || '',
        property_type: data.property_type || '',
        listing_type: data.listing_type || '',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        area: data.area?.toString() || '',
        building: (data as any).building || '',
        apartment: (data as any).apartment || '',
        floor: (data as any).floor?.toString() || '',
        market: (data as any).market || '',
        furnished: (data as any).furnished || false,
        amenities: data.amenities || [],
        images: data.images || [],
        is_published: data.is_published || false
      });
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العقار",
        variant: "destructive",
      });
      navigate("/properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.location,
        address: formData.address,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseInt(formData.bathrooms) || null,
        area: parseFloat(formData.area) || null,
        building: formData.building,
        apartment: formData.apartment,
        floor: parseInt(formData.floor) || null,
        market: formData.market,
        furnished: formData.furnished,
        amenities: formData.amenities,
        images: formData.images,
        is_published: formData.is_published,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث العقار بنجاح",
      });

      navigate("/properties");
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث العقار",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublication = async () => {
    const newStatus = !formData.is_published;
    setFormData(prev => ({ ...prev, is_published: newStatus }));

    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: newStatus ? "تم نشر العقار" : "تم إخفاء العقار",
        description: newStatus ? "العقار مرئي للعملاء الآن" : "العقار غير مرئي للعملاء الآن",
      });
    } catch (error) {
      console.error('Error toggling publication:', error);
      setFormData(prev => ({ ...prev, is_published: !newStatus }));
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة النشر",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>جاري تحميل بيانات العقار...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/properties")}>
            <ArrowRight className="w-4 h-4 mr-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل العقار</h1>
            <p className="text-muted-foreground">{property?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={formData.is_published ? "default" : "secondary"}>
            {formData.is_published ? "منشور" : "مخفي"}
          </Badge>
          <Button
            variant="outline"
            onClick={togglePublication}
            className="flex items-center gap-2"
          >
            {formData.is_published ? (
              <>
                <EyeOff className="w-4 h-4" />
                إخفاء العقار
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                نشر العقار
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان العقار</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="price">السعر (ريال سعودي)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_type">نوع العقار</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شقة">شقة</SelectItem>
                      <SelectItem value="فيلا">فيلا</SelectItem>
                      <SelectItem value="بيت شعبي">بيت شعبي</SelectItem>
                      <SelectItem value="استراحة">استراحة</SelectItem>
                      <SelectItem value="مكتب">مكتب</SelectItem>
                      <SelectItem value="محل">محل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="listing_type">نوع الإعلان</Label>
                  <Select
                    value={formData.listing_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, listing_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="للبيع">للبيع</SelectItem>
                      <SelectItem value="للإيجار">للإيجار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الموقع والعنوان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">المدينة</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="building">اسم المبنى</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apartment">رقم الشقة</Label>
                  <Input
                    id="apartment"
                    value={formData.apartment}
                    onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="floor">الطابق</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="market">السوق القريب</Label>
                <Input
                  id="market"
                  value={formData.market}
                  onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل العقار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">غرف النوم</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">دورات المياه</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="area">المساحة (م²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, furnished: checked }))}
                />
                <Label htmlFor="furnished">مفروش</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات النشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">حالة النشر</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_published 
                      ? "العقار مرئي للعملاء" 
                      : "العقار مخفي عن العملاء"
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={togglePublication}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/properties")}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </form>
    </div>
  );
};