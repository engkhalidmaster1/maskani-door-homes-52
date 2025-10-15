import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_OPTIONS, resolveMarketValue } from "@/constants/markets";

const initialFormData = {
  title: "",
  property_type: "apartment", 
  listing_type: "",
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
};

export const useAddPropertyForm = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { uploadOptimizedImages } = useOptimizedImageUpload();
  const { logPropertyAction } = useAuditLog();
  const navigate = useNavigate();
  const { userStatus, canAddProperty, getRemainingProperties } = useUserStatus();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [showFurnishedField, setShowFurnishedField] = useState(false);

  // Computed values
  const selectedMarketOption = useMemo(() => {
    const resolvedMarket = resolveMarketValue(formData.market);
    return resolvedMarket
      ? MARKET_OPTIONS.find((option) => option.value === resolvedMarket) ?? null
      : null;
  }, [formData.market]);

  const locationPreview = useMemo(() => {
    if (!selectedMarketOption) return "";
    const segments = [
      formData.building ? `العمارة ${formData.building}` : null,
      formData.floor ? `الطابق ${formData.floor}` : null,
      `قرب ${selectedMarketOption.label}`,
    ].filter((segment): segment is string => Boolean(segment));
    return segments.join(" - ");
  }, [formData.building, formData.floor, selectedMarketOption]);

  const addressPreview = useMemo(() => {
    if (!selectedMarketOption) return "";
    const segments = [
      formData.apartment ? `شقة ${formData.apartment}` : null,
      formData.building ? `العمارة ${formData.building}` : null,
      formData.floor ? `الطابق ${formData.floor}` : null,
      `قرب ${selectedMarketOption.label}`,
    ].filter((segment): segment is string => Boolean(segment));
    return segments.join("، ");
  }, [formData.apartment, formData.building, formData.floor, selectedMarketOption]);

  // Handlers
  const handleFormChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      listing_type: value,
      furnished: value === "rent" ? prev.furnished : ""
    }));
    setShowFurnishedField(value === "rent");
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location
    }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: `${file.name} ليس ملف صورة صالح`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
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

    setSelectedImages(prev => [...prev, ...validFiles]);

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
  }, [selectedImages.length, userStatus?.images_limit, toast]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setShowFurnishedField(false);
  }, []);

  const uploadImages = useCallback(async (): Promise<string[]> => {
    if (selectedImages.length === 0) {
      throw new Error('يجب إضافة صورة واحدة على الأقل للعقار');
    }
    
    try {
      console.log(`🔄 بدء رفع ${selectedImages.length} صورة...`);
      const uploadedUrls = await uploadOptimizedImages(selectedImages, 'property-images');
      
      // التأكد من أن جميع الصور تم رفعها بنجاح
      if (!uploadedUrls || uploadedUrls.length === 0) {
        console.error('❌ فشل رفع جميع الصور');
        throw new Error('فشل رفع الصور. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى');
      }
      
      // تحذير إذا تم رفع بعض الصور فقط (لكن نستمر)
      if (uploadedUrls.length < selectedImages.length) {
        const failedCount = selectedImages.length - uploadedUrls.length;
        console.warn(`⚠️ تحذير: تم رفع ${uploadedUrls.length} من ${selectedImages.length} صورة (فشل ${failedCount})`);
        toast({
          title: "تحذير",
          description: `تم رفع ${uploadedUrls.length} من ${selectedImages.length} صورة فقط`,
          variant: "default",
        });
      } else {
        console.log(`✅ تم رفع جميع الصور بنجاح (${uploadedUrls.length})`);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل رفع الصور. يرجى المحاولة مرة أخرى';
      throw new Error(errorMessage);
    }
  }, [selectedImages, uploadOptimizedImages, toast]);

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

    // التحقق من الحقول المطلوبة
    const requiredFields = [
      { field: formData.title, name: "عنوان العقار" },
      { field: formData.property_type, name: "نوع العقار" },
      { field: formData.listing_type, name: "نوع العرض" },
      { field: formData.building, name: "رقم العمارة" },
      { field: formData.apartment, name: "رقم الشقة" },
      { field: formData.price, name: "السعر" },
      { field: formData.bedrooms, name: "غرف النوم" },
    ];

    if (isAdmin) {
      requiredFields.push({ field: formData.market, name: "السوق" });
    }

    const missingFields = requiredFields.filter(item => !item.field || item.field.trim() === "");

    if (missingFields.length > 0) {
      toast({
        title: "حقول مطلوبة مفقودة",
        description: `يرجى ملء: ${missingFields.map(item => item.name).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // التحقق من وجود صور
    if (selectedImages.length === 0) {
      toast({
        title: "يجب إضافة صورة",
        description: "يرجى إضافة صورة واحدة على الأقل للعقار",
        variant: "destructive",
      });
      return;
    }

    if (!canAddProperty()) {
      toast({
        title: "تجاوز حد العقارات المسموح",
        description: `لقد وصلت إلى الحد الأقصى للعقارات المسموحة (${userStatus?.properties_limit}).`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const uploadedImageUrls = await uploadImages();
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.getTime().toString().slice(-4);
      const propertyCode = `${dateStr}-BR${formData.bedrooms}-${timeStr}`;
      
      // تحديد نوع العقار بالعربي حسب الاختيار
      const propertyTypeArabic = 
        formData.property_type === "apartment" ? "شقة" :
        formData.property_type === "house" ? "بيت" :
        formData.property_type === "commercial" ? "محل تجاري" :
        "عقار";
      
      const title = `${propertyTypeArabic} رقم ${formData.apartment} في العمارة ${formData.building}`;
      
      const marketOption = selectedMarketOption;
      const marketLabel = marketOption?.label || null;

      const locationSegments = [
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
        marketLabel ? `قرب ${marketLabel}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const locationText = locationSegments.length > 0 ? locationSegments.join(" - ") : null;

      const derivedAddressSegments = [
        formData.apartment ? `${propertyTypeArabic} ${formData.apartment}` : null,
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
        marketLabel ? `قرب ${marketLabel}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const defaultAddress = derivedAddressSegments.length > 0 ? derivedAddressSegments.join("، ") : null;
      const addressText = formData.address && formData.address.trim().length > 0
        ? formData.address.trim()
        : defaultAddress;

      const priceValue = parseFloat(formData.price);
      const areaValue = formData.area ? parseFloat(formData.area) : null;
      const bedroomsValue = parseInt(formData.bedrooms);

      const propertyData = {
        user_id: user.id,
        property_code: propertyCode,
        title,
        description: formData.description?.trim() ? formData.description.trim() : null,
        property_type: formData.property_type,
        listing_type: formData.listing_type as "sale" | "rent",
        price: priceValue,
        area: areaValue,
        bedrooms: bedroomsValue,
        bathrooms: 1,
        market: marketOption?.value || null,
        location: locationText,
        address: addressText,
        amenities: formData.furnished ? [formData.furnished === "yes" ? "مؤثثة" : "غير مؤثثة"] : [],
        images: uploadedImageUrls,
        is_published: true,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const { error } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (error) {
        throw new Error(`خطأ في حفظ العقار: ${error.message}`);
      }

      await logPropertyAction('create', propertyCode, {
        title,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: priceValue,
        bedrooms: bedroomsValue,
        market: marketOption?.value || null,
        images_count: uploadedImageUrls.length,
        location: locationText
      });
      
      toast({
        title: "تم نشر العقار بنجاح!",
        description: `تم إضافة العقار "${title}" مع ${uploadedImageUrls.length} صورة`,
      });

      resetForm();
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
  }, [
    user, 
    formData, 
    canAddProperty, 
    navigate, 
    uploadImages, 
    userStatus?.properties_limit,
    toast, 
    isAdmin, 
    logPropertyAction,
    selectedMarketOption,
    resetForm,
    selectedImages.length
  ]);

  return {
    // State
    formData,
    selectedImages,
    imagePreviewUrls,
    isLoading,
    showFurnishedField,
    
    // Computed values
    selectedMarketOption,
    locationPreview,
    addressPreview,
    
    // Handlers
    handleFormChange,
    handleTypeChange,
    handleLocationSelect,
    handleImageChange,
    removeImage,
    resetForm,
    handleSubmit,
    
    // External data
    user,
    isAdmin,
    userStatus,
    canAddProperty,
    getRemainingProperties,
  };
};