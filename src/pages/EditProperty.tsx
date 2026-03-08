import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { usePropertyPermissions } from "@/hooks/usePropertyPermissions";
import { useAuditLog } from "@/hooks/useAuditLog";
import { PropertyPermissionGuard } from "@/components/ProtectedPropertyAction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Edit, Save, Upload, X, CheckCircle, AlertCircle, Check, Store, Building, Home, Layers, Tag, PlusCircle, Lock, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { useUserStatus } from "@/hooks/useUserStatus";
import { optimizeImage } from "@/utils/imageOptimization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMarketLabel, MARKET_OPTIONS, MarketValue, resolveMarketValue, MarketOption } from "@/constants/markets";

// Helpers: استخراج قيم رقم العمارة/الشقة/الطابق من النصوص العربية
function extractPropertyDetailsFromText(text: string) {
  const result: { building?: string; apartment?: string; floor?: string } = {};

  // العمارة: "العمارة 12" أو "عمارة 12"
  const buildingMatch = text.match(/(?:ال)?عمارة\s*(\d+)/);
  if (buildingMatch) {
    result.building = buildingMatch[1];
  }

  // الشقة: "شقة رقم 12" أو "رقم الشقة 12"
  const apartmentMatch = text.match(/(?:شقة\s*رقم|رقم\s*الشقة)\s*(\d+)/);
  if (apartmentMatch) {
    result.apartment = apartmentMatch[1];
  }

  // الطابق: كلمات شائعة
  if (/الأرضي/.test(text)) result.floor = "الأرضي";
  else if (/الطابق\s*الأول|الدور\s*الأول/.test(text)) result.floor = "الطابق الأول";
  else if (/الطابق\s*الثاني|الدور\s*الثاني/.test(text)) result.floor = "الطابق الثاني";
  else if (/الطابق\s*الثالث|الدور\s*الثالث/.test(text)) result.floor = "الطابق الثالث";

  return result;
}

function updateAddressWithStructure(base: string, building?: string, apartment?: string, floor?: string) {
  let address = base || "";

  // أضف/حدّث العمارة
  if (building && !/(?:ال)?عمارة\s*\d+/.test(address)) {
    address = address ? `${address} - العمارة ${building}` : `العمارة ${building}`;
  }

  // أضف/حدّث الشقة
  if (apartment && !/(?:شقة\s*رقم|رقم\s*الشقة)\s*\d+/.test(address)) {
    address = address ? `${address} - شقة رقم ${apartment}` : `شقة رقم ${apartment}`;
  }

  // أضف/حدّث الطابق
  if (floor && !/(الأرضي|الطابق\s*الأول|الطابق\s*الثاني|الطابق\s*الثالث|الدور\s*الأول|الدور\s*الثاني|الدور\s*الثالث)/.test(address)) {
    address = address ? `${address} - ${floor}` : `${floor}`;
  }

  return address;
}

// This interface should now mirror the structure of AddProperty's formData
interface PropertyForm {
  title: string;
  property_type: 'apartment' | 'house' | 'commercial';
  listing_type: 'sale' | 'rent' | '';
  building: string;
  apartment: string;
  floor: string;
  market: MarketValue | '';
  furnished: 'yes' | 'no' | '';
  price: number;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  is_published: boolean;
  status: 'available' | 'sold' | 'rented';
  property_code?: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export const EditProperty = () => {
  const { user, isAdmin } = useAuth();
  const { userStatus } = useUserStatus();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logPropertyAction } = useAuditLog();
  const { canEdit, isLoading: permissionsLoading, isOwner } = usePropertyPermissions(id || '');

  const [property, setProperty] = useState<PropertyForm>({
    title: "",
    property_type: "apartment",
    listing_type: "",
    building: "",
    apartment: "",
    floor: "",
    market: "",
    furnished: "",
    price: 0,
    description: "",
    bedrooms: 2,
    bathrooms: 1,
    area: 0,
    is_published: false,
    status: 'available',
    property_code: '',
    location: '',
    address: '',
    latitude: null,
    longitude: null,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);

  const selectedMarketOption = useMemo(() => {
    const resolvedMarket = resolveMarketValue(property.market);
    return resolvedMarket
      ? MARKET_OPTIONS.find((option) => option.value === resolvedMarket) ?? null
      : null;
  }, [property.market]);

  // Fetch property data
  const fetchProperty = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingProperty(true);
      console.log('Fetching property with ID:', id);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(`فشل في تحميل بيانات العقار: ${error.message}`);

      if (data) {
        const rawData = data as Record<string, unknown>;

        const resolvedMarket = resolveMarketValue(
          (rawData.market || rawData.market_name || rawData.market_label || rawData.market_slug || rawData.location) as string
        );

        // حاول استخراج تفاصيل إضافية إذا الحقول فارغة في الجدول
        const extractedFromTitle = extractPropertyDetailsFromText(String(rawData.title || ''));
        const extractedFromAddress = extractPropertyDetailsFromText(String(rawData.address || ''));
        const extractedFromDescription = extractPropertyDetailsFromText(String(rawData.description || ''));
        const extracted = {
          building: (rawData.building as string) || extractedFromAddress.building || extractedFromTitle.building || extractedFromDescription.building || "",
          apartment: (rawData.apartment as string) || extractedFromAddress.apartment || extractedFromTitle.apartment || extractedFromDescription.apartment || "",
          floor: (rawData.floor as string) || extractedFromAddress.floor || extractedFromTitle.floor || extractedFromDescription.floor || "",
        };

        setProperty({
          title: (rawData.title as string) || "",
          property_type: ['apartment', 'house', 'commercial'].includes(rawData.property_type as string) ? (rawData.property_type as 'apartment' | 'house' | 'commercial') : 'apartment',
          listing_type: ['sale', 'rent'].includes(rawData.listing_type as string) ? (rawData.listing_type as 'sale' | 'rent') : '',
          building: extracted.building,
          apartment: extracted.apartment,
          floor: extracted.floor,
          market: resolvedMarket ?? '',
          furnished: ['yes', 'no'].includes(rawData.furnished as string) ? (rawData.furnished as 'yes' | 'no') : (Array.isArray(rawData.amenities) && rawData.amenities.includes('مؤثثة') ? 'yes' : (Array.isArray(rawData.amenities) && rawData.amenities.includes('غير مؤثثة') ? 'no' : '')),
          price: Number(rawData.price) || 0,
          description: (rawData.description as string) || "",
          bedrooms: Number(rawData.bedrooms) || 2,
          bathrooms: Number(rawData.bathrooms) || 1,
          area: Number(rawData.area) || 0,
          is_published: Boolean(rawData.is_published),
          status: ['available', 'sold', 'rented'].includes(rawData.status as string) ? (rawData.status as 'available' | 'sold' | 'rented') : 'available',
          property_code: (rawData.property_code as string) || '',
          location: (rawData.location as string) || '',
          address: (rawData.address as string) || '',
          latitude: (rawData.latitude as number) || null,
          longitude: (rawData.longitude as number) || null,
        });

        setExistingImages((rawData.images as string[]) || []);
      }
    } catch (error: unknown) {
      console.error('Error in fetchProperty:', error);
      toast({
        title: "خطأ",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingProperty(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - existingImages.length - imageFiles.length);
    setImageFiles(prev => [...prev, ...newFiles]);

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

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول أو تحديد عقار", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setIsUploading(false);

    // Server-side validation before expensive image uploads
    try {
      const validationPayload = {
        property_type: property.property_type,
        listing_type: property.listing_type,
        price: String(property.price),
        area: property.area ? String(property.area) : null,
        bedrooms: String(property.bedrooms),
        building: property.building && property.building.trim() !== '' ? property.building.trim() : null,
        apartment: property.apartment && property.apartment.trim() !== '' ? property.apartment.trim() : null,
        floor: property.floor && property.floor.trim() !== '' ? property.floor.trim() : null,
        furnished: property.furnished && property.furnished.trim() !== '' ? property.furnished.trim() : null,
      };

      const { data: validationResult, error: validationError } = await supabase.rpc('validate_property_payload', { p_payload: validationPayload });
      if (validationError) {
        console.error('Validation RPC error:', validationError);
        toast({ title: 'خطأ أثناء التحقق من الحقول', description: validationError.message || 'تعذّر التحقق من صحة البيانات', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      type ValidationResponse = { valid: boolean; errors: string[] | null } | null;
      const validationData = validationResult as ValidationResponse;
      const valid = validationData?.valid === true;
      const validationErrors = validationData?.errors ?? [];
      if (!valid) {
        toast({ title: 'التحقق من الخادم فشل', description: validationErrors.length ? validationErrors.join('؛ ') : 'هناك أخطاء في الحقول.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('Unexpected validation error:', err);
      toast({ title: 'خطأ', description: 'فشل التحقق من صحة البيانات قبل الرفع', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    let uploadedImageUrls: string[] = [];
    try {
      if (imageFiles.length > 0) {
        setIsUploading(true);
        const uploadPromises = imageFiles.map(async (file) => {
          const optimizedFile = await optimizeImage(file);
          const { data, error } = await supabase.storage
            .from('property-images')
            .upload(`${user.id}/${Date.now()}-${optimizedFile.name}`, optimizedFile, {
              cacheControl: '3600',
              upsert: false,
            });
          if (error) throw error;
          // The new URL needs to be constructed manually
          const { data: publicUrlData } = supabase.storage.from('property-images').getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        });
        uploadedImageUrls = await Promise.all(uploadPromises);
        setIsUploading(false);
      }

      const finalImageUrls = [...existingImages, ...uploadedImageUrls];

      const amenities: string[] = [];
      if (property.furnished === 'yes') amenities.push('مؤثثة');
      if (property.furnished === 'no') amenities.push('غير مؤثثة');

      // دمج العنوان مع تفاصيل البناء/الشقة/الطابق لضمان ظهورها لاحقاً حتى إن لم تكن أعمدة مخصصة
      const mergedAddress = updateAddressWithStructure(property.address, property.building, property.apartment, property.floor);
      // إذا لم يكن هناك عمود للسوق في الجدول، أدمجه نصياً داخل location
      const marketLabel = property.market ? getMarketLabel(property.market as MarketValue) : null;
      const mergedLocation = marketLabel
        ? ([property.location, `قرب ${marketLabel}`].filter(Boolean).join(' - ')).replace(/\s+-\s+-/g, ' - ')
        : property.location;

      const propertyDataToUpdate = {
        title: property.title,
        property_type: property.property_type,
        listing_type: property.listing_type,
        building: property.building && property.building.trim() !== '' ? property.building.trim() : null,
        apartment: property.apartment && property.apartment.trim() !== '' ? property.apartment.trim() : null,
        floor: property.floor && property.floor.trim() !== '' ? property.floor.trim() : null,
        furnished: property.furnished && property.furnished.trim() !== '' ? property.furnished.trim() : null,
        market: property.market && property.market.trim() !== '' ? property.market.trim() : null,
        price: property.price,
        description: property.description,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        status: property.status,
        location: mergedLocation,
        address: mergedAddress,
        latitude: property.latitude,
        longitude: property.longitude,
        amenities: amenities,
        images: finalImageUrls,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('properties')
        .update(propertyDataToUpdate)
        .eq('id', id);

      if (updateError) throw updateError;

      // تسجيل عملية التحديث في audit log
      await logPropertyAction('update', id, {
        title: property.title,
        property_type: property.property_type,
        changes: Object.keys(propertyDataToUpdate),
        new_images_count: uploadedImageUrls.length,
        total_images: finalImageUrls.length
      });

      toast({
        title: "تم تحديث العقار بنجاح",
        description: "تم حفظ التغييرات على العقار.",
      });
      navigate(`/property/${id}`);
    } catch (error: unknown) {
      console.error('Error updating property:', error);
      toast({
        title: "فشل تحديث العقار",
        description: (error as Error).message || "حدث خطأ أثناء تحديث العقار.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (loadingProperty || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loadingProperty ? 'جاري تحميل بيانات العقار...' : 'جاري التحقق من الصلاحيات...'}
          </p>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">غير مصرح بالتعديل</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {isOwner
                ? 'هذا العقار يخصك ولكن ليس لديك صلاحية للتعديل حالياً'
                : 'هذا العقار لا يخصك، لا يمكنك تعديله'
              }
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/properties')}
                className="w-full"
              >
                العودة للعقارات
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                العودة للصفحة السابقة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
              <Edit className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold">تعديل العقار</h2>
            {property.property_code && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {property.property_code}
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 0: Title and Ownership Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md">
              <Label htmlFor="title" className="flex items-center gap-2 text-sm font-bold mb-4 text-emerald-800">
                <div className="p-2 bg-emerald-500 text-white rounded-lg"><Building className="h-4 w-4" /></div>
                عنوان العقار <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={property.title}
                onChange={(e) => setProperty(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان جذاب للعقار..."
                className="h-12 text-sm border-2 border-emerald-300 bg-white"
                required
              />
            </Card>
          </div>

          {/* Row 1: Property Type and Listing Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
              <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-blue-800">
                <div className="p-2 bg-blue-500 text-white rounded-lg"><Building className="h-4 w-4" /></div>
                نوع العقار <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button type="button" variant={property.property_type === "apartment" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, property_type: "apartment" }))}>🏢 شقة</Button>
                <Button type="button" variant={property.property_type === "house" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, property_type: "house" }))}>🏠 بيت</Button>
                <Button type="button" variant={property.property_type === "commercial" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, property_type: "commercial" }))}>🏪 محل تجاري</Button>
              </div>
            </Card>

            <Card className="p-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md">
              <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-green-800">
                <div className="p-2 bg-green-500 text-white rounded-lg"><Tag className="h-4 w-4" /></div>
                نوع العرض <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={property.listing_type === "sale" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setProperty(prev => ({
                    ...prev,
                    listing_type: "sale",
                    // تغيير الحالة تلقائياً: إذا كانت "تم الإيجار"، غيّرها إلى "متاح"
                    status: prev.status === "rented" ? "available" : prev.status === "sold" ? "sold" : "available"
                  }))}
                >
                  💰 للبيع
                </Button>
                <Button
                  type="button"
                  variant={property.listing_type === "rent" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setProperty(prev => ({
                    ...prev,
                    listing_type: "rent",
                    // تغيير الحالة تلقائياً: إذا كانت "تم البيع"، غيّرها إلى "متاح"
                    status: prev.status === "sold" ? "available" : prev.status === "rented" ? "rented" : "available"
                  }))}
                >
                  🏠 للإيجار
                </Button>
              </div>
            </Card>

            {/* حالة الصفقة - يظهر فقط لصاحب العقار أو الأدمن */}
            {(isOwner || isAdmin) && (
              <Card className="p-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-blue-800">
                  <div className="p-2 bg-blue-500 text-white rounded-lg"><Activity className="h-4 w-4" /></div>
                  حالة الصفقة
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={property.status === "available" ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => setProperty(prev => ({ ...prev, status: "available" }))}
                  >
                    ✅ متاح
                  </Button>
                  {property.listing_type === "sale" && (
                    <Button
                      type="button"
                      variant={property.status === "sold" ? "default" : "outline"}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => setProperty(prev => ({ ...prev, status: "sold" }))}
                    >
                      🔴 تم البيع
                    </Button>
                  )}
                  {property.listing_type === "rent" && (
                    <Button
                      type="button"
                      variant={property.status === "rented" ? "default" : "outline"}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => setProperty(prev => ({ ...prev, status: "rented" }))}
                    >
                      � تم الإيجار
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Row 2: Area, Building, Apartment */}
          <div className={`grid grid-cols-1 ${property.property_type === 'apartment' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
            <Card className="p-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">
              <Label htmlFor="area" className="flex items-center gap-2 text-sm font-bold mb-3 text-purple-800">
                <div className="p-2 bg-purple-500 text-white rounded-lg"><Building className="h-4 w-4" /></div>
                المساحة (م²) <span className="text-red-500">*</span>
              </Label>
              <Input id="area" type="number" value={property.area} onChange={(e) => setProperty(prev => ({ ...prev, area: Number(e.target.value) }))} required />
            </Card>
            {property.property_type === 'apartment' && (
              <>
                <Card className="p-4 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                  <Label htmlFor="building" className="flex items-center gap-2 text-sm font-bold mb-3 text-orange-800">
                    <div className="p-2 bg-orange-500 text-white rounded-lg"><Building className="h-4 w-4" /></div>
                    رقم العمارة
                  </Label>
                  <Input id="building" value={property.building} onChange={(e) => setProperty(prev => ({ ...prev, building: e.target.value }))} />
                </Card>
                <Card className="p-4 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md">
                  <Label htmlFor="apartment" className="flex items-center gap-2 text-sm font-bold mb-3 text-indigo-800">
                    <div className="p-2 bg-indigo-500 text-white rounded-lg"><Home className="h-4 w-4" /></div>
                    رقم الشقة
                  </Label>
                  <Input id="apartment" value={property.apartment} onChange={(e) => setProperty(prev => ({ ...prev, apartment: e.target.value }))} />
                </Card>
              </>
            )}
          </div>

          {/* Row 3: Floor */}
          {property.property_type === 'apartment' && (
            <Card className="p-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-md">
              <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-red-800">
                <div className="p-2 bg-red-500 text-white rounded-lg"><Layers className="h-4 w-4" /></div>
                اختيار الطابق <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button type="button" variant={property.floor === "الأرضي" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, floor: "الأرضي" }))}>🏢 الأرضي</Button>
                <Button type="button" variant={property.floor === "الطابق الأول" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, floor: "الطابق الأول" }))}>1️⃣ الأول</Button>
                <Button type="button" variant={property.floor === "الطابق الثاني" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, floor: "الطابق الثاني" }))}>2️⃣ الثاني</Button>
                <Button type="button" variant={property.floor === "الطابق الثالث" ? "default" : "outline"} onClick={() => setProperty(prev => ({ ...prev, floor: "الطابق الثالث" }))}>3️⃣ الثالث</Button>
              </div>
            </Card>
          )}

          {/* Row 4: Market, Price, Bedrooms */}
          <div className={`grid grid-cols-1 ${isAdmin && property.property_type !== 'commercial' ? 'lg:grid-cols-3' : isAdmin || property.property_type !== 'commercial' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4`}>
            {isAdmin && (
              <Card className="p-4 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 shadow-md">
                <Label htmlFor="market" className="flex items-center gap-2 text-sm font-bold mb-3 text-teal-800">
                  <div className="p-2 bg-teal-500 text-white rounded-lg"><Store className="h-4 w-4" /></div>
                  قرب أي سوق <span className="text-red-500">*</span>
                </Label>
                <Select value={property.market} onValueChange={(value) => setProperty(prev => ({ ...prev, market: value as MarketValue }))} required>
                  <SelectTrigger><SelectValue placeholder="اختر السوق" /></SelectTrigger>
                  <SelectContent>
                    {MARKET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.icon ? `${option.icon} ` : ""}{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}
            <Card className="p-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-md">
              <Label htmlFor="price" className="flex items-center gap-2 text-sm font-bold mb-3 text-yellow-800">
                <div className="p-2 bg-yellow-500 text-white rounded-lg"><Tag className="h-4 w-4" /></div>
                السعر ({property.listing_type === 'rent' ? 'شهري' : 'إجمالي'}) <span className="text-red-500">*</span>
              </Label>
              <Input id="price" type="number" value={property.price} onChange={(e) => setProperty(prev => ({ ...prev, price: Number(e.target.value) }))} required />
            </Card>
            {property.property_type !== 'commercial' && (
              <Card className="p-4 border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-md">
                <Label htmlFor="bedrooms" className="flex items-center gap-2 text-sm font-bold mb-3 text-cyan-800">
                  <div className="p-2 bg-cyan-500 text-white rounded-lg"><Home className="h-4 w-4" /></div>
                  عدد غرف النوم <span className="text-red-500">*</span>
                </Label>
                <Input id="bedrooms" type="number" value={property.bedrooms} onChange={(e) => setProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))} required />
              </Card>
            )}
            {property.property_type !== 'commercial' && (
              <Card className="p-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                <Label htmlFor="bathrooms" className="flex items-center gap-2 text-sm font-bold mb-3 text-blue-800">
                  <div className="p-2 bg-blue-500 text-white rounded-lg">🚿</div>
                  عدد الحمامات <span className="text-red-500">*</span>
                </Label>
                <Input id="bathrooms" type="number" value={property.bathrooms} onChange={(e) => setProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))} min={1} required />
              </Card>
            )}
          </div>

          {/* Furnished option for rent */}
          {property.listing_type === 'rent' && (
            <Card className="p-6 border-2 border-lime-200 bg-gradient-to-br from-lime-50 to-lime-100 shadow-md">
              <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-lime-800">
                <div className="p-2 bg-lime-500 text-white rounded-lg"><Check className="h-4 w-4" /></div>
                هل العقار مؤثث؟
              </Label>
              <div className="flex gap-3">
                <Button type="button" variant={property.furnished === 'yes' ? 'default' : 'outline'} className="flex-1" onClick={() => setProperty(prev => ({ ...prev, furnished: 'yes' }))}>نعم, مؤثث</Button>
                <Button type="button" variant={property.furnished === 'no' ? 'default' : 'outline'} className="flex-1" onClick={() => setProperty(prev => ({ ...prev, furnished: 'no' }))}>لا, غير مؤثث</Button>
              </div>
            </Card>
          )}

          {/* Description */}
          <Card className="p-6 border-2 border-gray-200 bg-white shadow-md">
            <Label htmlFor="description" className="text-sm font-bold mb-2 text-gray-700">وصف العقار</Label>
            <Textarea id="description" value={property.description} onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))} placeholder="اكتب وصفاً مفصلاً عن العقار..." />
          </Card>

          {/* Images Section */}
          <Card className="p-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 shadow-md">
            <Label className="flex items-center gap-2 text-sm font-bold mb-4 text-pink-800">
              <div className="p-2 bg-pink-500 text-white rounded-lg"><PlusCircle className="h-4 w-4" /></div>
              صور العقار
            </Label>
            {existingImages.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs font-semibold text-gray-600">الصور الحالية</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <LazyImage src={imageUrl} alt={`صورة ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => removeExistingImage(imageUrl)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(existingImages.length + imageFiles.length) < 5 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">أضف صور جديدة (حتى {5 - existingImages.length - imageFiles.length})</p>
                </label>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs font-semibold text-gray-600">معاينة الصور الجديدة</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <LazyImage src={preview} alt={`معاينة ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => removeNewImage(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Publication Settings */}
          <Card className="p-6 border-2 border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_published" className="flex items-center gap-2 font-medium">
                <CheckCircle className={`h-5 w-5 ${property.is_published ? 'text-green-600' : 'text-gray-400'}`} />
                نشر العقار
              </Label>
              <Switch id="is_published" checked={property.is_published} onCheckedChange={(checked) => setProperty(prev => ({ ...prev, is_published: checked }))} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {property.is_published ? "العقار منشور حالياً ومرئي للجميع." : "العقار غير منشور وسيبقى مخفياً."}
            </p>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Button type="button" onClick={() => navigate(-1)} variant="outline" className="flex-1 h-12">إلغاء</Button>
            <Button type="submit" disabled={isLoading} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {isLoading ? (isUploading ? 'جاري رفع الصور...' : 'جاري التحديث...') : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
