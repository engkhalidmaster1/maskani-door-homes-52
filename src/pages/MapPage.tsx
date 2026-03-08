import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Search, X, List, Layers, TrendingUp, Home, Bed, MapPinned, Share2, Ruler, CircleDot } from 'lucide-react';
import { MapPropertyPopup } from '@/components/Map/MapPropertyPopup';
import { MapSidebar } from '@/components/Map/MapSidebar';
import { createPriceIcon, createUserLocationIcon } from '@/components/Map/PriceMarker';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import '@/styles/map-clusters.css';
import { MARKET_COORDINATES, resolveMarketValue } from '@/constants/markets';
import { formatCurrency } from '@/lib/utils';

// Fix default Leaflet icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [34.406075, 43.789876];
const DEFAULT_ZOOM = 12;

type MarkerSource = 'precise' | 'market';

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: 'sale' | 'rent';
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
  status?: string;
  furnished?: string | null;
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

interface MarkerData {
  property: Property;
  coords: [number, number];
  source: MarkerSource;
}

// ===== Helpers =====

const jitterFromId = (id: string): [number, number] => {
  const hash = Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return [((Math.sin(hash) + 1) / 2) * 0.002 - 0.001, ((Math.cos(hash) + 1) / 2) * 0.002 - 0.001];
};

const resolvePropertyPosition = (property: Property): MarkerData | null => {
  if (typeof property.latitude === 'number' && !isNaN(property.latitude) &&
      typeof property.longitude === 'number' && !isNaN(property.longitude)) {
    return { property, coords: [property.latitude, property.longitude], source: 'precise' };
  }
  const resolved = resolveMarketValue(
    property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined
  );
  if (resolved && MARKET_COORDINATES[resolved]) {
    const base = MARKET_COORDINATES[resolved];
    const [dLat, dLng] = jitterFromId(property.id);
    return { property, coords: [base[0] + dLat, base[1] + dLng], source: 'market' };
  }
  // Skip properties without any location data instead of placing them at default center
  return null;
};

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ===== Map sub-components =====

const AutoFitBounds = ({ positions, enabled }: { positions: [number, number][]; enabled: boolean }) => {
  const map = useMap();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || positions.length === 0) return;
    const key = positions.map(([a, b]) => `${a.toFixed(4)},${b.toFixed(4)}`).join('|');
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    if (positions.length === 1) {
      map.flyTo(positions[0], 16, { duration: 0.6 });
    } else {
      const bounds = L.latLngBounds(positions);
      if (bounds.isValid()) map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8, maxZoom: 16 });
    }
  }, [positions, map, enabled]);

  return null;
};

const HeatMapLayer = ({ positions, show }: { positions: [number, number][]; show: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (!show || positions.length === 0) return;
    // @ts-expect-error leaflet.heat
    const heat = L.heatLayer(positions, {
      radius: 25, blur: 35, maxZoom: 17, max: 1.0,
      gradient: { 0.0: '#3b82f6', 0.2: '#06b6d4', 0.4: '#10b981', 0.6: '#fbbf24', 0.8: '#f59e0b', 1.0: '#ef4444' },
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, positions, show]);
  return null;
};

const MapEventHandler = ({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => onBoundsChange(map.getBounds());
    map.on('moveend', handler);
    // Initial bounds
    onBoundsChange(map.getBounds());
    return () => { map.off('moveend', handler); };
  }, [map, onBoundsChange]);
  return null;
};

const FocusOnUserLocation = ({ userLocation }: { userLocation: [number, number] | null }) => {
  const map = useMap();
  if (!userLocation) return null;
  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '20px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => map.flyTo(userLocation, 16, { duration: 0.8 })}
          className="flex items-center justify-center bg-background hover:bg-primary/10 text-primary font-bold rounded-lg shadow-lg border-2 border-primary transition-all hover:scale-110"
          style={{ width: '44px', height: '44px' }}
          title="موقعي الحالي"
        >
          <MapPinned className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ===== Main Component =====

export function MapPage() {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedRef = useRef(false);
  const mapRef = useRef<L.Map | null>(null);

  // GPS state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Map state
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [fitBoundsEnabled, setFitBoundsEnabled] = useState(true);
  const [searchOnMove, setSearchOnMove] = useState(false);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'' | 'sale' | 'rent'>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'' | 'apartment' | 'house' | 'commercial'>('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<number | ''>('');
  const [minArea, setMinArea] = useState<number>(0);
  const [maxArea, setMaxArea] = useState<number>(500);
  const [statusFilter, setStatusFilter] = useState<'' | 'available' | 'negotiating'>('');
  const [bathroomsFilter, setBathroomsFilter] = useState<number | ''>('');
  const [furnishedFilter, setFurnishedFilter] = useState<'' | 'yes' | 'no'>('');
  const [nearMeEnabled, setNearMeEnabled] = useState(true);
  const [radiusKm, setRadiusKm] = useState(25);

  const debouncedSearch = useDebounce(searchTerm.trim().toLowerCase(), 300);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // ===== GPS =====
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let bestAccuracy = Infinity;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;
          setUserLocation([latitude, longitude]);
          setLocationAccuracy(accuracy);
        }
      },
      () => { /* silently handle GPS errors */ },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ===== URL params init =====
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
    const lt = searchParams.get('lt');
    if (lt === 'sale' || lt === 'rent') setListingTypeFilter(lt);
    const pt = searchParams.get('pt');
    if (pt === 'apartment' || pt === 'house' || pt === 'commercial') setPropertyTypeFilter(pt);
    const minP = searchParams.get('minPrice');
    if (minP) setMinPrice(Number(minP));
    const maxP = searchParams.get('maxPrice');
    if (maxP) setMaxPrice(Number(maxP));
    const bed = searchParams.get('bed');
    if (bed) setBedroomsFilter(Number(bed));
    const near = searchParams.get('near');
    if (near === '0') setNearMeEnabled(false);
    const r = searchParams.get('r');
    if (r) { const n = parseInt(r, 10); if (!isNaN(n) && n > 0 && n <= 200) setRadiusKm(n); }
    hasInitializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Sync URL =====
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    const p = new URLSearchParams();
    if (searchTerm) p.set('q', searchTerm);
    if (listingTypeFilter) p.set('lt', listingTypeFilter);
    if (propertyTypeFilter) p.set('pt', propertyTypeFilter);
    if (debouncedMinPrice !== '') p.set('minPrice', String(debouncedMinPrice));
    if (debouncedMaxPrice !== '') p.set('maxPrice', String(debouncedMaxPrice));
    if (bedroomsFilter !== '') p.set('bed', String(bedroomsFilter));
    p.set('near', nearMeEnabled ? '1' : '0');
    if (nearMeEnabled) p.set('r', String(radiusKm));
    setSearchParams(p, { replace: true });
  }, [searchTerm, listingTypeFilter, propertyTypeFilter, debouncedMinPrice, debouncedMaxPrice, bedroomsFilter, nearMeEnabled, radiusKm, setSearchParams]);

  // ===== Resolve markers =====
  const mapProperties = useMemo<MarkerData[]>(
    () => properties.map(resolvePropertyPosition).filter((x): x is MarkerData => x !== null),
    [properties]
  );

  // ===== Filter =====
  const filteredMapProperties = useMemo<MarkerData[]>(() => {
    let list = mapProperties;
    if (listingTypeFilter) list = list.filter((m) => m.property.listing_type === listingTypeFilter);
    if (propertyTypeFilter) list = list.filter((m) => m.property.property_type === propertyTypeFilter);
    if (minPrice !== '') list = list.filter((m) => m.property.price >= Number(minPrice));
    if (maxPrice !== '') list = list.filter((m) => m.property.price <= Number(maxPrice));
    if (bedroomsFilter !== '') list = list.filter((m) => m.property.bedrooms >= Number(bedroomsFilter));
    if (minArea > 0) list = list.filter((m) => (m.property.area ?? 0) >= minArea);
    if (maxArea < 500) list = list.filter((m) => (m.property.area ?? Infinity) <= maxArea);
    if (statusFilter) list = list.filter((m) => (m.property.status || 'available') === statusFilter);
    if (bathroomsFilter !== '') list = list.filter((m) => m.property.bathrooms >= Number(bathroomsFilter));
    if (furnishedFilter) list = list.filter((m) => m.property.furnished === furnishedFilter);
    if (debouncedSearch) {
      const s = debouncedSearch;
      list = list.filter((m) =>
        m.property.title?.toLowerCase().includes(s) ||
        m.property.location?.toLowerCase().includes(s) ||
        m.property.address?.toLowerCase().includes(s) ||
        m.property.property_code?.toLowerCase().includes(s)
      );
    }
    if (nearMeEnabled && userLocation) {
      const [ulat, ulng] = userLocation;
      list = list.filter(({ coords: [lat, lng] }) => haversineDistance(ulat, ulng, lat, lng) <= radiusKm);
      list = [...list].sort(({ coords: a }, { coords: b }) =>
        haversineDistance(ulat, ulng, a[0], a[1]) - haversineDistance(ulat, ulng, b[0], b[1])
      );
    }
    // Search as I move
    if (searchOnMove && visibleBounds) {
      list = list.filter(({ coords: [lat, lng] }) => visibleBounds.contains(L.latLng(lat, lng)));
    }
    return list;
  }, [mapProperties, listingTypeFilter, propertyTypeFilter, debouncedSearch, nearMeEnabled, userLocation, radiusKm, minPrice, maxPrice, bedroomsFilter, minArea, maxArea, statusFilter, bathroomsFilter, furnishedFilter, searchOnMove, visibleBounds]);

  // Disable auto-fit after first load
  useEffect(() => {
    if (filteredMapProperties.length > 0 && fitBoundsEnabled) {
      const timer = setTimeout(() => setFitBoundsEnabled(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [filteredMapProperties.length, fitBoundsEnabled]);

  const hasActiveFilters = searchTerm.trim().length > 0 || listingTypeFilter !== '' || propertyTypeFilter !== '' || minPrice !== '' || maxPrice !== '' || bedroomsFilter !== '' || minArea > 0 || maxArea < 500 || statusFilter !== '' || bathroomsFilter !== '' || furnishedFilter !== '';

  const clearAllFilters = () => {
    setSearchTerm(''); setListingTypeFilter(''); setPropertyTypeFilter('');
    setMinPrice(''); setMaxPrice(''); setBedroomsFilter('');
    setMinArea(0); setMaxArea(500); setStatusFilter('');
    setBathroomsFilter(''); setFurnishedFilter('');
  };

  // ===== Stats =====
  const stats = useMemo(() => {
    const prices = filteredMapProperties.map((m) => m.property.price);
    return {
      total: filteredMapProperties.length,
      forSale: filteredMapProperties.filter((m) => m.property.listing_type === 'sale').length,
      forRent: filteredMapProperties.filter((m) => m.property.listing_type === 'rent').length,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [filteredMapProperties]);

  // ===== Handlers =====
  const handleViewProperty = (id: string) => navigate(`/property/${id}`);
  const handleContactProperty = (property: Property) => {
    if (property.owner_phone) window.open(`tel:${property.owner_phone}`);
    else if (property.owner_email) window.open(`mailto:${property.owner_email}`);
  };

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setVisibleBounds(bounds);
  }, []);

  const handlePropertyClick = useCallback((coords: [number, number], propertyId: string) => {
    if (mapRef.current) mapRef.current.flyTo(coords, 16, { duration: 0.8 });
    setHoveredPropertyId(propertyId);
  }, []);

  // ===== Render =====
  return (
    <div className="min-h-screen bg-background">
      {/* ===== Filter Bar ===== */}
      <div className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-[1002]">
        <div className="container mx-auto px-3">
          <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between md:h-14 md:gap-3">
            {/* Search */}
            <div className="w-full md:flex-1 md:max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/60 w-4 h-4" />
                <Input
                  placeholder="البحث بالعنوان، الموقع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 h-10 text-sm bg-background text-foreground border-0 rounded-xl shadow-md w-full"
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {/* Listing type */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {(['sale', 'rent'] as const).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => setListingTypeFilter((p) => (p === type ? '' : type))}
                    className={`h-8 px-3 rounded-md text-xs transition ${
                      listingTypeFilter === type
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                  >
                    {type === 'sale' ? '💰 بيع' : '🏠 إيجار'}
                  </Button>
                ))}
              </div>

              {/* Property type */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {([
                  { key: 'apartment', icon: '🏢', label: 'شقة' },
                  { key: 'house', icon: '🏠', label: 'بيت' },
                  { key: 'commercial', icon: '🏪', label: 'محل' },
                ] as const).map(({ key, icon, label }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPropertyTypeFilter((p) => (p === key ? '' : key))}
                    className={`h-8 px-2.5 rounded-md text-xs transition ${
                      propertyTypeFilter === key
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                  >
                    {isMobile ? icon : `${icon} ${label}`}
                  </Button>
                ))}
              </div>

              {/* Bedrooms */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {[1, 2, 3, 4].map((n) => (
                  <Button
                    key={n}
                    variant="ghost"
                    size="sm"
                    onClick={() => setBedroomsFilter((p) => (p === n ? '' : n))}
                    className={`h-8 w-8 p-0 rounded-md text-xs transition ${
                      bedroomsFilter === n
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                    title={`${n}+ غرف`}
                  >
                    {n}+
                  </Button>
                ))}
                <Bed className="w-3.5 h-3.5 text-primary-foreground/60 mx-1 self-center" />
              </div>

              {/* Price */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 rounded-lg text-xs shrink-0 ${
                      minPrice !== '' || maxPrice !== ''
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground bg-primary-foreground/15 hover:bg-primary-foreground/25'
                    }`}
                  >
                    💰 السعر
                    {(minPrice !== '' || maxPrice !== '') && (
                      <Badge variant="secondary" className="mr-1 h-4 px-1 text-[9px]">✓</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 z-[2000]" align="start">
                  <PriceSliderContent
                    listingTypeFilter={listingTypeFilter}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    setMinPrice={setMinPrice}
                    setMaxPrice={setMaxPrice}
                  />
                </PopoverContent>
              </Popover>

              {/* Area */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 rounded-lg text-xs shrink-0 ${
                      minArea > 0 || maxArea < 500
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground bg-primary-foreground/15 hover:bg-primary-foreground/25'
                    }`}
                  >
                    <Ruler className="w-3 h-3 ml-1" />
                    المساحة
                    {(minArea > 0 || maxArea < 500) && (
                      <Badge variant="secondary" className="mr-1 h-4 px-1 text-[9px]">✓</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 z-[2000]" align="start">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-right">المساحة (م²)</h4>
                    <Slider
                      min={0}
                      max={500}
                      step={10}
                      value={[minArea, maxArea]}
                      onValueChange={([min, max]) => { setMinArea(min); setMaxArea(max); }}
                      className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{minArea} م²</span>
                      <span>{maxArea >= 500 ? '500+ م²' : `${maxArea} م²`}</span>
                    </div>
                    {(minArea > 0 || maxArea < 500) && (
                      <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => { setMinArea(0); setMaxArea(500); }}>
                        إعادة تعيين
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {([
                  { key: 'available', icon: '🟢', label: 'متاح' },
                  { key: 'negotiating', icon: '🟡', label: 'تفاوض' },
                ] as const).map(({ key, icon, label }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter((p) => (p === key ? '' : key))}
                    className={`h-8 px-2.5 rounded-md text-xs transition ${
                      statusFilter === key
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                  >
                    {isMobile ? icon : `${icon} ${label}`}
                  </Button>
                ))}
              </div>

              {/* Bathrooms */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {[1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    variant="ghost"
                    size="sm"
                    onClick={() => setBathroomsFilter((p) => (p === n ? '' : n))}
                    className={`h-8 w-8 p-0 rounded-md text-xs transition ${
                      bathroomsFilter === n
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                    title={`${n}+ حمام`}
                  >
                    {n}+
                  </Button>
                ))}
                <span className="text-[10px] text-primary-foreground/60 mx-1 self-center">🚿</span>
              </div>

              {/* Furnished */}
              <div className="flex rounded-lg p-0.5 bg-primary-foreground/15 backdrop-blur-sm shrink-0">
                {([
                  { key: 'yes', label: 'مفروش' },
                  { key: 'no', label: 'فارغ' },
                ] as const).map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFurnishedFilter((p) => (p === key ? '' : key))}
                    className={`h-8 px-2.5 rounded-md text-xs transition ${
                      furnishedFilter === key
                        ? 'bg-background text-foreground shadow'
                        : 'text-primary-foreground hover:bg-primary-foreground/20'
                    }`}
                  >
                    {key === 'yes' ? '🛋️' : '📦'} {!isMobile && label}
                  </Button>
                ))}
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-2 text-xs text-red-200 hover:bg-primary-foreground/20 shrink-0"
                >
                  <X className="w-3 h-3 ml-1" />
                  مسح
                </Button>
              )}

              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: 'بحث عقارات - سكني', url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url).then(() => {
                      toast({ title: '✅ تم نسخ رابط البحث', description: 'يمكنك لصقه ومشاركته', duration: 2000 });
                    });
                  }
                }}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
                title="مشاركة رابط البحث"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick Stats ===== */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold">{stats.total}</span>
                <span className="text-xs text-muted-foreground">عقار</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="w-2.5 h-2.5 ml-1" />
                {stats.forSale} بيع
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                {stats.forRent} إيجار
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant={showSidebar ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="gap-1.5 h-8 text-xs"
              >
                <List className="w-3.5 h-3.5" />
                {!isMobile && (showSidebar ? 'إخفاء' : 'القائمة')}
              </Button>
              <Button
                variant={showHeatMap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHeatMap(!showHeatMap)}
                className="gap-1.5 h-8 text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                {!isMobile && 'كثافة'}
              </Button>
              <Button
                size="sm"
                variant={searchOnMove ? 'default' : 'outline'}
                onClick={() => setSearchOnMove((v) => !v)}
                className="gap-1.5 h-8 text-xs"
              >
                <MapPinned className="w-3.5 h-3.5" />
                {!isMobile && (searchOnMove ? 'بحث مباشر' : 'بحث بالتحريك')}
              </Button>
              <Button
                size="sm"
                variant={nearMeEnabled ? 'default' : 'outline'}
                onClick={() => setNearMeEnabled((v) => !v)}
                className="h-8 text-xs px-2"
              >
                📍 {radiusKm}كم
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRadiusKm((r) => (r === 25 ? 50 : r === 50 ? 100 : r === 100 ? 10 : 25))}
                className="h-8 w-8 p-0 text-xs"
                title="تبديل نصف القطر"
              >
                🔄
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Map + Sidebar ===== */}
      <div className="h-[calc(100vh-170px)]">
        <div className="relative h-full w-full">
          {/* Low accuracy warning */}
          {userLocation && locationAccuracy && locationAccuracy > 200 && (
            <div className="absolute top-3 left-3 z-[1000] bg-destructive/10 border border-destructive/30 rounded-xl shadow p-2.5 max-w-[250px]">
              <p className="text-xs text-destructive font-medium">
                ⚠️ دقة GPS منخفضة ({Math.round(locationAccuracy)}م) — اخرج لمكان مفتوح
              </p>
            </div>
          )}

          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-full w-full"
            ref={mapRef}
          >
            {/* Satellite + Standard layers */}
            <LayersControl position="topleft">
              <LayersControl.BaseLayer checked name="خريطة عادية">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="📡 قمر صناعي">
                <TileLayer
                  attribution='&copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <AutoFitBounds positions={filteredMapProperties.map((m) => m.coords)} enabled={fitBoundsEnabled} />
            <HeatMapLayer positions={filteredMapProperties.map((m) => m.coords)} show={showHeatMap} />
            <FocusOnUserLocation userLocation={userLocation} />
            <MapEventHandler onBoundsChange={handleBoundsChange} />

            {/* User marker */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={createUserLocationIcon()} zIndexOffset={1000}>
                  <Popup>
                    <div className="text-center p-2 text-sm">
                      <strong className="text-primary">📍 موقعك</strong>
                      {locationAccuracy && (
                        <p className={`text-xs mt-1 ${locationAccuracy < 50 ? 'text-green-600' : locationAccuracy < 100 ? 'text-amber-600' : 'text-red-600'}`}>
                          دقة: {Math.round(locationAccuracy)}م
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                {locationAccuracy && (
                  <Circle
                    center={userLocation}
                    radius={locationAccuracy}
                    pathOptions={{
                      color: locationAccuracy < 50 ? '#10b981' : locationAccuracy < 100 ? '#f59e0b' : '#ef4444',
                      fillOpacity: 0.1, weight: 1, dashArray: '4,4',
                    }}
                  />
                )}
                {nearMeEnabled && (
                  <Circle
                    center={userLocation}
                    radius={radiusKm * 1000}
                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
                  />
                )}
              </>
            )}

            {/* Property markers with price chips */}
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              zoomToBoundsOnClick
              iconCreateFunction={(cluster) => {
                const count = cluster.getChildCount();
                const cls = count > 50 ? 'marker-cluster-large' : count > 10 ? 'marker-cluster-medium' : 'marker-cluster-small';
                return L.divIcon({
                  html: `<div><span>${count}</span></div>`,
                  className: `marker-cluster ${cls}`,
                  iconSize: L.point(40, 40),
                });
              }}
            >
              {filteredMapProperties.map(({ property, coords, source }) => (
                <Marker
                  key={property.id}
                  position={coords}
                  icon={createPriceIcon(property.price, property.listing_type, source === 'market', hoveredPropertyId === property.id)}
                  eventHandlers={{
                    mouseover: () => setHoveredPropertyId(property.id),
                    mouseout: () => setHoveredPropertyId(null),
                  }}
                >
                  <Popup>
                    <MapPropertyPopup
                      property={property}
                      isApproximate={source === 'market'}
                      onView={handleViewProperty}
                      onContact={handleContactProperty}
                    />
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>

          {/* Sidebar */}
          <MapSidebar
            items={filteredMapProperties}
            totalCount={filteredMapProperties.length}
            isLoading={propertiesLoading}
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            onPropertyClick={handlePropertyClick}
            hoveredPropertyId={hoveredPropertyId}
            onHover={setHoveredPropertyId}
            stats={{ minPrice: stats.minPrice, maxPrice: stats.maxPrice }}
          />
        </div>
      </div>
    </div>
  );
}

// ===== Price Slider sub-component =====

function PriceSliderContent({
  listingTypeFilter, minPrice, maxPrice, setMinPrice, setMaxPrice,
}: {
  listingTypeFilter: string;
  minPrice: number | '';
  maxPrice: number | '';
  setMinPrice: (v: number | '') => void;
  setMaxPrice: (v: number | '') => void;
}) {
  const isRent = listingTypeFilter === 'rent';
  const maxLimit = isRent ? 20_000_000 : 10_000_000_000;
  const step = isRent ? 50_000 : 5_000_000;
  const currentMin = minPrice === '' ? 0 : Number(minPrice);
  const currentMax = maxPrice === '' ? maxLimit : Number(maxPrice);

  const fmt = (p: number) => {
    if (p >= 1e9) return `${(p / 1e9).toFixed(1).replace(/\.0$/, '')} مليار`;
    if (p >= 1e6) return `${(p / 1e6).toFixed(1).replace(/\.0$/, '')} مليون`;
    if (p >= 1e3) return `${(p / 1e3).toFixed(0)} ألف`;
    return String(p);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">نطاق السعر</h4>
      <div className="flex justify-between text-xs font-semibold text-primary">
        <span>{fmt(currentMin)}</span>
        <span>{fmt(currentMax)}</span>
      </div>
      <Slider
        value={[currentMin, currentMax]}
        max={maxLimit}
        step={step}
        min={0}
        onValueChange={([min, max]) => { setMinPrice(min); setMaxPrice(max); }}
        className="py-3"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{fmt(maxLimit)}</span>
      </div>
    </div>
  );
}
