import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Eye, EyeOff, Edit, Upload, X, CheckCircle, AlertCircle, Check, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
import { optimizeImage } from "@/utils/imageOptimization";
import { generatePropertyCode } from "@/utils/propertyCodeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMarketLabel, MARKET_OPTIONS, MarketValue, resolveMarketValue } from "@/constants/markets";

interface PropertyForm {
  title: string;
  price: number;
  location: string;
  description: string;
  type: 'apartment' | 'house' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  ownership_type: 'sale' | 'rent';
  is_published: boolean;
  property_code?: string;
  market: MarketValue | "";
}

export const EditProperty = () => {
  const { user } = useAuth();
  const { userStatus } = useUserStatus();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<PropertyForm>({
    title: '',
    price: 0,
    location: '',
    description: '',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    amenities: [],
    ownership_type: 'sale',
    is_published: false,
    property_code: '',
    market: "",
  });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const subscriptionPlan =
    userStatus && "subscription_plan" in userStatus
      ? (userStatus as { subscription_plan?: string }).subscription_plan
      : undefined;
  
  const availableAmenities = [
    'مكيف هواء',
    'مطبخ مجهز',
    'موقف سيارة',
    'بلكونة',
    'تدفئة مركزية',
    'أمان 24/7',
    'مصعد',
    'حديقة',
    'مسبح',
    'صالة رياضية'
  ];

  // Fetch property data
  const fetchProperty = async () => {
    if (!id) return;
    
    try {
      setLoadingProperty(true);
      console.log('Fetching property with ID:', id);
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات العقار",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Property data fetched:', data);
        const rawData = data as Record<string, unknown>;

        const resolvedMarket = resolveMarketValue(
          (rawData["market"] as string | null | undefined) ??
            (rawData["market_name"] as string | null | undefined) ??
            (rawData["market_label"] as string | null | undefined) ??
            (rawData["market_slug"] as string | null | undefined) ??
            (rawData["location"] as string | null | undefined)
        );

        const listingTypeRaw = rawData["ownership_type"];
        const listingType = listingTypeRaw === 'rent' ? 'rent' : 'sale';

        const propertyTypeRaw = rawData["type"] ?? rawData["property_type"];
        const propertyType =
          propertyTypeRaw === 'house' || propertyTypeRaw === 'commercial'
            ? (propertyTypeRaw as PropertyForm["type"])
            : 'apartment';

        setProperty({
          title: (rawData["title"] as string) || '',
          price: typeof rawData["price"] === 'number' ? (rawData["price"] as number) : 0,
          location: (rawData["location"] as string) || '',
          description: (rawData["description"] as string) || '',
          type: propertyType,
          bedrooms: typeof rawData["bedrooms"] === 'number' ? (rawData["bedrooms"] as number) : 1,
          bathrooms: typeof rawData["bathrooms"] === 'number' ? (rawData["bathrooms"] as number) : 1,
          area: typeof rawData["area"] === 'number' ? (rawData["area"] as number) : 0,
          amenities: (rawData["amenities"] as string[]) || [],
          ownership_type: listingType,
          is_published: Boolean(rawData["is_published"]),
          property_code: (rawData["property_code"] as string) || '',
          market: resolvedMarket ?? '',
        });

        const images = (rawData["images"] as string[] | undefined) ?? [];
        if (images.length > 0) {
          setExistingImages(images);
        }
      }
    } catch (error) {
      console.error('Error in fetchProperty:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات العقار",
        variant: "destructive",
      });
    } finally {
      setLoadingProperty(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 5 - existingImages.length - imageFiles.length);
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
  };

  // Toggle amenity
  const toggleAmenity = (amenity: string) => {
    setProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!property.title || !property.location || !property.market || property.price <= 0 || property.area <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة بما في ذلك السوق الأقرب",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const uploadedImageUrls: string[] = [];
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        setIsUploading(true);
        
        for (const file of imageFiles) {
          try {
            const optimizedFile = await optimizeImage(file);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, optimizedFile);

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);
              
            uploadedImageUrls.push(publicUrl);
          } catch (error) {
            console.error('Error uploading image:', error);
            toast({
              title: "خطأ في رفع الصورة",
              description: "فشل في رفع إحدى الصور",
              variant: "destructive",
            });
          }
        }
        setIsUploading(false);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImageUrls];

      // Update property
      const marketLabel = property.market ? getMarketLabel(property.market) : null;
      const locationText = property.location?.trim().length
        ? property.location
        : marketLabel
          ? `قرب ${marketLabel}`
          : "";

      const { error } = await supabase
        .from('properties')
        .update({
          title: property.title,
          description: property.description,
          price: property.price,
          location: locationText,
          type: property.type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          amenities: property.amenities,
          ownership_type: property.ownership_type,
          is_published: property.is_published,
          images: allImages,
          market: property.market || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating property:', error);
        throw error;
      }

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث العقار بنجاح",
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث العقار",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل بيانات العقار...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-lg border border-blue-100">
            <Edit className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">تعديل العقار</h1>
          </div>
          
          {userStatus && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {subscriptionPlan === 'premium' ? 'عضوية مميزة' : 'عضوية أساسية'}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl font-bold">معلومات العقار</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">المعلومات الأساسية</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700 font-medium">عنوان العقار *</Label>
                  <Input
                    id="title"
                    value={property.title}
                    onChange={(e) => setProperty(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: شقة فاخرة في وسط المدينة"
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700 font-medium">الموقع *</Label>
                  <Input
                    id="location"
                    value={property.location}
                    onChange={(e) => setProperty(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="مثال: الرياض، حي النرجس"
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">السوق القريب *</Label>
                  <Select
                    value={property.market || undefined}
                    onValueChange={(value) => {
                      const newMarket = value as MarketValue;
                      setProperty((prev) => {
                        const marketLabel = newMarket ? getMarketLabel(newMarket) : null;
                        const locationText = prev.location?.trim().length
                          ? prev.location
                          : marketLabel
                            ? `قرب ${marketLabel}`
                            : "";
                        return { ...prev, market: newMarket, location: locationText };
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السوق الأقرب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        اختر السوق الأقرب
                      </SelectItem>
                      {MARKET_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between gap-3">
                            <span>{option.label}</span>
                            {option.icon && <span className="text-xl">{option.icon}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {property.market && (
                    <div className="mt-3 rounded-lg border border-teal-200 bg-white/70 px-3 py-2 text-teal-800">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Store className="h-4 w-4" />
                        {MARKET_OPTIONS.find((option) => option.value === property.market)?.icon && (
                          <span className="text-base" aria-hidden="true">
                            {MARKET_OPTIONS.find((option) => option.value === property.market)?.icon}
                          </span>
                        )}
                        <span>{getMarketLabel(property.market)}</span>
                      </div>
                      <p className="mt-1 text-xs text-teal-700/80">
                        سيتم حفظ هذا السوق كما هو في قاعدة البيانات وربطه بفلترة العقارات.
                      </p>
                    </div>
                  )}
                  {!property.market && (
                    <p className="mt-3 text-xs text-teal-700/80">
                      اختر السوق الأقرب لضمان ربط العقار بشكل صحيح مع قاعدة البيانات.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">وصف العقار</Label>
                <Textarea
                  id="description"
                  value={property.description}
                  onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="اكتب وصفاً مفصلاً عن العقار..."
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Property Type Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">نوع العقار</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'apartment', label: 'شقة', icon: '🏢' },
                  { value: 'house', label: 'بيت', icon: '🏠' },
                  { value: 'commercial', label: 'محل تجاري', icon: '🏪' }
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={property.type === type.value ? "default" : "outline"}
                    className={`h-20 flex-col gap-2 transition-all duration-200 relative ${
                      property.type === type.value 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                    onClick={() => setProperty(prev => ({ ...prev, type: type.value as 'apartment' | 'house' | 'commercial' }))}
                  >
                    {property.type === type.value && <Check className="h-4 w-4 absolute top-2 right-2" />}
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Ownership Type Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">نوع العرض</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'sale', label: 'للبيع', icon: '💰' },
                  { value: 'rent', label: 'للإيجار', icon: '🔑' }
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={property.ownership_type === type.value ? "default" : "outline"}
                    className={`h-20 flex-col gap-2 transition-all duration-200 relative ${
                      property.ownership_type === type.value 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                    onClick={() => setProperty(prev => ({ ...prev, ownership_type: type.value as 'sale' | 'rent' }))}
                  >
                    {property.ownership_type === type.value && <Check className="h-4 w-4 absolute top-2 right-2" />}
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Property Details Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">تفاصيل العقار</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-700 font-medium">
                    السعر ({property.ownership_type === 'rent' ? 'ريال/شهرياً' : 'ريال'}) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={property.price}
                    onChange={(e) => setProperty(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-gray-700 font-medium">المساحة (متر مربع) *</Label>
                  <Input
                    id="area"
                    type="number"
                    value={property.area}
                    onChange={(e) => setProperty(prev => ({ ...prev, area: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">عدد غرف النوم</Label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={property.bedrooms === num ? "default" : "outline"}
                      className={`h-12 transition-all duration-200 relative ${
                        property.bedrooms === num 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                      onClick={() => setProperty(prev => ({ ...prev, bedrooms: num }))}
                    >
                      {property.bedrooms === num && <Check className="h-4 w-4 absolute top-1 right-1" />}
                      {num} غرف
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">عدد دورات المياه</Label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={property.bathrooms === num ? "default" : "outline"}
                      className={`h-12 transition-all duration-200 relative ${
                        property.bathrooms === num 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                      onClick={() => setProperty(prev => ({ ...prev, bathrooms: num }))}
                    >
                      {property.bathrooms === num && <Check className="h-4 w-4 absolute top-1 right-1" />}
                      {num} دورات
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">المرافق والخدمات</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-teal-500 to-green-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map((amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant={property.amenities.includes(amenity) ? "default" : "outline"}
                    className={`h-12 text-sm transition-all duration-200 relative ${
                      property.amenities.includes(amenity)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {property.amenities.includes(amenity) && <Check className="h-4 w-4 absolute top-1 right-1" />}
                    {amenity}
                  </Button>
                ))}
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">صور العقار</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mx-auto"></div>
              </div>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">الصور الحالية</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExistingImage(imageUrl)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              {(existingImages.length + imageFiles.length) < 5 && (
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">إضافة صور جديدة</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div className="text-gray-600">
                        <p className="font-medium">اضغط لاختيار الصور</p>
                        <p className="text-sm">يمكنك رفع حتى {5 - existingImages.length - imageFiles.length} صور إضافية</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">معاينة الصور الجديدة</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`معاينة ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Publication Settings Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات النشر</h3>
                <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mx-auto"></div>
              </div>
              
              <Card className="border-2 border-gray-200 bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-800 font-medium flex items-center gap-2">
                        {property.is_published ? (
                          <Eye className="h-5 w-5 text-green-600" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-red-600" />
                        )}
                        حالة النشر
                      </Label>
                      <p className="text-sm text-gray-600">
                        {property.is_published 
                          ? "العقار مرئي للعملاء ويظهر في نتائج البحث" 
                          : "العقار غير مرئي للعملاء ولن يظهر في نتائج البحث"
                        }
                      </p>
                    </div>
                    <Switch
                      checked={property.is_published}
                      onCheckedChange={(checked) => setProperty(prev => ({ ...prev, is_published: checked }))}
                    />
                  </div>
                  
                  {property.is_published && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">العقار منشور ومرئي للعملاء</span>
                      </div>
                    </div>
                  )}
                  
                  {!property.is_published && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">العقار غير منشور - لن يظهر للعملاء</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Property Code Display */}
            {property.property_code && (
              <div className="text-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
                  رمز العقار: {property.property_code}
                </Badge>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="flex-1 h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isUploading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isUploading ? 'جاري رفع الصور...' : 'جاري التحديث...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    تحديث العقار
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
