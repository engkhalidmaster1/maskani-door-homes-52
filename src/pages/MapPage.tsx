import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Search, X, List, Layers, TrendingUp, Home, BarChart3 } from 'lucide-react';
import { PropertyMapCard } from '@/components/Map/PropertyMapCard';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import '@/styles/map-clusters.css';
import { MARKET_COORDINATES, resolveMarketValue } from '@/constants/markets';
import { formatCurrency } from '@/lib/utils';

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
const SIDEBAR_CHUNK = 10;

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

// مكون الخريطة الحرارية
const HeatMapLayer = ({ positions, show }: { positions: [number, number][]; show: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (!show || positions.length === 0) return;

    // @ts-expect-error - leaflet.heat types
    const heat = L.heatLayer(positions, {
      radius: 25,
      blur: 35,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: '#3b82f6',
        0.2: '#06b6d4',
        0.4: '#10b981',
        0.6: '#fbbf24',
        0.8: '#f59e0b',
        1.0: '#ef4444'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, positions, show]);

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(true);
  const [radiusKm, setRadiusKm] = useState(25);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedFromParams = useRef(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [visibleCount, setVisibleCount] = useState(SIDEBAR_CHUNK);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Toast notification when radius changes
  useEffect(() => {
    if (nearMeEnabled && userLocation) {
      toast({
        title: `📍 العرض ضمن ${radiusKm} كم من موقعك`,
        duration: 2000,
      });
    }
  }, [radiusKm, nearMeEnabled, toast, userLocation]);

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

    const minP = searchParams.get('minPrice');
    if (minP) setMinPrice(Number(minP));

    const maxP = searchParams.get('maxPrice');
    if (maxP) setMaxPrice(Number(maxP));

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
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Debounce price for URL sync only (to avoid lag while dragging), but filter map instantly
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  const hasActiveFilters =
    (searchTerm && searchTerm.trim().length > 0) ||
    listingTypeFilter !== '' ||
    propertyTypeFilter !== '' ||
    minPrice !== '' ||
    maxPrice !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setListingTypeFilter('');
    setPropertyTypeFilter('');
    setMinPrice('');
    setMaxPrice('');
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
    if (debouncedMinPrice !== '') params.set('minPrice', String(debouncedMinPrice));
    if (debouncedMaxPrice !== '') params.set('maxPrice', String(debouncedMaxPrice));
    params.set('near', nearMeEnabled ? '1' : '0');
    if (nearMeEnabled) params.set('r', String(radiusKm));
    setSearchParams(params, { replace: true });
  }, [searchTerm, listingTypeFilter, propertyTypeFilter, debouncedMinPrice, debouncedMaxPrice, nearMeEnabled, radiusKm, setSearchParams]);

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
    if (minPrice !== '') {
      list = list.filter((m) => m.property.price >= Number(minPrice));
    }
    if (maxPrice !== '') {
      list = list.filter((m) => m.property.price <= Number(maxPrice));
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

       const distance = (lat: number, lng: number) => {
        const dLat = toRad(lat - ulat);
        const dLng = toRad(lng - ulng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(ulat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      list = list.filter(({ coords }) => {
        const [lat, lng] = coords;
        return distance(lat, lng) <= radiusKm;
      });

      // عند تفعيل قريب مني، رتب النتائج بالأقرب أولاً لعرض أفضل 10 بشكل أدق
      list = [...list].sort(({ coords: a }, { coords: b }) => {
        const [latA, lngA] = a;
        const [latB, lngB] = b;
        return distance(latA, lngA) - distance(latB, lngB);
      });
    }

    return list;
  }, [mapProperties, listingTypeFilter, propertyTypeFilter, debouncedSearch, nearMeEnabled, userLocation, radiusKm, minPrice, maxPrice]);

  // اضبط الحدّ الافتراضي للعرض عند تغير الفلاتر/الموقع، وتأكد من عدم تجاوز العدد الإجمالي
  useEffect(() => {
    setVisibleCount(Math.min(SIDEBAR_CHUNK, filteredMapProperties.length || 0));
  }, [filteredMapProperties.length, listingTypeFilter, propertyTypeFilter, debouncedSearch, nearMeEnabled, userLocation, radiusKm, minPrice, maxPrice]);

  // القائمة المعروضة فعلياً (محدودة بالتحميل التدريجي)
  const visibleSidebarProperties = useMemo(() => {
    if (visibleCount <= 0) return [] as MarkerData[];
    return filteredMapProperties.slice(0, visibleCount);
  }, [filteredMapProperties, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + SIDEBAR_CHUNK, filteredMapProperties.length));
  };

  // مراقبة نهاية القائمة للتحميل التلقائي (Infinite Scroll)
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (visibleCount >= filteredMapProperties.length) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + SIDEBAR_CHUNK, filteredMapProperties.length));
      }
    }, { threshold: 0.5, rootMargin: '200px' });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredMapProperties.length, visibleCount]);

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

  // Quick Stats calculations
  const stats = useMemo(() => {
    const forSale = filteredMapProperties.filter(m => m.property.listing_type === 'sale');
    const forRent = filteredMapProperties.filter(m => m.property.listing_type === 'rent');
    const avgPrice = filteredMapProperties.length > 0
      ? filteredMapProperties.reduce((sum, m) => sum + m.property.price, 0) / filteredMapProperties.length
      : 0;
    const minPrice = filteredMapProperties.length > 0
      ? Math.min(...filteredMapProperties.map(m => m.property.price))
      : 0;
    const maxPrice = filteredMapProperties.length > 0
      ? Math.max(...filteredMapProperties.map(m => m.property.price))
      : 0;
    
    return {
      total: filteredMapProperties.length,
      forSale: forSale.length,
      forRent: forRent.length,
      avgPrice,
      minPrice,
      maxPrice
    };
  }, [filteredMapProperties]);

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
      <div className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-[1002]">
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

              {/* Price Filter */}
              <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-3 rounded-lg transition ${minPrice !== '' || maxPrice !== '' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                      title="السعر"
                    >
                      💰 السعر
                      {(minPrice !== '' || maxPrice !== '') && (
                        <span className="mr-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {(minPrice !== '' && maxPrice !== '') ? '2' : '1'}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-6 z-[2000]" align="start">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">نطاق السعر</h4>
                        <p className="text-sm text-muted-foreground">
                          حدد السعر المناسب لك
                        </p>
                      </div>
                      <div className="grid gap-4 pt-2">
                        {(() => {
                          const isRent = listingTypeFilter === 'rent';
                          const maxLimit = isRent ? 20000000 : 10000000000;
                          // Step: 5 Million for Sale, 50k for Rent
                          const step = isRent ? 50000 : 5000000;

                          const currentMin = minPrice === '' ? 0 : Number(minPrice);
                          const currentMax = maxPrice === '' ? maxLimit : Number(maxPrice);

                          const formatPrice = (price: number) => {
                            if (price >= 1000000000) {
                              // Show 3 decimal places to make 5M increments visible (0.005B)
                              return (price / 1000000000).toFixed(3).replace(/\.?0+$/, '') + ' مليار';
                            }
                            if (price >= 1000000) {
                              return (price / 1000000).toFixed(2).replace(/\.?0+$/, '') + ' مليون';
                            }
                            if (price >= 1000) return (price / 1000).toFixed(0) + ' ألف';
                            return price;
                          };

                          return (
                            <>
                              <div className="flex items-center justify-between text-sm font-medium">
                                <span className="text-primary">{formatPrice(currentMin)}</span>
                                <span className="text-primary">{formatPrice(currentMax)}</span>
                              </div>
                              <Slider
                                defaultValue={[0, maxLimit]}
                                value={[currentMin, currentMax]}
                                max={maxLimit}
                                step={step}
                                min={0}
                                onValueChange={(values) => {
                                  setMinPrice(values[0]);
                                  setMaxPrice(values[1]);
                                }}
                                className="py-4"
                              />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <span>{formatPrice(maxLimit)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

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

      {/* Quick Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs text-gray-600">عقار متاح</div>
                </div>
              </div>
              


              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stats.forSale} للبيع
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats.forRent} للإيجار
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showSidebar ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                {showSidebar ? 'إخفاء القائمة' : 'عرض القائمة'}
              </Button>
              <Button
                variant={showHeatMap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHeatMap(!showHeatMap)}
                className="gap-2"
              >
                <Layers className="w-4 h-4" />
                {showHeatMap ? 'إخفاء الكثافة' : 'خريطة الكثافة'}
              </Button>
              <Button
                size="sm"
                variant={nearMeEnabled ? 'default' : 'outline'}
                onClick={() => setNearMeEnabled((v) => !v)}
                className="gap-2"
              >
                {nearMeEnabled ? 'قريب مني: مفعل' : 'قريب مني: معطّل'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRadiusKm((r) => (r === 25 ? 50 : r === 50 ? 10 : 25))}
                title="تبديل نصف القطر"
                className="gap-2"
              >
                نصف القطر: {radiusKm}كم
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-200px)]">
        <div className="relative h-full w-full flex">


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



          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <AutoFitBounds positions={filteredMapProperties.map((item) => item.coords)} />

            {/* Heat Map Layer */}
            <HeatMapLayer 
              positions={filteredMapProperties.map((item) => item.coords)} 
              show={showHeatMap} 
            />

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
                        <div className={`mt-2 font-bold ${locationAccuracy < 50 ? 'text-green-600' :
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

            {/* Clustering للعقارات */}
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              iconCreateFunction={(cluster) => {
                const count = cluster.getChildCount();
                let size = 'small';
                let className = 'marker-cluster-small';
                
                if (count > 10) {
                  size = 'medium';
                  className = 'marker-cluster-medium';
                }
                if (count > 50) {
                  size = 'large';
                  className = 'marker-cluster-large';
                }
                
                return L.divIcon({
                  html: `<div><span>${count}</span></div>`,
                  className: `marker-cluster ${className}`,
                  iconSize: L.point(40, 40)
                });
              }}
            >
              {filteredMapProperties.map(({ property, coords, source }) => (
                <Marker
                  key={property.id}
                  position={coords}
                  icon={createPropertyIcon(property.listing_type, source === "market")}
                  eventHandlers={{
                    mouseover: () => setHoveredPropertyId(property.id),
                    mouseout: () => setHoveredPropertyId(null)
                  }}
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
            </MarkerClusterGroup>
          </MapContainer>

          {/* القائمة الجانبية للعقارات */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl z-[1000] overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5" />
                    <div>
                      <h3 className="font-bold text-lg">قائمة العقارات</h3>
                      <p className="text-sm opacity-90">
                        يعرض {visibleSidebarProperties.length} من {filteredMapProperties.length} عقار
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-3 bg-gray-50 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{stats.minPrice > 0 ? formatCurrency(stats.minPrice) : '---'}</span>
                      <span className="text-gray-500 mx-2">-</span>
                      <span className="font-bold text-gray-900">{stats.maxPrice > 0 ? formatCurrency(stats.maxPrice) : '---'}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      نطاق الأسعار
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {filteredMapProperties.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>لا توجد عقارات مطابقة للفلاتر</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {visibleSidebarProperties.map(({ property, coords, source }) => (
                      <motion.div
                        key={property.id}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-white border-2 rounded-xl p-3 cursor-pointer transition-all ${
                          hoveredPropertyId === property.id
                            ? 'border-primary shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (mapRef.current) {
                            mapRef.current.flyTo(coords, 16, { duration: 0.8 });
                          }
                          setHoveredPropertyId(property.id);
                        }}
                        onMouseEnter={() => setHoveredPropertyId(property.id)}
                        onMouseLeave={() => setHoveredPropertyId(null)}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                            {property.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Home className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                              {property.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={property.listing_type === 'sale' ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
                              </Badge>
                              {source === 'market' && (
                                <Badge variant="outline" className="text-xs">
                                  تقديري
                                </Badge>
                              )}
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(property.price)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {property.location || 'موقع غير محدد'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      ))}
                      {visibleSidebarProperties.length < filteredMapProperties.length && (
                        <>
                          <div ref={loadMoreRef} className="col-span-2 py-2 text-center text-xs text-gray-400">
                            جاري التحميل التلقائي...
                          </div>
                          <div className="col-span-2 flex justify-center pb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleLoadMore}
                              className="px-4"
                            >
                              تحميل المزيد (+{Math.min(SIDEBAR_CHUNK, filteredMapProperties.length - visibleSidebarProperties.length)})
                            </Button>
                          </div>
                        </>
                      )}
                      {filteredMapProperties.length > 0 && visibleSidebarProperties.length >= filteredMapProperties.length && (
                        <div className="col-span-2 py-3 text-center text-xs text-gray-500">
                          تم عرض كل العقارات المطابقة
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}