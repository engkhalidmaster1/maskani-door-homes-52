import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Building, Home, Layers, Store, Tag, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapPicker } from "@/components/MapPicker";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
// Property code generation now handled by Supabase function
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MARKET_OPTIONS, MarketValue, resolveMarketValue } from "@/constants/markets";

export const AddProperty = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadOptimizedImages, uploadProgress, isUploading } = useOptimizedImageUpload();
  const navigate = useNavigate();
  const { userStatus, canAddProperty, getRemainingProperties } = useUserStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    property_type: "apartment", 
    listing_type: "",
    ownership_type: "",
    building: "",
    apartment: "",
    floor: "",
    market: "",
    furnished: "",
    price: "",
    description: "",
    bedrooms: "2",
    area: "",
    latitude: null as number | null,
    longitude: null as number | null,
    address: "",
    location: "",
  });

  const selectedMarketOption = useMemo(
    () => {
      const resolvedMarket = resolveMarketValue(formData.market);
      return resolvedMarket
        ? MARKET_OPTIONS.find((option) => option.value === resolvedMarket) ?? null
        : null;
    },
    [formData.market]
  );

  const locationPreview = useMemo(() => {
    if (!selectedMarketOption) {
      return "";
    }

    const segments = [
      formData.building ? `العمارة ${formData.building}` : null,
      formData.floor ? `الطابق ${formData.floor}` : null,
      `قرب ${selectedMarketOption.label}`,
    ].filter((segment): segment is string => Boolean(segment));

    return segments.join(" - ");
  }, [formData.building, formData.floor, selectedMarketOption]);

  const addressPreview = useMemo(() => {
    if (!selectedMarketOption) {
      return "";
    }

    const segments = [
      formData.apartment ? `شقة ${formData.apartment}` : null,
      formData.building ? `العمارة ${formData.building}` : null,
      formData.floor ? `الطابق ${formData.floor}` : null,
      `قرب ${selectedMarketOption.label}`,
    ].filter((segment): segment is string => Boolean(segment));

    return segments.join("، ");
  }, [formData.apartment, formData.building, formData.floor, selectedMarketOption]);

  const [showFurnishedField, setShowFurnishedField] = useState(false);

    const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location
    }));
  }, []);

  const handleTypeChange = (value: string) => {
    const newFormData = {
      ...formData,
      listing_type: value,
      furnished: value === "rent" ? formData.furnished : ""
    };
    setFormData(newFormData);
    setShowFurnishedField(value === "rent");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check image limits based on user status
    const maxImages = userStatus?.images_limit || 2;
    const currentImagesCount = selectedImages.length;
    const totalAfterAdd = currentImagesCount + files.length;

    if (totalAfterAdd > maxImages) {
      toast({
        title: "تجاوز حد الصور المسموح",
        description: `يمكنك رفع ${maxImages} صور فقط. لديك حالياً ${currentImagesCount} صورة.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: `${file.name} ليس ملف صورة صالح`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير",
          description: `${file.name} يتجاوز 5 ميجابايت`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Final check after validation
    if (currentImagesCount + validFiles.length > maxImages) {
      const allowedCount = maxImages - currentImagesCount;
      if (allowedCount > 0) {
        const allowedFiles = validFiles.slice(0, allowedCount);
        setSelectedImages(prev => [...prev, ...allowedFiles]);
        
        allowedFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        });

        toast({
          title: "تم إضافة الصور المسموحة",
          description: `تم إضافة ${allowedFiles.length} صورة من أصل ${validFiles.length}`,
          variant: "default",
        });
      }
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast({
      title: "تم إضافة الصور",
      description: `تم إضافة ${validFiles.length} صورة`,
    });
  };

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadImages = useCallback(async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];
    
    try {
      return await uploadOptimizedImages(selectedImages, 'property-images');
    } catch (error) {
      console.error('Error uploading optimized images:', error);
      return [];
    }
  }, [selectedImages, uploadOptimizedImages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    // التحقق من الحقول الإلزامية الأساسية فقط
    const requiredFields = [
      { field: formData.title, name: "عنوان العقار" },
      { field: formData.property_type, name: "نوع العقار" },
      { field: formData.listing_type, name: "نوع العرض" },
      { field: formData.building, name: "رقم العمارة" },
      { field: formData.apartment, name: "رقم الشقة" },
      { field: formData.price, name: "السعر" },
      { field: formData.bedrooms, name: "غرف النوم" },
      { field: formData.market, name: "السوق" },
    ];

    const missingFields = requiredFields.filter(item => !item.field || item.field.trim() === "");

    if (missingFields.length > 0) {
      toast({
        title: "حقول مطلوبة مفقودة",
        description: `يرجى ملء: ${missingFields.map(item => item.name).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const resolvedMarket = resolveMarketValue(formData.market);
    const marketOption = resolvedMarket
      ? MARKET_OPTIONS.find((option) => option.value === resolvedMarket)
      : undefined;

    if (!marketOption) {
      toast({
        title: "سوق غير معروف",
        description: "يرجى اختيار سوق صحيح من القائمة لربط العقار بالموقع المناسب.",
        variant: "destructive",
      });
      return;
    }

    // Check if user can add more properties
    if (!canAddProperty()) {
      toast({
        title: "تجاوز حد العقارات المسموح",
        description: `لقد وصلت إلى الحد الأقصى للعقارات المسموحة (${userStatus?.properties_limit}). اتصل بالإدارة لترقية حسابك.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting property creation...');
      console.log('Form data:', {
        listing_type: formData.listing_type,
        ownership_type: formData.ownership_type,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        price: formData.price,
        market: marketOption.value,
      });
      
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      console.log('Images uploaded:', uploadedImageUrls.length);

      // Generate property code - required field
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.getTime().toString().slice(-4); // last 4 digits of timestamp
      const propertyCode = `${dateStr}-BR${formData.bedrooms}-${timeStr}`;
      
      console.log('Generated property code:', propertyCode);

      // Generate title from building and apartment
      const title = `شقة رقم ${formData.apartment} في العمارة ${formData.building}`;
      
      // Prepare data for insertion (including required property_code and coordinates)
      const marketLabel = marketOption.label;

      const locationSegments = [
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
        marketLabel ? `قرب ${marketLabel}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const locationText = locationSegments.length > 0 ? locationSegments.join(" - ") : null;

      const derivedAddressSegments = [
        formData.apartment ? `شقة ${formData.apartment}` : null,
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
        marketLabel ? `قرب ${marketLabel}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const defaultAddress = derivedAddressSegments.length > 0 ? derivedAddressSegments.join("، ") : null;
      const addressText = formData.address && formData.address.trim().length > 0
        ? formData.address.trim()
        : defaultAddress;

      const propertyData = {
        user_id: user.id,
        title,
        description: formData.description?.trim() ? formData.description.trim() : null,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: 1, // قيمة افتراضية
        market: marketOption.value,
        location: locationText,
        address: addressText,
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: formData.furnished ? [formData.furnished === "yes" ? "مؤثثة" : "غير مؤثثة"] : [],
        images: uploadedImageUrls,
        property_code: propertyCode, // حقل مطلوب
        is_published: true,
      };

      console.log('Inserting property data:', propertyData);
      
      // First, try to insert with all fields
      let { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      // If there's a schema error, try with basic fields only
      if (error && (error.message?.includes('schema cache') || error.message?.includes('property_code'))) {
        console.log('Retrying with basic fields only...');
        const basicPropertyData = {
          user_id: user.id,
          title,
          description: formData.description?.trim() ? formData.description.trim() : null,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          price: parseFloat(formData.price),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: 1,
          market: marketOption.value,
          location: locationText,
          address: addressText,
          latitude: formData.latitude,
          longitude: formData.longitude,
          images: uploadedImageUrls,
          property_code: propertyCode, // إضافة الكود المطلوب
          is_published: true,
        };
        
        const retryResult = await supabase
          .from('properties')
          .insert([basicPropertyData]);
        
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        
        // معالجة أخطاء محددة
        let userMessage = 'خطأ غير محدد';
        if (error.message?.includes('property_code')) {
          userMessage = 'خطأ في إنشاء كود العقار';
        } else if (error.message?.includes('not-null constraint')) {
          userMessage = 'بيانات مطلوبة مفقودة';
        } else if (error.message?.includes('duplicate')) {
          userMessage = 'هذا العقار موجود مسبقاً';
        } else {
          userMessage = error.message || 'خطأ غير محدد';
        }
        
        throw new Error(`خطأ في قاعدة البيانات: ${userMessage}`);
      }

      console.log('Property created successfully');
      
      toast({
        title: "تم نشر العقار بنجاح!",
        description: `تم إضافة العقار "${title}" مع ${uploadedImageUrls.length} صورة`,
      });

      // Reset form data
      setFormData({
        title: "",
        property_type: "apartment", 
        listing_type: "",
        ownership_type: "",
        building: "",
        apartment: "",
        floor: "",
        market: "",
        furnished: "",
        price: "",
        description: "",
        bedrooms: "2",
        area: "",
        latitude: null as number | null,
        longitude: null as number | null,
        address: "",
        location: "",
      });
      
      setSelectedImages([]);
      setImagePreviewUrls([]);
      
      navigate("/properties");
    } catch (error: unknown) {
      console.error('Error adding property:', error);
      toast({
        title: "خطأ في إضافة العقار",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, formData, canAddProperty, navigate, uploadImages, userStatus?.properties_limit, toast]);

  // Memoized values for better performance
  const isFormValid = useMemo(() => {
    return formData.title && formData.property_type && formData.listing_type && 
           formData.building && formData.apartment && formData.price && 
           formData.bedrooms;
  }, [formData]);

  const hasImages = useMemo(() => selectedImages.length > 0, [selectedImages.length]);

  // Show loading or access denied if user status not loaded
  if (!userStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل معلومات حسابك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                <PlusCircle className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold">إضافة عقار جديد</h2>
              <div className="flex items-center gap-3 mr-4">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <span>
                    {userStatus?.status === 'publisher' && '📝 ناشر'}
                    {userStatus?.status === 'trusted_owner' && '🏆 مالك موثوق'}
                    {userStatus?.status === 'office_agent' && '🏢 مكلف بالنشر'}
                  </span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <span>🏠</span>
                  <span className="font-semibold">{getRemainingProperties()}/{userStatus?.properties_limit}</span>
                  <span>عقار</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <span>📸</span>
                  <span className="font-semibold">{userStatus?.images_limit}</span>
                  <span>صور</span>
                </div>
                {!canAddProperty() && (
                  <div className="bg-red-500/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 font-semibold">
                    <span>⚠️</span>
                    <span>تجاوزت الحد</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 0: عنوان العقار ونوع الملكية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* عنوان العقار */}
              <Card className="p-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md hover:shadow-lg transition-all duration-300">
                <Label htmlFor="title" className="flex items-center gap-2 text-sm font-bold mb-4 text-emerald-800">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg">
                    <Building className="h-4 w-4" />
                  </div>
                  عنوان العقار <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان جذاب للعقار..."
                  className="h-12 text-sm border-2 border-emerald-300 bg-white hover:border-emerald-400 focus:border-emerald-500 transition-colors"
                  required
                />
              </Card>

              {/* نوع الملكية */}
              <Card className={`p-6 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                formData.ownership_type ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100'
              }`}>
                <Label className={`flex items-center gap-2 text-sm font-bold mb-4 ${
                  formData.ownership_type ? 'text-gray-600' : 'text-purple-800'
                }`}>
                  <div className={`p-2 text-white rounded-lg ${
                    formData.ownership_type ? 'bg-gray-500' : 'bg-purple-500'
                  }`}>
                    <Building className="h-4 w-4" />
                  </div>
                  نوع الملكية <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={formData.ownership_type === "tamlik" ? "default" : "outline"}
                    className={`flex-1 h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.ownership_type === "tamlik" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, ownership_type: "tamlik" }))}
                  >
                    📜 تمليك {formData.ownership_type === "tamlik" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.ownership_type === "sar_qafliya" ? "default" : "outline"}
                    className={`flex-1 h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.ownership_type === "sar_qafliya" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, ownership_type: "sar_qafliya" }))}
                  >
                    🔑 سر قفلية {formData.ownership_type === "sar_qafliya" && "✓"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Row 1: نوع العقار ونوع العرض */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* نوع العقار */}
              <Card className={`p-4 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                formData.property_type ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'
              }`}>
                <Label className={`flex items-center gap-2 text-sm font-bold mb-4 ${
                  formData.property_type ? 'text-gray-600' : 'text-blue-800'
                }`}>
                  <div className={`p-2 text-white rounded-lg ${
                    formData.property_type ? 'bg-gray-500' : 'bg-blue-500'
                  }`}>
                    <Building className="h-4 w-4" />
                  </div>
                  نوع العقار <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={formData.property_type === "apartment" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.property_type === "apartment" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, property_type: "apartment" }))}
                  >
                    🏢 شقة {formData.property_type === "apartment" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.property_type === "house" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.property_type === "house" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, property_type: "house" }))}
                  >
                    🏠 بيت {formData.property_type === "house" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.property_type === "commercial" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.property_type === "commercial" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, property_type: "commercial" }))}
                  >
                    🏪 محل تجاري {formData.property_type === "commercial" && "✓"}
                  </Button>
                </div>
              </Card>

              {/* نوع العرض - أزرار */}
              <Card className={`p-4 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                formData.listing_type ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100'
              }`}>
                <Label className={`flex items-center gap-2 text-sm font-bold mb-4 ${
                  formData.listing_type ? 'text-gray-600' : 'text-green-800'
                }`}>
                  <div className={`p-2 text-white rounded-lg ${
                    formData.listing_type ? 'bg-gray-500' : 'bg-green-500'
                  }`}>
                    <Tag className="h-4 w-4" />
                  </div>
                  نوع العرض <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={formData.listing_type === "sale" ? "default" : "outline"}
                    className={`flex-1 h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.listing_type === "sale" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => handleTypeChange("sale")}
                  >
                    💰 للبيع {formData.listing_type === "sale" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.listing_type === "rent" ? "default" : "outline"}
                    className={`flex-1 h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.listing_type === "rent" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => handleTypeChange("rent")}
                  >
                    🏠 للإيجار {formData.listing_type === "rent" && "✓"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Row 2: Area, Building, Apartment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* المساحة */}
              <Card className="p-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg transition-all duration-300">
                <Label htmlFor="area" className="flex items-center gap-2 text-sm font-bold mb-3 text-purple-800">
                  <div className="p-2 bg-purple-500 text-white rounded-lg">
                    <Building className="h-4 w-4" />
                  </div>
                  المساحة (م²) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="أدخل المساحة"
                  className="h-12 text-sm border-2 border-purple-300 bg-white hover:border-purple-400 focus:border-purple-500 transition-colors"
                  required
                />
              </Card>

              {/* رقم العمارة */}
              <Card className="p-4 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-all duration-300">
                <Label htmlFor="building" className="flex items-center gap-2 text-sm font-bold mb-3 text-orange-800">
                  <div className="p-2 bg-orange-500 text-white rounded-lg">
                    <Building className="h-4 w-4" />
                  </div>
                  رقم العمارة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                  placeholder="أدخل رقم العمارة"
                  className="h-12 text-sm border-2 border-orange-300 bg-white hover:border-orange-400 focus:border-orange-500 transition-colors"
                  required
                />
              </Card>

              {/* رقم الشقة */}
              <Card className="p-4 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md hover:shadow-lg transition-all duration-300">
                <Label htmlFor="apartment" className="flex items-center gap-2 text-sm font-bold mb-3 text-indigo-800">
                  <div className="p-2 bg-indigo-500 text-white rounded-lg">
                    <Home className="h-4 w-4" />
                  </div>
                  رقم الشقة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apartment"
                  value={formData.apartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                  placeholder="أدخل رقم الشقة"
                  className="h-12 text-sm border-2 border-indigo-300 bg-white hover:border-indigo-400 focus:border-indigo-500 transition-colors"
                  required
                />
              </Card>
            </div>

            {/* Row 3: اختيار الطابق - أزرار */}
            <Card className={`p-6 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
              formData.floor ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100'
            }`}>
              <Label className={`flex items-center gap-2 text-sm font-bold mb-4 ${
                formData.floor ? 'text-gray-600' : 'text-red-800'
              }`}>
                <div className={`p-2 text-white rounded-lg ${
                  formData.floor ? 'bg-gray-500' : 'bg-red-500'
                }`}>
                  <Layers className="h-4 w-4" />
                </div>
                اختيار الطابق <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  type="button"
                  variant={formData.floor === "الأرضي" ? "default" : "outline"}
                  className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                    formData.floor === "الأرضي" 
                      ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                      : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, floor: "الأرضي" }))}
                >
                  🏢 الأرضي {formData.floor === "الأرضي" && "✓"}
                </Button>
                <Button
                  type="button"
                  variant={formData.floor === "الطابق الأول" ? "default" : "outline"}
                  className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                    formData.floor === "الطابق الأول" 
                      ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                      : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, floor: "الطابق الأول" }))}
                >
                  1️⃣ الأول {formData.floor === "الطابق الأول" && "✓"}
                </Button>
                <Button
                  type="button"
                  variant={formData.floor === "الطابق الثاني" ? "default" : "outline"}
                  className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                    formData.floor === "الطابق الثاني" 
                      ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                      : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, floor: "الطابق الثاني" }))}
                >
                  2️⃣ الثاني {formData.floor === "الطابق الثاني" && "✓"}
                </Button>
                <Button
                  type="button"
                  variant={formData.floor === "الطابق الثالث" ? "default" : "outline"}
                  className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                    formData.floor === "الطابق الثالث" 
                      ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                      : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, floor: "الطابق الثالث" }))}
                >
                  3️⃣ الثالث {formData.floor === "الطابق الثالث" && "✓"}
                </Button>
              </div>
            </Card>

            {/* Row 4: Market, Price, Bedrooms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* السوق */}
              <Card className={`p-4 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                formData.market ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100'
              }`}>
                <Label htmlFor="market" className={`flex items-center gap-2 text-sm font-bold mb-3 ${
                  formData.market ? 'text-gray-600' : 'text-teal-800'
                }`}>
                  <div className={`p-2 text-white rounded-lg ${
                    formData.market ? 'bg-gray-500' : 'bg-teal-500'
                  }`}>
                    <Store className="h-4 w-4" />
                  </div>
                  قرب أي سوق <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.market}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, market: value }))}
                  required
                >
                  <SelectTrigger className="h-12 text-sm border-2 border-teal-300 bg-white hover:border-teal-400 focus:border-teal-500 transition-colors">
                    <SelectValue placeholder="اختر السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon ? `${option.icon} ` : ""}{option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMarketOption ? (
                  <div className="mt-3 rounded-lg border border-teal-200 bg-white/70 px-3 py-2 text-teal-800">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Store className="h-4 w-4" />
                      {selectedMarketOption.icon && (
                        <span className="text-base" aria-hidden="true">{selectedMarketOption.icon}</span>
                      )}
                      <span>{selectedMarketOption.label}</span>
                    </div>
                    {locationPreview && (
                      <p className="mt-1 text-xs text-teal-700/80">
                        الموقع الناتج: <span className="font-semibold">{locationPreview}</span>
                      </p>
                    )}
                    {(!formData.address || formData.address.trim().length === 0) && addressPreview && (
                      <p className="mt-1 text-[11px] text-teal-600/80">
                        العنوان المقترح: {addressPreview}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-teal-700/70">
                      سيتم حفظ هذا السوق كما هو في قاعدة البيانات وربطه بفلترة العقارات.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-teal-700/80">
                    اختر السوق الأقرب لضمان ربط العقار بشكل صحيح مع قاعدة البيانات.
                  </p>
                )}
              </Card>

              {/* السعر */}
              <Card className="p-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-md hover:shadow-lg transition-all duration-300">
                <Label htmlFor="price" className="flex items-center gap-2 text-sm font-bold mb-3 text-yellow-800">
                  <div className="p-2 bg-yellow-500 text-white rounded-lg">
                    <Tag className="h-4 w-4" />
                  </div>
                  السعر (دينار عراقي) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="أدخل السعر بالدينار العراقي"
                  className="h-12 text-sm border-2 border-yellow-300 bg-white hover:border-yellow-400 focus:border-yellow-500 transition-colors"
                  required
                />
              </Card>

              {/* غرف النوم */}
              <Card className={`p-4 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                formData.bedrooms ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100'
              }`}>
                <Label className={`flex items-center gap-2 text-sm font-bold mb-3 ${
                  formData.bedrooms ? 'text-gray-600' : 'text-pink-800'
                }`}>
                  <div className={`p-2 text-white rounded-lg ${
                    formData.bedrooms ? 'bg-gray-500' : 'bg-pink-500'
                  }`}>
                    <Home className="h-4 w-4" />
                  </div>
                  غرف النوم <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    type="button"
                    variant={formData.bedrooms === "1" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.bedrooms === "1" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, bedrooms: "1" }))}
                  >
                    🛏️ 1 غرفة {formData.bedrooms === "1" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.bedrooms === "2" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.bedrooms === "2" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, bedrooms: "2" }))}
                  >
                    🛏️ 2 غرفة {formData.bedrooms === "2" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.bedrooms === "3" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.bedrooms === "3" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, bedrooms: "3" }))}
                  >
                    🛏️ 3 غرف {formData.bedrooms === "3" && "✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.bedrooms === "4" ? "default" : "outline"}
                    className={`h-12 text-sm font-semibold border-2 transition-all duration-300 ${
                      formData.bedrooms === "4" 
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105" 
                        : "bg-gray-400 hover:bg-gray-500 border-gray-500 hover:border-gray-600 text-white"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, bedrooms: "4" }))}
                  >
                    🛏️ 4 غرف {formData.bedrooms === "4" && "✓"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Row 5: Furnished (conditional) */}
            <div className="grid grid-cols-1 gap-4">
              {showFurnishedField && (
                <Card className={`p-4 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                  formData.furnished ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100'
                }`}>
                  <Label htmlFor="furnished" className={`flex items-center gap-2 text-sm font-bold mb-3 ${
                    formData.furnished ? 'text-gray-600' : 'text-amber-800'
                  }`}>
                    <div className={`p-2 text-white rounded-lg ${
                      formData.furnished ? 'bg-gray-500' : 'bg-amber-500'
                    }`}>
                      <Home className="h-4 w-4" />
                    </div>
                    نوع العقار
                  </Label>
                  <Select
                    value={formData.furnished}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, furnished: value }))}
                    required={showFurnishedField}
                  >
                    <SelectTrigger className="h-12 text-sm border-2 border-amber-300 bg-white hover:border-amber-400 focus:border-amber-500 transition-colors">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">🛋️ مؤثثة</SelectItem>
                      <SelectItem value="no">📦 غير مؤثثة</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>
              )}
            </div>

            {/* Row 6: وصف العقار */}
            <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-all duration-300">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-bold mb-4 text-gray-800">
                <div className="p-2 bg-gray-500 text-white rounded-lg">
                  <Building className="h-4 w-4" />
                </div>
                وصف العقار <span className="text-green-500 text-xs">(اختياري)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أضف وصفاً مفصلاً للعقار..."
                rows={4}
                className="resize-none text-sm border-2 border-gray-300 bg-white hover:border-gray-400 focus:border-gray-500 transition-colors"
              />
            </Card>

            {/* Row 7: موقع العقار على الخريطة */}
            <div className="w-full">
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialPosition={
                  formData.latitude && formData.longitude
                    ? [formData.latitude, formData.longitude]
                    : undefined
                }
                height="500px"
              />
            </div>

            {/* Row 8: صور العقار */}
            <Card className="p-6 border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="images" className="flex items-center gap-2 text-sm font-bold text-rose-800">
                  <div className="p-2 bg-rose-500 text-white rounded-lg">
                    <Camera className="h-4 w-4" />
                  </div>
                  صور العقار <span className="text-green-500 text-xs">(اختياري)</span>
                </Label>
                <span className="text-sm font-semibold text-rose-600 bg-rose-200 px-3 py-1 rounded-full">
                  📸 {selectedImages.length} / {userStatus?.images_limit || 2}
                </span>
              </div>
              
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="h-12 cursor-pointer text-sm border-2 border-rose-300 bg-white hover:border-rose-400 focus:border-rose-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-500 file:text-white hover:file:bg-rose-600"
                disabled={selectedImages.length >= (userStatus?.images_limit || 2)}
              />
              
              {/* Image Previews - Compact */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`معاينة ${index + 1}`}
                        className="w-full h-16 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1 rounded-tl">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Submit Button */}
            <Card className="p-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                disabled={isLoading || !canAddProperty()}
              >
                <PlusCircle className="h-5 w-5 ml-2" />
                {isLoading ? "🔄 جاري النشر..." : !canAddProperty() ? "❌ تجاوزت الحد المسموح" : "🚀 نشر العقار"}
              </Button>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};