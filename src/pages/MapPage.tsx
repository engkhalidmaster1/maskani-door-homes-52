import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
import { MARKET_COORDINATES, resolveMarketValue } from '@/constants/markets';
import { supabase } from '@/integrations/supabase/client';

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
  latitude?: number | null;
  longitude?: number | null;
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

const DEFAULT_CENTER: [number, number] = [34.406075, 43.789876];
const DEFAULT_ZOOM = 12;

type MarkerSource = "precise" | "market";

interface MarkerData {
  property: Property;
  coords: [number, number];
  source: MarkerSource;
}

const jitterFromId = (id: string): [number, number] => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((Math.sin(hash) + 1) / 2) * 0.002 - 0.001;
  const lngOffset = ((Math.cos(hash) + 1) / 2) * 0.002 - 0.001;
  return [latOffset, lngOffset];
};

const createPropertyIcon = (type: "sale" | "rent", isApproximate: boolean) => {
  const color = type === "sale" ? "#ef4444" : "#2563eb";
  const glyph = isApproximate ? "📍" : "🏠";
  const shadow = isApproximate
    ? "box-shadow: 0 0 0 3px rgba(255,255,255,0.6), 0 0 0 6px rgba(37,99,235,0.2);"
    : "box-shadow: 0 2px 10px rgba(0,0,0,0.3);";

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        ${shadow}
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
        ">${glyph}</div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const resolvePropertyPosition = (property: Property): MarkerData | null => {
  // أولاً: إحداثيات دقيقة
  if (
    typeof property.latitude === "number" &&
    !Number.isNaN(property.latitude) &&
    typeof property.longitude === "number" &&
    !Number.isNaN(property.longitude)
  ) {
    return {
      property,
      coords: [property.latitude, property.longitude],
      source: "precise",
    };
  }

  // ثانياً: حل الموقع من السوق/المنطقة
  const resolvedMarket = resolveMarketValue(
    property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined
  );

  if (resolvedMarket && MARKET_COORDINATES[resolvedMarket]) {
    const base = MARKET_COORDINATES[resolvedMarket];
    const [latOffset, lngOffset] = jitterFromId(property.id);

    return {
      property,
      coords: [base[0] + latOffset, base[1] + lngOffset],
      source: "market",
    };
  }

  // ثالثاً: موقع افتراضي (مركز المنطقة) للعقارات بدون موقع محدد
  const [latOffset, lngOffset] = jitterFromId(property.id);
  return {
    property,
    coords: [DEFAULT_CENTER[0] + latOffset, DEFAULT_CENTER[1] + lngOffset],
    source: "market",
  };
};

const AutoFitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  const lastKeyRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    const key = positions
      .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
      .join('|');

    if (lastKeyRef.current === key) {
      return;
    }

    lastKeyRef.current = key;

    if (positions.length === 1) {
      map.flyTo(positions[0], 16, { duration: 0.6 });
      return;
    }

    const bounds = L.latLngBounds(positions);
    if (!bounds.isValid()) {
      return;
    }

    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8, maxZoom: 16 });
  }, [positions, map]);

  return null;
};

export function MapPage() {
  const { properties, deleteProperty } = useProperties();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom] = useState(DEFAULT_ZOOM);
  const [debugMode, setDebugMode] = useState(false);

  const mapProperties = useMemo<MarkerData[]>(() => {
    return properties
      .map(resolvePropertyPosition)
      .filter((item): item is MarkerData => item !== null);
  }, [properties]);

  // إحصائيات للتشخيص
  const totalProperties = properties.length;
  const propertiesWithLocation = mapProperties.length;
  
  // تشخيص إضافي - سجل في console للمطور
  useEffect(() => {
    console.log('🗺️ Map Debug Info:', {
      totalPropertiesFromHook: properties.length,
      propertiesWithLocation: mapProperties.length,
      sampleProperty: properties[0] || 'No properties found'
    });
  }, [properties, mapProperties]);

  useEffect(() => {
    if (mapProperties.length > 0) {
      setMapCenter(mapProperties[0].coords);
    } else {
      setMapCenter(DEFAULT_CENTER);
    }
  }, [mapProperties]);

  const preciseCount = useMemo(
    () => mapProperties.filter((item) => item.source === "precise").length,
    [mapProperties]
  );
  const approximateCount = mapProperties.length - preciseCount;

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
                  اكتشف العقارات على الخريطة ({mapProperties.length} عقار)
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
        <div className="relative h-full w-full">
          {mapProperties.length > 0 && (
            <div className="absolute top-4 right-4 z-[1000]">
              <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-4 text-right space-y-1 min-w-[220px]">
                <p className="text-sm font-semibold text-gray-800">ملخص المواقع</p>
                <p className="text-xs text-gray-600">🏠 إجمالي العقارات: {mapProperties.length}</p>
                <p className="text-xs text-emerald-600">📌 مواقع دقيقة: {preciseCount}</p>
                <p className="text-xs text-amber-600">✳️ مواقع تقديرية: {approximateCount}</p>
                {approximateCount > 0 && (
                  <p className="text-[11px] text-amber-500 leading-relaxed">
                    حدّث موقع العقار من صفحة التعديل للحصول على دقة أعلى.
                  </p>
                )}
              </div>
            </div>
          )}

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

            <AutoFitBounds positions={mapProperties.map((item) => item.coords)} />

            {mapProperties.map(({ property, coords, source }) => (
              <Marker
                key={property.id}
                position={coords}
                icon={createPropertyIcon(property.listing_type, source === "market")}
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
                    isApproximate={source === "market"}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}