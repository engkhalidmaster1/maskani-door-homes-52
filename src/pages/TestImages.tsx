import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Camera, Plus, RefreshCw, Upload, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PropertyCardData = React.ComponentProps<typeof PropertyCard>["property"];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "حدث خطأ غير متوقع";

const mapPropertyRowToCard = (row: PropertyRow): PropertyCardData => ({
  ...row,
  listing_type: row.listing_type === 'rent' ? 'rent' : 'sale',
  bedrooms: row.bedrooms ?? 0,
  bathrooms: row.bathrooms ?? 0,
});

export const TestImages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [testProperty, setTestProperty] = useState<PropertyCardData | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // إزالة الصور الافتراضية - العقارات بدون صور ستظهر placeholder
  const sampleImages: string[] = [];

  // Test uploading real images
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const uploadRealImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadStatus('uploading');
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `test-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        console.log('Uploading file:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
        console.log('Uploaded URL:', data.publicUrl);
      }

      setUploadStatus('success');
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadStatus('error');
      throw new Error(getErrorMessage(error));
    }
  };

  const createTestProperty = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإنشاء عقار تجريبي",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Upload real images if selected, otherwise create property without images
      let imagesToUse: string[] = [];
      if (selectedFiles.length > 0) {
        imagesToUse = await uploadRealImages();
      }

      const propertyData = {
        user_id: user.id,
        title: selectedFiles.length > 0 ? "عقار تجريبي مع صور مرفوعة" : "عقار تجريبي بدون صور",
        description: selectedFiles.length > 0 ? 
          "هذا عقار تجريبي مع صور تم رفعها فعلياً إلى Storage." : 
          "هذا عقار تجريبي بدون صور لاختبار عرض الـ placeholder.",
        property_type: "apartment",
        listing_type: "sale",
        price: 150000,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        location: "منطقة تجريبية - شارع الاختبار",
        address: "شقة تجريبية، عمارة 123، الطابق 5",
        amenities: ["مؤثثة", "مكيف", "واي فاي"],
        images: imagesToUse,
        is_published: true,
      };

      console.log('Creating property with images:', imagesToUse);

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        throw error;
      }

  setTestProperty(mapPropertyRowToCard(data as PropertyRow));
      toast({
        title: "تم إنشاء العقار التجريبي!",
        description: selectedFiles.length > 0 ? 
          "تم رفع الصور وإنشاء العقار بنجاح" : 
          "يمكنك الآن رؤية كيف تظهر الصور",
      });

      // Reset file selection
      setSelectedFiles([]);
      setUploadStatus('idle');

    } catch (error) {
      console.error('Error creating test property:', error);
      toast({
        title: "خطأ في إنشاء العقار التجريبي",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestProperty = async () => {
    if (!testProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', testProperty.id);

      if (error) {
        throw error;
      }

      setTestProperty(null);
      toast({
        title: "تم حذف العقار التجريبي",
        description: "تم تنظيف البيانات التجريبية",
      });

    } catch (error) {
      console.error('Error deleting test property:', error);
      toast({
        title: "خطأ في حذف العقار التجريبي",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-elegant mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-orange-500 text-white p-2 rounded-lg">
                <Camera className="w-6 h-6" />
              </div>
              اختبار نظام الصور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                هذه الصفحة لاختبار عرض الصور في التطبيق. ستقوم بإنشاء عقار تجريبي مع صور حقيقية.
              </p>
              
              <div className="flex gap-4">
                <Button
                  onClick={createTestProperty}
                  disabled={isCreating || !!testProperty}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isCreating ? "جاري الإنشاء..." : "إنشاء عقار تجريبي"}
                </Button>
                
                {testProperty && (
                  <Button
                    onClick={deleteTestProperty}
                    variant="destructive"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    حذف العقار التجريبي
                  </Button>
                )}
              </div>

              {testProperty && (
                <div className="mt-6">
                  <Badge className="mb-4">تم إنشاء العقار التجريبي بنجاح!</Badge>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PropertyCard property={testProperty} />
                    <div className="space-y-3">
                      <h3 className="font-semibold">معلومات العقار:</h3>
                      <div className="text-sm space-y-1">
                        <div>المعرف: {testProperty.id}</div>
                        <div>عدد الصور: {testProperty.images?.length || 0}</div>
                        <div>الحالة: {testProperty.is_published ? "منشور" : "غير منشور"}</div>
                      </div>
                      <Button
                        onClick={() => navigate(`/property/${testProperty.id}`)}
                        className="w-full mt-4"
                      >
                        عرض تفاصيل العقار
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>الصور التجريبية المستخدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleImages.map((url, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={url}
                    alt={`صورة تجريبية ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <p className="text-xs text-muted-foreground break-all">
                    {url}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
