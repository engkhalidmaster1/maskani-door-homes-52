import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Camera, Upload, Check, X, AlertCircle, RefreshCw, Database, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DiagnosticProperty {
  id: string;
  title: string;
  images: string[];
  property_type: string;
  created_at: string;
}

export const ImageDiagnostics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [diagnosticProperty, setDiagnosticProperty] = useState<DiagnosticProperty | null>(null);
  const [recentProperties, setRecentProperties] = useState<DiagnosticProperty[]>([]);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkBucketStatus();
    fetchRecentProperties();
  }, []);

  const checkBucketStatus = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket('property-images');
      setBucketExists(!error && !!data);
      console.log('Bucket status:', !error && !!data, error);
    } catch (error) {
      console.error('Error checking bucket:', error);
      setBucketExists(false);
    }
  };

  const fetchRecentProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, images, property_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const testImageUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "لم تختر أي صور",
        description: "يرجى اختيار صور للاختبار",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('uploading');
    const urls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `diagnostic-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        console.log('Uploading:', fileName);

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

        urls.push(data.publicUrl);
        console.log('Uploaded URL:', data.publicUrl);
      }

      setUploadedUrls(urls);
      setUploadStatus('success');

      toast({
        title: "تم رفع الصور بنجاح!",
        description: `تم رفع ${urls.length} صورة`,
      });

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      toast({
        title: "فشل في رفع الصور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createDiagnosticProperty = async () => {
    if (uploadedUrls.length === 0) {
      toast({
        title: "لا توجد صور مرفوعة",
        description: "يرجى رفع صور أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const propertyData = {
        user_id: user?.id,
        title: `تشخيص الصور - ${new Date().toLocaleString('ar')}`,
        description: "عقار تشخيصي للتحقق من عرض الصور المرفوعة",
        property_type: "apartment",
        listing_type: "sale",
        price: 100000,
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
        location: "اختبار تشخيصي",
        address: "عنوان تشخيصي",
        amenities: ["تشخيص"],
        images: uploadedUrls, // هنا نستخدم الصور المرفوعة فعلياً
        is_published: true,
      };

      console.log('Creating property with images:', uploadedUrls);

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      setDiagnosticProperty(data);
      fetchRecentProperties(); // Refresh the list

      toast({
        title: "تم إنشاء العقار التشخيصي!",
        description: "يمكنك الآن فحص عرض الصور",
      });

    } catch (error: any) {
      console.error('Error creating property:', error);
      toast({
        title: "فشل في إنشاء العقار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteDiagnosticProperty = async () => {
    if (!diagnosticProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', diagnosticProperty.id);

      if (error) throw error;

      setDiagnosticProperty(null);
      fetchRecentProperties();

      toast({
        title: "تم حذف العقار التشخيصي",
      });

    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        title: "فشل في حذف العقار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            العودة
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 تشخيص نظام الصور
          </h1>
          <p className="text-gray-600">
            أداة شاملة لتشخيص وإصلاح مشاكل رفع وعرض الصور
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <span className="font-medium">Storage Bucket</span>
                {bucketExists === null ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : bucketExists ? (
                  <Badge variant="default" className="bg-green-500">متاح</Badge>
                ) : (
                  <Badge variant="destructive">غير متاح</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <span className="font-medium">حالة الرفع</span>
                {uploadStatus === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {uploadStatus === 'success' && <Check className="w-4 h-4 text-green-500" />}
                {uploadStatus === 'error' && <X className="w-4 h-4 text-red-500" />}
                {uploadStatus === 'idle' && <Badge variant="secondary">جاهز</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-medium">صور مرفوعة</span>
                <Badge variant="outline">{uploadedUrls.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Test Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                اختبار رفع الصور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  اختر صور للاختبار
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    تم اختيار {selectedFiles.length} صورة
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                      <Camera className="w-3 h-3" />
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={testImageUpload}
                disabled={selectedFiles.length === 0 || uploadStatus === 'uploading'}
                className="w-full"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    اختبار رفع الصور
                  </>
                )}
              </Button>

              {uploadedUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">
                    ✅ تم رفع {uploadedUrls.length} صورة بنجاح:
                  </p>
                  {uploadedUrls.map((url, index) => (
                    <div key={index} className="text-xs bg-green-50 p-2 rounded">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {url.substring(0, 80)}...
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Creation Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                إنشاء عقار تشخيصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={createDiagnosticProperty}
                disabled={uploadedUrls.length === 0}
                className="w-full"
                size="lg"
              >
                إنشاء عقار مع الصور المرفوعة
              </Button>
              
              <Button
                onClick={deleteDiagnosticProperty}
                variant="destructive"
                className="w-full"
                disabled={!diagnosticProperty}
              >
                حذف العقار التشخيصي
              </Button>
              
              {diagnosticProperty && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ تم إنشاء العقار التشخيصي
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    ID: {diagnosticProperty.id}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">
                    صور محفوظة: {diagnosticProperty.images?.length || 0}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => navigate(`/property/${diagnosticProperty.id}`)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    عرض العقار
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Display Test */}
          {diagnosticProperty && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>العقار التشخيصي</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyCard property={diagnosticProperty} />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">تفاصيل الصور المحفوظة:</p>
                  {diagnosticProperty.images?.map((url: string, index: number) => (
                    <div key={index} className="text-xs text-gray-600 mb-1 break-all">
                      الصورة {index + 1}: {url}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Properties */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>العقارات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">{property.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(property.created_at).toLocaleString('ar')}
                    </p>
                    <p className="text-xs mb-2">
                      صور: {property.images?.length || 0}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      عرض
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Troubleshooting */}
        {!bucketExists && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                مشكلة في Storage Bucket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Storage bucket غير موجود. يرجى إضافة الكود التالي في قاعدة البيانات:
              </p>
              <code className="block bg-red-100 p-3 rounded text-sm">
                {`INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 5242880, 
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);`}
              </code>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

