import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { PropertyMapCard } from '@/components/Map/PropertyMapCard';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  property_code?: string | null;
  amenities: string[] | null;
  images: string[] | null;
  is_published: boolean;
  status?: string; // available, sold, rented, under_negotiation
  created_at: string;
  updated_at: string;
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

// أيقونة مميزة لموقع المستخدم الحالي
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <!-- الدائرة الخارجية المتحركة (Pulse) -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background-color: rgba(37, 99, 235, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        
        <!-- النقطة الرئيسية -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background-color: #2563eb;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.8), 0 0 30px rgba(37, 99, 235, 0.4);
          z-index: 10;
        "></div>
        
        <!-- أيقونة الموقع -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          z-index: 11;
        ">📍</div>
      </div>
      
      <style>
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      </style>
    `,
    className: 'user-location-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
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

// مكون للتركيز على موقع المستخدم
const FocusOnUserLocation = ({ userLocation, onFocus }: { userLocation: [number, number] | null, onFocus: () => void }) => {
  const map = useMap();

  const handleFocusClick = () => {
    if (userLocation) {
      map.flyTo(userLocation, 16, { duration: 0.8 });
      onFocus();
    }
  };

  if (!userLocation) {
    return null;
  }

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '20px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleFocusClick}
          className="bg-white hover:bg-blue-50 text-blue-600 font-bold py-3 px-3 rounded-lg shadow-lg border-2 border-blue-500 transition-all hover:scale-110 flex items-center justify-center"
          style={{ width: '50px', height: '50px' }}
          title="موقعي الحالي"
        >
          <span style={{ fontSize: '24px' }}>📍</span>
        </button>
      </div>
    </div>
  );
};

export function MapPage() {
  const { properties, deleteProperty } = useProperties();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom] = useState(DEFAULT_ZOOM);
  const [debugMode, setDebugMode] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(true);
  const [radiusKm, setRadiusKm] = useState(25);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedFromParams = useRef(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Request user GPS location with high accuracy and continuous tracking
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('جهازك لا يدعم خدمة تحديد الموقع (GPS)');
      toast({
        title: "خطأ",
        description: 'جهازك لا يدعم خدمة تحديد الموقع (GPS)',
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    // خيارات GPS محسّنة للحصول على أعلى دقة ممكنة
    const gpsOptions: PositionOptions = {
      enableHighAccuracy: true,  // استخدام GPS بدقة عالية (مطلوب!)
      timeout: 30000,            // 30 ثانية - وقت كافٍ للحصول على إشارة GPS دقيقة
      maximumAge: 0              // عدم استخدام موقع مخزن - طلب موقع جديد دائماً
    };

    let bestAccuracy = Infinity;
    let hasShownInitialToast = false;

    // استخدام watchPosition للحصول على تحديثات مستمرة وتحسين الدقة
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const loc: [number, number] = [latitude, longitude];
        
        // تحديث الموقع فقط إذا كانت الدقة أفضل أو هذا أول موقع
        if (accuracy < bestAccuracy || !userLocation) {
          bestAccuracy = accuracy;
          setUserLocation(loc);
          setLocationAccuracy(accuracy);
          
          // تحديث مركز الخريطة فقط في أول مرة
          if (!userLocation) {
            setMapCenter(loc);
          }
          
          setIsLoadingLocation(false);
          
          console.log(`📍 GPS محدّث - الدقة: ${Math.round(accuracy)} متر`);
          
          // عرض إشعار فقط عند أول تحديد أو عند تحسن كبير في الدقة
          if (!hasShownInitialToast || (hasShownInitialToast && accuracy < 100 && bestAccuracy > 100)) {
            const accuracyText = accuracy < 50 
              ? `ممتاز! دقة عالية جداً: ${Math.round(accuracy)} متر` 
              : accuracy < 100
              ? `جيد! دقة جيدة: ${Math.round(accuracy)} متر`
              : `دقة متوسطة: ${Math.round(accuracy)} متر - الرجاء الانتظار للحصول على دقة أفضل`;
            
            toast({
              title: accuracy < 100 ? "✓ تم تحديد موقعك بنجاح" : "جاري تحسين دقة الموقع...",
              description: accuracyText,
              variant: accuracy < 100 ? "default" : "destructive",
            });
            hasShownInitialToast = true;
          }
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = 'فشل في تحديد الموقع';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'يرجى السماح للتطبيق بالوصول إلى موقعك من إعدادات المتصفح';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متوفرة. تأكد من تشغيل GPS على جهازك';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة طلب الموقع. تأكد من وجودك في مكان مفتوح للحصول على إشارة GPS أفضل';
            break;
        }
        
        setLocationError(errorMessage);
        console.warn(`GPS Error: ${errorMessage}`, error);
        
        toast({
          title: "⚠️ تنبيه",
          description: errorMessage,
          variant: "destructive",
        });
      },
      gpsOptions
    );

    // تنظيف: إيقاف تتبع الموقع عند إلغاء تحميل المكون
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 تم إيقاف تتبع GPS');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Initialize from URL params once
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);

    const lt = searchParams.get('lt');
    if (lt === 'sale' || lt === 'rent') setListingTypeFilter(lt);

    const pt = searchParams.get('pt');
    if (pt === 'apartment' || pt === 'house' || pt === 'commercial') setPropertyTypeFilter(pt);

    const near = searchParams.get('near');
    if (near === '0' || near === 'false') setNearMeEnabled(false);
    else if (near === '1' || near === 'true') setNearMeEnabled(true);

    const r = searchParams.get('r');
    if (r) {
      const n = parseInt(r, 10);
      if (!Number.isNaN(n) && n > 0 && n <= 200) setRadiusKm(n);
    }

    hasInitializedFromParams.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'' | 'sale' | 'rent'>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'' | 'apartment' | 'house' | 'commercial'>('');
  const hasActiveFilters =
    (searchTerm && searchTerm.trim().length > 0) ||
    listingTypeFilter !== '' ||
    propertyTypeFilter !== '';
  const clearAllFilters = () => {
    setSearchTerm('');
    setListingTypeFilter('');
    setPropertyTypeFilter('');
  };
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Sync to URL params whenever state changes (after initial hydration)
  useEffect(() => {
    if (!hasInitializedFromParams.current) return;
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (listingTypeFilter) params.set('lt', listingTypeFilter);
    if (propertyTypeFilter) params.set('pt', propertyTypeFilter);
    params.set('near', nearMeEnabled ? '1' : '0');
    if (nearMeEnabled) params.set('r', String(radiusKm));
    setSearchParams(params, { replace: true });
  }, [searchTerm, listingTypeFilter, propertyTypeFilter, nearMeEnabled, radiusKm, setSearchParams]);

  const mapProperties = useMemo<MarkerData[]>(() => {
    return properties
      .map(resolvePropertyPosition)
      .filter((item): item is MarkerData => item !== null);
  }, [properties]);

  const filteredMapProperties = useMemo<MarkerData[]>(() => {
    let list = mapProperties;

    if (listingTypeFilter) {
      list = list.filter((m) => m.property.listing_type === listingTypeFilter);
    }
    if (propertyTypeFilter) {
      list = list.filter((m) => m.property.property_type === propertyTypeFilter);
    }
    if (debouncedSearch) {
      const s = debouncedSearch;
      list = list.filter((m) =>
        (m.property.title?.toLowerCase().includes(s)) ||
        (m.property.location?.toLowerCase().includes(s)) ||
        (m.property.address?.toLowerCase().includes(s)) ||
        (m.property.property_code?.toLowerCase().includes(s))
      );
    }

    // Near me filter
    if (nearMeEnabled && userLocation) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371; // Earth radius (km)
      const [ulat, ulng] = userLocation;
      list = list.filter(({ coords }) => {
        const [lat, lng] = coords;
        const dLat = toRad(lat - ulat);
        const dLng = toRad(lng - ulng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(ulat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d <= radiusKm;
      });
    }

    return list;
  }, [mapProperties, listingTypeFilter, propertyTypeFilter, debouncedSearch, nearMeEnabled, userLocation, radiusKm]);

  // إحصائيات للتشخيص
  const totalProperties = properties.length;
  const propertiesWithLocation = filteredMapProperties.length;
  
  // تشخيص إضافي - سجل في console للمطور
  useEffect(() => {
    console.log('🗺️ Map Debug Info:', {
      totalPropertiesFromHook: properties.length,
      propertiesWithLocation: mapProperties.length,
      sampleProperty: properties[0] || 'No properties found'
    });
  }, [properties, mapProperties]);

  useEffect(() => {
    if (filteredMapProperties.length > 0) {
      setMapCenter(filteredMapProperties[0].coords);
    } else if (userLocation) {
      setMapCenter(userLocation);
    } else {
      setMapCenter(DEFAULT_CENTER);
    }
  }, [filteredMapProperties, userLocation]);

  const preciseCount = useMemo(
    () => filteredMapProperties.filter((item) => item.source === "precise").length,
    [filteredMapProperties]
  );
  const approximateCount = filteredMapProperties.length - preciseCount;

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
      {/* Sticky Filter Bar matching Header */}
      <div className="gradient-primary text-primary-foreground shadow-elegant sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between md:h-16 md:gap-4">
            {/* Search */}
            <div className="w-full md:flex-1 md:max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/80 w-5 h-5 group-focus-within:scale-110 transition-transform" />
                <Input
                  placeholder="البحث بالعنوان، الموقع، أو الشفرة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 h-11 text-sm bg-white text-gray-800 border-2 border-white/70 focus:border-white focus:ring-0 rounded-xl shadow-md transition-all w-full"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="w-full md:w-auto flex items-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible py-1">
              {/* Listing type: sale / rent */}
              <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm shrink-0">
                <Button
                  variant={listingTypeFilter === 'sale' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListingTypeFilter(prev => prev === 'sale' ? '' : 'sale')}
                  className={`h-9 px-3 rounded-lg transition ${listingTypeFilter === 'sale' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="للبيع"
                >
                  💰 للبيع
                </Button>
                <Button
                  variant={listingTypeFilter === 'rent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListingTypeFilter(prev => prev === 'rent' ? '' : 'rent')}
                  className={`h-9 px-3 rounded-lg transition ${listingTypeFilter === 'rent' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="للإيجار"
                >
                  🏠 للإيجار
                </Button>
              </div>

              {/* Property type: apartment / house / commercial */}
              <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm shrink-0">
                <Button
                  variant={propertyTypeFilter === 'apartment' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'apartment' ? '' : 'apartment')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'apartment' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="شقة"
                >
                  🏢 شقة
                </Button>
                <Button
                  variant={propertyTypeFilter === 'house' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'house' ? '' : 'house')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'house' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="بيت"
                >
                  🏠 بيت
                </Button>
                <Button
                  variant={propertyTypeFilter === 'commercial' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'commercial' ? '' : 'commercial')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'commercial' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="محل تجاري"
                >
                  🏪 محل تجاري
                </Button>
              </div>

              {/* Clear Filters - shows only when active */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="gap-2 h-11 px-3 rounded-xl text-red-50 hover:bg-white/20 border-2 border-white shrink-0"
                  title="مسح الفلاتر"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-120px)]">
        <div className="relative h-full w-full">
          
          {/* تنبيه عند دقة منخفضة */}
          {userLocation && locationAccuracy && locationAccuracy > 200 && (
            <div className="absolute top-4 left-4 z-[1000] bg-red-50 border-2 border-red-400 rounded-xl shadow-lg p-3 max-w-xs">
              <div className="flex items-start gap-2">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm">
                  <p className="font-bold text-red-700 mb-1">دقة GPS منخفضة!</p>
                  <p className="text-red-600 text-xs leading-relaxed">
                    للحصول على دقة أفضل:
                    <br />• اخرج إلى مكان مفتوح
                    <br />• تأكد من تشغيل GPS
                    <br />• انتظر قليلاً لتحسين الإشارة
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {(filteredMapProperties.length > 0 || userLocation) && (
            <div className="absolute top-4 right-4 z-[1000]">
              <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-4 text-right space-y-1 min-w-[220px]">
                <p className="text-sm font-semibold text-gray-800">ملخص المواقع</p>
                <p className="text-xs text-gray-600">🏠 إجمالي العقارات: {filteredMapProperties.length}</p>
                <p className="text-xs text-emerald-600">📌 مواقع دقيقة: {preciseCount}</p>
                <p className="text-xs text-amber-600">✳️ مواقع تقديرية: {approximateCount}</p>
                {userLocation && (
                  <p className="text-[11px] text-blue-600">📍 العرض ضمن ~{radiusKm}كم من موقعك</p>
                )}
                {locationAccuracy && (
                  <p className={`text-[11px] font-bold ${
                    locationAccuracy < 50 ? 'text-green-600' : 
                    locationAccuracy < 100 ? 'text-amber-600' : 
                    'text-red-600'
                  }`}>
                    🎯 دقة GPS: {Math.round(locationAccuracy)} متر
                    {locationAccuracy < 50 && ' ✓'}
                    {locationAccuracy >= 100 && ' (جاري التحسين...)'}
                  </p>
                )}
                {approximateCount > 0 && (
                  <p className="text-[11px] text-amber-500 leading-relaxed">
                    حدّث موقع العقار من صفحة التعديل للحصول على دقة أعلى.
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={nearMeEnabled ? 'default' : 'outline'}
                    onClick={() => setNearMeEnabled((v) => !v)}
                    className="h-8"
                  >
                    {nearMeEnabled ? 'قريب مني: مفعل' : 'قريب مني: معطّل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setRadiusKm((r) => (r === 25 ? 50 : r === 50 ? 10 : 25))}
                    title="تبديل نصف القطر"
                  >
                    نصف القطر: {radiusKm}كم
                  </Button>
                </div>
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

            <AutoFitBounds positions={filteredMapProperties.map((item) => item.coords)} />
            
            {/* زر التركيز على موقع المستخدم */}
            <FocusOnUserLocation 
              userLocation={userLocation} 
              onFocus={() => {
                toast({
                  title: "تم التركيز على موقعك",
                  description: "الخريطة الآن تعرض موقعك الحالي",
                });
              }}
            />

            {/* User location marker - علامة موقع المستخدم بتصميم مميز */}
            {userLocation && (
              <Marker 
                position={userLocation}
                icon={createUserLocationIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="text-center p-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <strong className="text-blue-600">موقعك الحالي</strong>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>خط العرض: {userLocation[0].toFixed(6)}</div>
                      <div>خط الطول: {userLocation[1].toFixed(6)}</div>
                      {locationAccuracy && (
                        <div className={`mt-2 font-bold ${
                          locationAccuracy < 50 ? 'text-green-600' : 
                          locationAccuracy < 100 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          🎯 الدقة: {Math.round(locationAccuracy)} متر
                        </div>
                      )}
                    </div>
                    {!isLoadingLocation && locationAccuracy && locationAccuracy < 100 && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ تم تحديد موقعك بدقة عالية عبر GPS
                      </div>
                    )}
                    {isLoadingLocation && (
                      <div className="mt-2 text-xs text-blue-600 font-medium animate-pulse">
                        ⏳ جاري الحصول على إشارة GPS دقيقة...
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* دائرة الدقة حول موقع المستخدم */}
            {userLocation && locationAccuracy && (
              <Circle
                center={userLocation}
                radius={locationAccuracy}
                pathOptions={{ 
                  color: locationAccuracy < 50 ? '#10b981' : locationAccuracy < 100 ? '#f59e0b' : '#ef4444',
                  fillColor: locationAccuracy < 50 ? '#10b981' : locationAccuracy < 100 ? '#f59e0b' : '#ef4444',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* Near-me radius circle */}
            {userLocation && nearMeEnabled && (
              <Circle
                center={userLocation}
                radius={radiusKm * 1000}
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1 }}
              />
            )}

            {filteredMapProperties.map(({ property, coords, source }) => (
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