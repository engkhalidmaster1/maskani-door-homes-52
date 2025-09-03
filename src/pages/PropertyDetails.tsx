import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Heart, MapPin, Tag, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { formatCurrency } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  property_type: string;
  listing_type: "sale" | "rent";
  user_id: string;
  created_at: string;
  amenities: string[];
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  views?: number;
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
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 ml-1" />
                    {property.location}
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
    </div>
  );
};

export default PropertyDetails;
