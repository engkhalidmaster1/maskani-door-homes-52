import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';
import { PropertyMapCard } from '@/components/Map/PropertyMapCard';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// نوع البيانات للعقار (متوافق مع useProperties)
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
  images: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  ownership_type?: "ملك صرف" | "سر قفلية" | null;
  latitude?: number;
  longitude?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  market?: string | null;
  marketLabel?: string | null;
}

// إصلاح أيقونات Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// أيقونة مخصصة للعقارات
const createPropertyIcon = (type: string) => {
  const color = type === 'للبيع' ? '#ef4444' : '#3b82f6';
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
        ">🏠</div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// دالة مساعدة لاستخراج الإحداثيات من العقار
const getPropertyCoordinates = (property: Property): [number, number] => {
  // إذا كانت الإحداثيات محفوظة مباشرة
  if (property.latitude && property.longitude) {
    return [property.latitude, property.longitude];
  }
  
  // إذا كانت الإحداثيات في العنوان (مؤقتاً نستخدم موقع افتراضي)
  // يمكن تحسين هذا لاحقاً لاستخراج الإحداثيات من address
  return [34.406075, 43.789876]; // الموقع الافتراضي في العراق
};



export function MapPage() {
  const { properties, deleteProperty } = useProperties();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mapCenter] = useState<[number, number]>([34.406075, 43.789876]); // قضاء الدور, محافظة صلاح الدين, العراق
  const [mapZoom] = useState(12);

  // تصفية العقارات التي لها إحداثيات
  const propertiesWithLocation = properties.filter(
    property => property.latitude && property.longitude
  );

  const handleViewProperty = (id: string) => {
    navigate(`/property/${id}`);
  };

  const handleEditProperty = (property: Property) => {
    navigate(`/edit-property/${property.id}`);
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العقار؟')) {
      try {
        await deleteProperty(id);
        toast({
          title: "تم حذف العقار بنجاح",
          description: "تم حذف العقار من قاعدة البيانات والخريطة",
        });
      } catch (error) {
        toast({
          title: "خطأ في حذف العقار",
          description: "حدث خطأ أثناء حذف العقار، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    }
  };

  const handleContactProperty = (property: Property) => {
    if (property.owner_phone) {
      // فتح تطبيق الهاتف
      window.open(`tel:${property.owner_phone}`);
    } else if (property.owner_email) {
      // فتح تطبيق البريد الإلكتروني
      window.open(`mailto:${property.owner_email}`);
    } else {
      toast({
        title: "معلومات الاتصال غير متوفرة",
        description: "لا توجد معلومات اتصال لهذا العقار",
        variant: "destructive",
      });
    }
  };

  const canManageProperty = (property: Property) => {
    return user && property.user_id === user.id;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <div className="text-right">
                <h1 className="text-2xl font-bold">خريطة العقارات</h1>
                <p className="text-gray-600">
                  اكتشف العقارات على الخريطة ({propertiesWithLocation.length} عقار)
                </p>
                <p className="text-sm text-gray-500">
                  📍 الموقع المحوري: قضاء الدور, محافظة صلاح الدين, العراق
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/add-property')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              إضافة عقار جديد
            </Button>
          </div>
        </div>
      </div>

      {/* خريطة */}
      <div className="h-[calc(100vh-120px)]">
        {propertiesWithLocation.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center max-w-md">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد عقارات على الخريطة</h3>
              <p className="text-gray-600 mb-4">
                أضف عقارات جديدة مع تحديد مواقعها لرؤيتها على الخريطة
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  📍 المنطقة المركزية: قضاء الدور، محافظة صلاح الدين، العراق
                </p>
                <p className="text-sm text-blue-600">
                  🏠 إجمالي العقارات: {properties.length}
                </p>
                <p className="text-sm text-orange-600">
                  🗺️ عقارات بمواقع: {propertiesWithLocation.length}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                <Button 
                  onClick={() => navigate('/add-property')}
                  className="w-full"
                >
                  إضافة عقار جديد
                </Button>
                <Button 
                  onClick={() => navigate('/properties')} 
                  variant="outline"
                  className="w-full"
                >
                  تصفح العقارات
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {propertiesWithLocation.map((property) => (
              <Marker
                key={property.id}
                position={getPropertyCoordinates(property)}
                icon={createPropertyIcon(property.listing_type === 'sale' ? 'للبيع' : 'للإيجار')}
              >
                <Popup>
                  <PropertyMapCard
                    property={property}
                    onEdit={handleEditProperty}
                    onDelete={handleDeleteProperty}
                    onView={handleViewProperty}
                    onContact={handleContactProperty}
                    canManage={canManageProperty(property)}
                    showActions={true}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}