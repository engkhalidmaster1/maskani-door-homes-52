import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePropertyPermissions } from "@/hooks/usePropertyPermissions";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ProtectedPropertyAction } from "@/components/ProtectedPropertyAction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import { PropertyStatusBadge } from "@/components/Property/PropertyStatusBadge";
import { PropertyStatusBadgeEnhanced } from "@/components/Property/PropertyStatusBadgeEnhanced";
import { cn, formatCurrency, formatDate, getPropertyTypeLabel } from "@/lib/utils";
import VerifiedBadge from "@/components/VerifiedBadge";
import useVerification from "@/hooks/useVerification";
import { getMarketLabel, resolveMarketValue } from "@/constants/markets";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft,
  Bath,
  Bed,
  CheckCircle2,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Home,
  MapPin,
  Ruler,
  Share2,
  Store,
  Tag
} from "lucide-react";

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: "sale" | "rent";
  price: number;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  location: string | null;
  address: string | null;
  amenities: string[] | null;
  status?: string; // available, sold, rented, under_negotiation
  images: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  property_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  market?: string | null;
  marketLabel?: string | null;
}

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='32'%3ENo Image%3C/text%3E%3C/svg%3E";

export const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { canEdit, canDelete, canView, isLoading: permissionsLoading } = usePropertyPermissions(id || '');
  const { logPropertyAction } = useAuditLog();
  const isMobile = useIsMobile();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<{ name: string | null; phone: string | null; email: string | null } | null>(null);

  const isOwner = useMemo(() => {
    if (!user || !property) return false;
    return user.id === property.user_id;
  }, [user, property]);

  const canManage = isAdmin || isOwner;

  // Determine which user to show badge for (owner vs publisher). Currently both map to property.user_id.
  const badgeTarget = (typeof window !== 'undefined' && window.localStorage?.getItem('verifiedBadgeTarget')) || 'owner';
  const verifiedUserId = property?.user_id; // Future: if publisher differs, map based on badgeTarget
  const { verified: isVerifiedOwner } = useVerification(verifiedUserId || undefined, isAdmin);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching property details:", error);
        setError("تعذر تحميل بيانات هذا العقار. يرجى المحاولة مرة أخرى.");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError("لم يتم العثور على هذا العقار.");
        setIsLoading(false);
        return;
      }

      const rawData = data as Record<string, unknown>;
      const resolvedMarket = resolveMarketValue(
        (rawData["market"] as string | null | undefined) ??
          (rawData["market_name"] as string | null | undefined) ??
          (rawData["market_label"] as string | null | undefined) ??
          (rawData["market_slug"] as string | null | undefined) ??
          (rawData["location"] as string | null | undefined)
      );

      const mappedProperty: Property = {
        id: rawData["id"] as string,
        user_id: rawData["user_id"] as string,
        title: (rawData["title"] as string) ?? "",
        description: (rawData["description"] as string | null) ?? null,
        property_type: (rawData["property_type"] as string) ?? "apartment",
        listing_type: (rawData["listing_type"] as string) === "rent" ? "rent" : "sale",
        price: Number(rawData["price"]) || 0,
        area: rawData["area"] !== null ? Number(rawData["area"]) : null,
        bedrooms: rawData["bedrooms"] !== null ? Number(rawData["bedrooms"]) : 0,
        bathrooms: rawData["bathrooms"] !== null ? Number(rawData["bathrooms"]) : 0,
        location: (rawData["location"] as string | null) ?? null,
        address: (rawData["address"] as string | null) ?? null,
        amenities: (rawData["amenities"] as string[] | null) ?? null,
        images: (rawData["images"] as string[] | null) ?? null,
        is_published: Boolean(rawData["is_published"]),
        created_at: (rawData["created_at"] as string) ?? new Date().toISOString(),
        updated_at: (rawData["updated_at"] as string) ?? new Date().toISOString(),
        property_code: (rawData["property_code"] as string | null) ?? null,
        latitude: rawData["latitude"] !== null ? Number(rawData["latitude"]) : null,
        longitude: rawData["longitude"] !== null ? Number(rawData["longitude"]) : null,
        market: resolvedMarket ?? null,
        marketLabel: resolvedMarket ? getMarketLabel(resolvedMarket) : null,
      };

      setProperty(mappedProperty);
      setActiveImageIndex(0);
      setIsLoading(false);
      // Fetch owner profile details
      try {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('full_name, phone, email')
          .eq('user_id', (rawData["user_id"] as string) ?? '')
          .maybeSingle();
        if (!ownerError && ownerData) {
          setOwnerProfile({
            name: (ownerData as { full_name: string | null }).full_name ?? null,
            phone: (ownerData as { phone: string | null }).phone ?? null,
            email: (ownerData as { email: string | null }).email ?? null,
          });
        } else {
          setOwnerProfile({ name: null, phone: null, email: null });
        }
      } catch (e) {
        setOwnerProfile({ name: null, phone: null, email: null });
      }
      
        // تسجيل عملية عرض العقار
        if (user) {
          await logPropertyAction('view', mappedProperty.id, {
            title: mappedProperty.title,
            property_type: mappedProperty.property_type,
            listing_type: mappedProperty.listing_type,
            is_published: mappedProperty.is_published
          });
        }
    };

    fetchProperty();
  }, [id, user, logPropertyAction]);

  const handleTogglePublication = async () => {
    if (!property) return;
    if (!canEdit) {
      toast({
        title: "غير مسموح",
        description: "ليس لديك صلاحية لتغيير حالة هذا العقار",
        variant: "destructive",
      });
      return;
    }
    setIsUpdating(true);

    const nextStatus = !property.is_published;

    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("properties")
      .update({ is_published: nextStatus, updated_at: updatedAt })
      .eq("id", property.id);

    if (error) {
      console.error("Error toggling publication:", error);
      toast({
        title: "فشل في تحديث حالة النشر",
        description: error.message,
        variant: "destructive",
      });
      setIsUpdating(false);
      return;
    }

  setProperty(prev => (prev ? { ...prev, is_published: nextStatus, updated_at: updatedAt } : prev));
    
    // تسجيل عملية تغيير حالة النشر
    await logPropertyAction('update', property.id, {
      action: nextStatus ? 'publish' : 'unpublish',
      title: property.title,
      previous_status: property.is_published,
      new_status: nextStatus
    });
    
    toast({
      title: nextStatus ? "تم نشر العقار" : "تم إخفاء العقار",
      description: nextStatus
        ? "العقار متاح الآن للجميع"
        : "العقار أصبح مخفيًا ولن يظهر للزوار",
    });
    setIsUpdating(false);
  };

  const handleShare = async () => {
    if (!property) return;
    const shareUrl = `${window.location.origin}/property/${property.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description ?? property.title,
          url: shareUrl,
        });
        toast({
          title: "تمت مشاركة العقار",
          description: "تم فتح واجهة المشاركة في جهازك",
        });
      } catch (error) {
        console.error("Error sharing property:", error);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "تم نسخ رابط العقار",
        description: "يمكنك الآن مشاركة الرابط مع الآخرين",
      });
    } catch (error) {
      console.error("Clipboard error:", error);
      toast({
        title: "تعذر نسخ الرابط",
        description: "يرجى نسخ الرابط يدويًا",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    if (!property?.property_code) return;
    try {
      await navigator.clipboard.writeText(property.property_code);
      toast({
        title: "تم نسخ كود العقار",
        description: property.property_code,
      });
    } catch (error) {
      toast({
        title: "تعذر نسخ الكود",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (property) {
      navigate(`/edit-property/${property.id}`);
    }
  };

  const renderImageGallery = () => {
    if (!property || !property.images || property.images.length === 0) {
      return (
        <div className="relative w-full overflow-hidden rounded-3xl border bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="aspect-[3/2] flex flex-col items-center justify-center gap-3 text-gray-500">
            <Home className="h-16 w-16" />
            <p className="text-sm font-medium">لا توجد صور متاحة لهذا العقار حالياً</p>
          </div>
        </div>
      );
    }

    const activeImage = property.images[activeImageIndex] ?? property.images[0];

    return (
      <div className="space-y-4">
        <div className="relative w-full overflow-hidden rounded-3xl border">
          {/* Property Status Badge - Deal Status */}
          <PropertyStatusBadgeEnhanced 
            status={property.status} 
            listingType={property.listing_type}
          />
          
          <LazyImage
            src={activeImage}
            alt={property.title}
            className="h-[280px] md:h-[420px] w-full object-cover"
            placeholder={FALLBACK_IMAGE}
            fallback={FALLBACK_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
            <Badge className="bg-white/90 text-primary shadow">
              {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
            </Badge>
            {!property.is_published && (
              <Badge variant="destructive" className="bg-white/90 text-red-600">
                غير منشور
              </Badge>
            )}
          </div>
        </div>

        {property.images.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {property.images.map((image, index) => (
              <button
                key={image + index}
                type="button"
                aria-label={`عرض الصورة رقم ${index + 1}`}
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  "relative overflow-hidden rounded-xl border transition-all duration-200",
                  activeImageIndex === index
                    ? "ring-2 ring-primary scale-[1.02]"
                    : "opacity-80 hover:opacity-100"
                )}
              >
                <LazyImage
                  src={image}
                  alt={`${property.title} - صورة ${index + 1}`}
                  className="aspect-video w-full object-cover"
                  placeholder={FALLBACK_IMAGE}
                  fallback={FALLBACK_IMAGE}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

    // التحقق من الصلاحيات للعرض
    if (!permissionsLoading && !canView) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <EyeOff className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح بالعرض</h2>
            <p className="text-gray-600 mb-6">
              هذا العقار غير متاح للعرض حالياً أو تم إخفاؤه من قبل المالك.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/properties')} className="w-full">
                تصفح العقارات المتاحة
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                العودة للصفحة السابقة
              </Button>
            </div>
          </div>
        </div>
      );
    }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-lg border border-red-200">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <Home className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{error ?? "لم يتم العثور على العقار"}</h1>
              <p className="text-gray-600">
                ربما تم حذف العقار أو لم يعد متاحاً. يمكنك العودة لقائمة العقارات والمحاولة مرة أخرى.
              </p>
              <Button onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                العودة إلى الصفحة السابقة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      <div className="container mx-auto px-4">
        <div className="py-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                مشاركة العقار
              </Button>
              {property.property_code && (
                <Button variant="outline" className="gap-2" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                  نسخ كود العقار
                </Button>
              )}
              <div className="flex gap-2 mt-4">
                <ProtectedPropertyAction
                  propertyId={property.id}
                  action="edit"
                  variant="outline"
                  size="sm"
                  onAction={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-2" /> تعديل العقار
                </ProtectedPropertyAction>
                <ProtectedPropertyAction
                  propertyId={property.id}
                  action="edit"
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onAction={handleTogglePublication}
                >
                    {property.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        إخفاء العقار
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        نشر العقار
                      </>
                    )}
                </ProtectedPropertyAction>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {renderImageGallery()}

              <Card className="overflow-hidden border shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {getPropertyTypeLabel(property.property_type)}
                          </Badge>
                          {property.marketLabel && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {property.marketLabel}
                            </Badge>
                          )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                          {property.title}
                        </h1>
                        {property.property_code && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-400" />
                            كود العقار: <span className="font-semibold">{property.property_code}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">السعر</p>
                        <p className="text-3xl font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                          {formatCurrency(property.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      {property.location && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {property.location}
                        </span>
                      )}
                      {property.address && property.address !== property.location && (
                        <Separator orientation="vertical" className="hidden md:block h-4" />
                        
                      )}
                      {property.address && property.address !== property.location && (
                        <span className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary" />
                          {property.address}
                        </span>
                      )}
                      <Separator orientation="vertical" className="hidden md:block h-4" />
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {property.listing_type === "sale" ? "معروض للبيع" : "متاح للإيجار"}
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border bg-slate-50 p-4 text-center">
                      <Bed className="mx-auto mb-2 h-6 w-6 text-primary" />
                      <p className="text-sm text-gray-500">غرف النوم</p>
                      <p className="text-xl font-semibold text-gray-900">{property.bedrooms}</p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-center">
                      <Bath className="mx-auto mb-2 h-6 w-6 text-primary" />
                      <p className="text-sm text-gray-500">الحمامات</p>
                      <p className="text-xl font-semibold text-gray-900">{property.bathrooms}</p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-4 text-center">
                      <Ruler className="mx-auto mb-2 h-6 w-6 text-primary" />
                      <p className="text-sm text-gray-500">المساحة</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {property.area ? `${property.area} م²` : "غير محددة"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {property.description && (
                <Card className="border shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <h2 className="text-xl font-semibold text-gray-900">وصف العقار</h2>
                    <p className="leading-relaxed text-gray-700 whitespace-pre-line">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {property.amenities && property.amenities.length > 0 && (
                <Card className="border shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">المميزات</h2>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-sm">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Owner/Publisher info with verification badge */}
              <Card className="border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">المالك / الناشر</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{badgeTarget === 'publisher' ? 'الناشر' : 'المالك'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ownerProfile?.name ? (
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {ownerProfile.name}
                          <VerifiedBadge verified={!!isVerifiedOwner} />
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">غير متوفر</span>
                      )}
                    </div>
                  </div>
                  {(ownerProfile?.phone || ownerProfile?.email) && (
                    <div className="space-y-2 text-sm text-gray-700">
                      {ownerProfile.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">الهاتف</span>
                          <a href={`tel:${ownerProfile.phone}`} dir="ltr" className="text-primary hover:underline">{ownerProfile.phone}</a>
                        </div>
                      )}
                      {ownerProfile.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">البريد</span>
                          <a href={`mailto:${ownerProfile.email}`} className="text-primary hover:underline">{ownerProfile.email}</a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">تفاصيل النشر</p>
                    <h3 className="text-xl font-semibold text-gray-900">حالة العقار</h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">حالة النشر الحالية</span>
                      <Badge variant={property.is_published ? "default" : "secondary"}>
                        {property.is_published ? "منشور" : "مخفي"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">تاريخ الإضافة</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(property.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">آخر تحديث</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(property.updated_at)}
                      </span>
                    </div>
                    {property.marketLabel && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">أقرب سوق</span>
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Store className="h-4 w-4 text-primary" />
                          {property.marketLabel}
                        </span>
                      </div>
                    )}
                  </div>

                    <div className="rounded-2xl border border-dashed bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">إجراءات إدارية</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        يمكنك نشر أو إخفاء العقار في أي وقت، أو تعديل بياناته لمواكبة التغييرات.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <ProtectedPropertyAction
                          propertyId={property.id}
                          action="edit"
                          variant="secondary"
                          className="gap-2"
                          onAction={() => navigate(`/edit-property/${property.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                          تعديل العقار
                        </ProtectedPropertyAction>
                        <ProtectedPropertyAction
                          propertyId={property.id}
                          action="edit"
                          className="gap-2"
                          variant={property.is_published ? "destructive" : "default"}
                          disabled={isUpdating}
                          onAction={handleTogglePublication}
                        >
                          {property.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              إخفاء العقار
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              نشر العقار
                            </>
                          )}
                        </ProtectedPropertyAction>
                      </div>
                    </div>
                </CardContent>
              </Card>

              {!isMobile && property.location && (
                <Card className="border shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">موقع العقار</h3>
                    <p className="text-gray-700">
                      {property.location}
                    </p>
                    {property.address && (
                      <p className="text-sm text-gray-500 border-t pt-3">
                        العنوان التفصيلي: {property.address}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (property.latitude && property.longitude) {
                          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
                          window.open(mapUrl, "_blank");
                        } else if (property.location) {
                          const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(property.location)}`;
                          window.open(mapUrl, "_blank");
                        }
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      عرض على الخريطة
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
