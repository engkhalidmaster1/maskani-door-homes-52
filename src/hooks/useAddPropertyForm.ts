import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
import { supabase } from "@/integrations/supabase/client";
import { isLocationInGovernorate, type GovernorateType } from "@/components/Property/AddProperty/GovernorateSection";

const ALLOWED_LISTING_TYPES = ["sale", "rent"] as const;
const ALLOWED_PROPERTY_TYPES = ["apartment", "house", "commercial"] as const;
const ALLOWED_FURNISHED = ["yes", "no"] as const;
const ALLOWED_GOVERNORATES: GovernorateType[] = ["erbil", "duhok", "sulaymaniyah"];
const normalize = (v: string | null | undefined) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const initialFormData = {
  title: "",
  property_type: "apartment",
  listing_type: "",
  governorate: "",
  building: "",
  apartment: "",
  floor: "",
  furnished: "",
  price: "",
  description: "",
  bedrooms: "2",
  bathrooms: "1",
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

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // قراءة حد الصور من حالة المستخدم مع دعم القيم السلبية كدلالة على عدم وجود حد (-1 => غير محدود)
    const imagesLimitRaw = userStatus?.images_limit;
    const imagesLimit = imagesLimitRaw === undefined || imagesLimitRaw === null ? 2 : imagesLimitRaw;
    const maxImages = imagesLimit < 0 ? Infinity : imagesLimit;
    const currentImagesCount = selectedImages.length;
    const totalAfterAdd = currentImagesCount + files.length;

    if (totalAfterAdd > maxImages) {
      toast({
        title: "تجاوز حد الصور المسموح",
        description: imagesLimit === Infinity
          ? `لا يمكن إضافة صور إضافية.`
          : `يمكنك رفع ${imagesLimit} صور فقط. لديك حالياً ${currentImagesCount} صورة.`,
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
    // إذا لم يتم تحديد صور، أعِد مصفوفة فارغة (الصور اختيارية عند إنشاء العقار)
    if (selectedImages.length === 0) {
      console.log('⚠️ لا توجد صور للرفع، سيتم إنشاء العقار بدون صور');
      return [];
    }

    try {
      console.log(`🔄 بدء رفع ${selectedImages.length} صورة...`);
      // ارفع الصور داخل مجلد خاص بالمستخدم لضمان صلاحيات الحذف/التعديل لاحقاً
      const uploadedUrls = await uploadOptimizedImages(selectedImages, 'property-images', user?.id || '');

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
  }, [selectedImages, uploadOptimizedImages, toast, user?.id]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
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

    const listingType = normalize(formData.listing_type);
    const propertyType = normalize(formData.property_type);
    const governorate = normalize(formData.governorate) as GovernorateType | "";
    let furnishedNormalized = normalize(formData.furnished);

    if (!ALLOWED_LISTING_TYPES.includes(listingType as (typeof ALLOWED_LISTING_TYPES)[number])) {
      toast({ title: "نوع العرض غير صالح", description: "اختر بيع أو إيجار", variant: "destructive" });
      return;
    }
    if (!ALLOWED_PROPERTY_TYPES.includes(propertyType as (typeof ALLOWED_PROPERTY_TYPES)[number])) {
      toast({ title: "نوع العقار غير صالح", description: "اختر شقة، بيت، أو محل تجاري", variant: "destructive" });
      return;
    }
    if (!governorate || !ALLOWED_GOVERNORATES.includes(governorate)) {
      toast({ title: "المحافظة مطلوبة", description: "اختر محافظة صحيحة", variant: "destructive" });
      return;
    }

    const hasValidLat = typeof formData.latitude === "number" && Number.isFinite(formData.latitude);
    const hasValidLng = typeof formData.longitude === "number" && Number.isFinite(formData.longitude);
    if (!hasValidLat || !hasValidLng) {
      toast({ title: "الموقع مطلوب", description: "حدد الموقع على الخريطة", variant: "destructive" });
      return;
    }
    if (!isLocationInGovernorate(formData.latitude as number, formData.longitude as number, governorate)) {
      toast({ title: "الموقع خارج حدود المحافظة", description: "اختر موقعاً داخل المحافظة المحددة", variant: "destructive" });
      return;
    }

    const MAX_PRICE = 9999999999999.99;
    const MAX_AREA = 99999999.99;
    const parsedPrice = parseFloat(formData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || Math.abs(parsedPrice) > MAX_PRICE) {
      toast({ title: "قيمة السعر غير صالحة", description: "أدخل سعراً إيجابياً وصحيحاً", variant: "destructive" });
      return;
    }

    const parsedArea = formData.area ? parseFloat(formData.area) : null;
    if (formData.area && (!Number.isFinite(parsedArea) || parsedArea <= 0 || Math.abs(parsedArea) > MAX_AREA)) {
      toast({ title: "قيمة المساحة غير صالحة", description: "أدخل مساحة إيجابية وصحيحة", variant: "destructive" });
      return;
    }

    const parsedBedrooms = formData.bedrooms ? parseInt(formData.bedrooms, 10) : null;
    if (propertyType !== "commercial" && (!Number.isFinite(parsedBedrooms) || (parsedBedrooms as number) <= 0)) {
      toast({ title: "عدد الغرف غير صالح", description: "أدخل عدداً أكبر من صفر", variant: "destructive" });
      return;
    }

    const parsedFloor = formData.floor ? parseInt(formData.floor, 10) : null;
    if (propertyType === "apartment") {
      if (formData.floor === "" || formData.floor === null || formData.floor === undefined) {
        toast({ title: "الطابق مطلوب", description: "أدخل رقم الطابق للشقق", variant: "destructive" });
        return;
      }
      if (!Number.isFinite(parsedFloor) || (parsedFloor as number) < 0) {
        toast({ title: "رقم الطابق غير صالح", description: "أدخل رقماً 0 أو أكبر", variant: "destructive" });
        return;
      }
    }

    if (listingType === "rent") {
      if (!ALLOWED_FURNISHED.includes(furnishedNormalized as (typeof ALLOWED_FURNISHED)[number])) {
        toast({ title: "حالة الأثاث مطلوبة", description: "اختر مؤثثة أو غير مؤثثة", variant: "destructive" });
        return;
      }
    } else {
      furnishedNormalized = "";
    }

    setIsLoading(true);

    try {

      const uploadedImageUrls = await uploadImages();

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.getTime().toString().slice(-4);
      const propertyCode = `${dateStr}-BR${(parsedBedrooms ?? (formData.bedrooms || "0"))}-${timeStr}`;

      // تحديد نوع العقار بالعربي حسب الاختيار
      // Use user-provided title when available; otherwise derive a reasonable default
      const propertyTypeArabic =
        propertyType === "apartment" ? "شقة" :
          propertyType === "house" ? "بيت" :
            propertyType === "commercial" ? "محل تجاري" :
              "عقار";

      const title = formData.title && formData.title.trim()
        ? formData.title.trim()
        : (() => {
          if (formData.property_type === 'apartment') {
            const apt = formData.apartment ? ` رقم ${formData.apartment}` : '';
            const bld = formData.building ? ` في العمارة ${formData.building}` : '';
            return `${propertyTypeArabic}${apt}${bld}`.trim();
          }
          if (formData.property_type === 'house') {
            // For houses prefer an address or building info
            const addr = formData.address && formData.address.trim() ? formData.address.trim() : null;
            if (addr) return `${propertyTypeArabic} - ${addr}`;
            if (formData.building) return `${propertyTypeArabic} في العمارة ${formData.building}`;
            return `${propertyTypeArabic}`;
          }
          if (formData.property_type === 'commercial') {
            const addr = formData.address && formData.address.trim() ? formData.address.trim() : null;
            return addr ? `${propertyTypeArabic} - ${addr}` : `${propertyTypeArabic}`;
          }
          return `${propertyTypeArabic}`;
        })();

      const locationSegments = [
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const locationText = locationSegments.length > 0 ? locationSegments.join(" - ") : null;

      const derivedAddressSegments = [
        formData.apartment ? `${propertyTypeArabic} ${formData.apartment}` : null,
        formData.building ? `العمارة ${formData.building}` : null,
        formData.floor ? `الطابق ${formData.floor}` : null,
      ].filter((segment): segment is string => Boolean(segment));

      const defaultAddress = derivedAddressSegments.length > 0 ? derivedAddressSegments.join("، ") : null;
      const addressText = formData.address && formData.address.trim().length > 0
        ? formData.address.trim()
        : defaultAddress;

      // numeric values were parsed earlier for validation

      const parsedBathrooms = formData.bathrooms ? parseInt(formData.bathrooms, 10) : null;

      const propertyData = {
        user_id: user.id,
        property_code: propertyCode,
        title,
        description: formData.description?.trim() || null,
        property_type: propertyType,
        listing_type: listingType,
        governorate: governorate,
        price: parsedPrice,
        area: parsedArea,
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        location: locationText,
        address: addressText,
        building: formData.building?.trim() || null,
        apartment: formData.apartment?.trim() || null,
        floor: formData.floor?.trim() || null,
        furnished: furnishedNormalized || null,
        images: uploadedImageUrls,
        is_published: true,
        latitude: formData.latitude,
        longitude: formData.longitude,
      } as const;

      const { error } = await supabase
        .from('properties')
        .insert([propertyData as unknown as typeof propertyData]);

      if (error) {
        const errMsg = error.message || '';
        if (errMsg.includes('لا يمكن تغيير دور المدير العام') || errMsg.includes('Cannot change super admin role')) {
          throw new Error('فشل الحفظ بسبب قيود صلاحيات المدير. يرجى مراجعة صلاحيات الحساب من لوحة الإدارة.');
        }

        throw new Error(`خطأ في حفظ العقار: ${error.message}`);
      }

      await logPropertyAction('create', propertyCode, {
        title,
        property_type: propertyType,
        listing_type: listingType,
        price: parsedPrice,
        bedrooms: parsedBedrooms,
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
    logPropertyAction,
    resetForm,
  ]);

  return {
    // State
    formData,
    selectedImages,
    imagePreviewUrls,
    isLoading,
    showFurnishedField,

    // Computed values


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