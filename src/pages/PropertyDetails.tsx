import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Ruler, 
  Car, 
  Wifi, 
  Snowflake, 
  Tv, 
  Phone, 
  Mail, 
  Calendar,
  Share2,
  Heart,
  Eye,
  Building,
  Home,
  Star,
  Clock,
  User,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  address: string;
  amenities: string[];
  images: string[];
  is_published: boolean;
  created_at: string;
  user_id: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
}

export const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      
      // Fetch property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        toast({
          title: "خطأ",
          description: "العقار غير موجود أو غير متاح",
          variant: "destructive",
        });
        navigate('/properties');
        return;
      }

      // Fetch owner details
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', propertyData.user_id)
        .single();

      if (!ownerError && ownerData) {
        propertyData.owner_name = ownerData.full_name;
        propertyData.owner_phone = ownerData.phone;
        propertyData.owner_email = ownerData.email;
      }

      setProperty(propertyData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل العقار",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPropertyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'شقة':
      case 'apartment':
        return <Home className="w-5 h-5" />;
      case 'فيلا':
      case 'villa':
        return <Building className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'واي فاي':
        return <Wifi className="w-4 h-4" />;
      case 'ac':
      case 'مكيف':
        return <Snowflake className="w-4 h-4" />;
      case 'tv':
      case 'تلفاز':
        return <Tv className="w-4 h-4" />;
      case 'parking':
      case 'موقف سيارات':
        return <Car className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">جاري تحميل تفاصيل العقار...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">العقار غير موجود</h2>
          <p className="text-muted-foreground mb-4">العقار الذي تبحث عنه غير متاح أو تم حذفه</p>
          <Button onClick={() => navigate('/properties')}>
            العودة إلى العقارات
          </Button>
        </div>
      </div>
    );
  }

  const defaultImages = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  ];

  const images = property.images && property.images.length > 0 ? property.images : defaultImages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                مشاركة
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isFavorite ? 'text-red-500' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'محفوظ' : 'حفظ'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden shadow-lg">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 to-indigo-100">
                <img
                  src={images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Image Navigation */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex gap-2 justify-center">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white scale-125' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Property Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                    {property.listing_type === 'rent' ? 'للإيجار' : 'للبيع'}
                  </Badge>
                </div>

                {/* Price Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-900 px-4 py-2 text-lg font-bold shadow-lg">
                    {formatPrice(property.price)}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Property Info */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPropertyIcon(property.property_type)}
                    <Badge variant="outline" className="text-sm">
                      {property.property_type}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Bed className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">غرف النوم</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Bath className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">الحمامات</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Ruler className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">المساحة</p>
                    <p className="font-semibold">{property.area} م²</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">تاريخ النشر</p>
                    <p className="font-semibold text-xs">{formatDate(property.created_at)}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">الوصف</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {property.description || 'لا يوجد وصف متاح لهذا العقار.'}
                  </p>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-xl font-semibold mb-4">المرافق</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="shadow-lg sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {property.owner_name || 'مالك العقار'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>مالك موثوق</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {property.owner_phone && (
                    <Button className="w-full gap-2" variant="outline">
                      <Phone className="w-4 h-4" />
                      {property.owner_phone}
                    </Button>
                  )}
                  
                  {property.owner_email && (
                    <Button className="w-full gap-2" variant="outline">
                      <Mail className="w-4 h-4" />
                      {property.owner_email}
                    </Button>
                  )}
                  
                  <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Phone className="w-4 h-4" />
                    اتصل الآن
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                    <Eye className="w-4 h-4" />
                    <span>تم المشاهدة 42 مرة</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>نُشر منذ {Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">عقارات مشابهة</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">شقة مماثلة</h4>
                      <p className="text-xs text-muted-foreground">نفس المنطقة</p>
                      <p className="text-sm font-semibold text-blue-600">٣٥٠ د.ع</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">فيلا قريبة</h4>
                      <p className="text-xs text-muted-foreground">منطقة مجاورة</p>
                      <p className="text-sm font-semibold text-green-600">٥٠٠ د.ع</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
