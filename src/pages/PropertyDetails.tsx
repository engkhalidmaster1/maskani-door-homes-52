import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Heart, MapPin, Tag, Calendar, AlertCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { PropertyDocuments } from "@/components/Property/PropertyDocuments";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { formatCurrency } from "@/lib/utils";
import { getMarketLabel, resolveMarketValue } from "@/constants/markets";

// تهيئة أيقونة الخريطة
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  property_type: string;
  listing_type: "sale" | "rent";
  user_id: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  amenities: string[];
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  views?: number;
  market?: string | null;
  marketLabel?: string | null;
}

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [propertyDocuments, setPropertyDocuments] = useState<{
    id: string;
    name: string;
    type: 'ownership' | 'identity' | 'permit' | 'survey' | 'contract' | 'other';
    url: string;
    size: number;
    uploaded_at: string;
    verified?: boolean;
    notes?: string;
  }[]>([]);

  const marketLabel = property
    ? property.marketLabel ?? (() => {
        const resolved = resolveMarketValue(
          property.market ?? property.location ?? property.address ?? null
        );
        return resolved ? getMarketLabel(resolved) : null;
      })()
    : null;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        // Increment view count (commented out until views column is added to database)
        // await supabase
        //   .from("properties")
        //   .update({ views: (data.views || 0) + 1 })
        //   .eq("id", id);

        setProperty(data as Property);
        fetchSimilarProperties(data.property_type, data.id);
      } catch (error: unknown) {
        console.error("Error fetching property:", error);
        toast({
          title: "خطأ في جلب بيانات العقار",
          description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchSimilarProperties = async (propertyType: string, currentId: string) => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("property_type", propertyType)
          .neq("id", currentId)
          .eq("is_published", true)
          .limit(3);

        if (error) throw error;
        setSimilarProperties(data as Property[]);
      } catch (error) {
        console.error("Error fetching similar properties:", error);
      }
    };

    fetchProperty();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">العقار غير موجود</h2>
          <p className="mb-4">لم يتم العثور على العقار المطلوب</p>
          <Button onClick={() => navigate("/properties")}>
            العودة إلى العقارات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back Button and Actions */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="ml-2 h-4 w-4" /> العودة
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="ml-2 h-4 w-4" /> مشاركة
          </Button>
          <Button
            variant={isFavorite(property.id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFavorite(property.id)}
          >
            <Heart className={`ml-2 h-4 w-4 ${isFavorite(property.id) ? "fill-current" : ""}`} />
            {isFavorite(property.id) ? "تمت الإضافة للمفضلة" : "أضف للمفضلة"}
          </Button>
        </div>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{property.title}</CardTitle>
                  <div className="flex flex-col items-end gap-1 mt-2 text-muted-foreground">
                    {property.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 ml-1" />
                        <span>{property.location}</span>
                      </div>
                    )}
                    {marketLabel && (
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded-full border border-amber-200">
                        <Store className="h-3 w-3" />
                        <span>قرب {marketLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge 
                  className={`px-3 py-1 text-white ${
                    property.listing_type === "sale" 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-3 rounded-lg text-center">
                  <div className="font-bold">غرف النوم</div>
                  <div className="text-2xl mt-1">{property.bedrooms}</div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <div className="font-bold">الحمامات</div>
                  <div className="text-2xl mt-1">{property.bathrooms}</div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <div className="font-bold">المساحة</div>
                  <div className="text-2xl mt-1">{property.area} م²</div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                  <div className="font-bold">تاريخ النشر</div>
                  <div className="text-sm mt-1">
                    {new Date(property.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">السعر</h3>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(property.price)} د.ع.‏
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">الوصف</h3>
                <p className="text-muted-foreground">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">المرافق</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary ml-2"></div>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Contact Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">معلومات الاتصال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {property.owner_name && (
                  <div>
                    <div className="font-medium">اسم المالك</div>
                    <div>{property.owner_name}</div>
                  </div>
                )}
                
                {property.owner_phone && (
                  <div>
                    <div className="font-medium">رقم الهاتف</div>
                    <div className="flex items-center justify-between">
                      <span dir="ltr">{property.owner_phone}</span>
                      <Button size="sm" variant="default">
                        اتصل الآن
                      </Button>
                    </div>
                  </div>
                )}
                
                {property.owner_email && (
                  <div>
                    <div className="font-medium">البريد الإلكتروني</div>
                    <div className="flex items-center justify-between">
                      <span dir="ltr">{property.owner_email}</span>
                      <Button size="sm" variant="outline">
                        أرسل رسالة
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 ml-1" />
                    تم النشر {new Date(property.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 ml-1" />
                    {property.property_type}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Report Property */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تبليغ عن العقار</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                إذا كان هناك أي مشكلة في هذا العقار أو المعلومات المقدمة غير صحيحة، يرجى إبلاغنا.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                <AlertCircle className="w-4 h-4 ml-2" />
                تبليغ عن مشكلة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mb-8">
        <Carousel className="w-full">
          <CarouselContent>
            {property.images && property.images.length > 0 ? (
              property.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-video w-full overflow-hidden rounded-xl">
                    <img
                      src={image}
                      alt={`صورة ${index + 1} للعقار`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد صور متاحة</p>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Property Location Map */}
      {property.latitude && property.longitude && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              موقع العقار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg overflow-hidden">
              <MapContainer
                center={[property.latitude, property.longitude]}
                zoom={15}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[property.latitude, property.longitude]}>
                  <Popup>
                    <div className="text-center p-2">
                      <h3 className="font-bold text-sm mb-1">{property.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{property.location}</p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(property.price)} د.ع.‏
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            {property.address && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>العنوان الكامل:</strong> {property.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Show address if no coordinates available */}
      {(!property.latitude || !property.longitude) && property.address && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              موقع العقار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted rounded-lg">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">العنوان متوفر</h3>
              <p className="text-gray-600 mb-3">
                لم يتم تحديد الموقع على الخريطة لهذا العقار
              </p>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm">
                  <strong>العنوان:</strong> {property.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Documents */}
      {property && (
        <div className="mb-8">
          <PropertyDocuments
            propertyId={property.id}
            documents={propertyDocuments}
            onDocumentsChange={setPropertyDocuments}
            canEdit={user?.id === property.user_id}
          />
        </div>
      )}

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">عقارات مشابهة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProperties.map((similarProperty) => (
              <div
                key={similarProperty.id}
                onClick={() => navigate(`/property/${similarProperty.id}`)}
                className="cursor-pointer"
              >
                <PropertyCard
                  property={similarProperty}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
