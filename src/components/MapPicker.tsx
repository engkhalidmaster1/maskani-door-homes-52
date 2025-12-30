import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, RotateCcw, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GOVERNORATE_BOUNDS,
  isLocationInGovernorate,
  getGovernorateName,
  type GovernorateType
} from '@/components/Property/AddProperty/GovernorateSection';

// إصلاح أيقونات Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  height?: string;
  governorate?: GovernorateType | '';
}

// مكون للتعامل مع نقرات الخريطة
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return null;
};

// الحصول على اسم المكان من الإحداثيات (Reverse Geocoding مجاني)
const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ar`
    );
    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('خطأ في الحصول على العنوان:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// البحث عن مكان (Geocoding مجاني)
interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

const searchLocation = async (query: string): Promise<{ lat: number; lng: number; name: string }[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ar&countrycodes=iq`
    );
    const data = await response.json() as NominatimSearchResult[];

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name
    }));
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return [];
  }
};

export function MapPicker({
  initialPosition,
  onLocationSelect,
  height = '400px',
  governorate
}: MapPickerProps) {
  const { toast } = useToast();

  // تحديد المركز الافتراضي بناءً على المحافظة المختارة
  const getInitialCenter = (): [number, number] => {
    if (initialPosition) return initialPosition;
    if (governorate && GOVERNORATE_BOUNDS[governorate]) {
      const { center } = GOVERNORATE_BOUNDS[governorate];
      return [center.lat, center.lng];
    }
    return [36.1911, 44.0094]; // أربيل كافتراضي
  };

  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialPosition || null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialCenter());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapContainerStyle = useMemo<React.CSSProperties>(
    () => ({ height, width: '100%' }),
    [height]
  );

  // تحريك الخريطة عند تغيير المحافظة
  useEffect(() => {
    if (governorate && GOVERNORATE_BOUNDS[governorate]) {
      const { center } = GOVERNORATE_BOUNDS[governorate];
      setMapCenter([center.lat, center.lng]);
    }
  }, [governorate]);

  // تحديث العنوان عند تغيير الموقع
  useEffect(() => {
    if (selectedPosition) {
      getAddressFromCoordinates(selectedPosition[0], selectedPosition[1])
        .then(address => {
          setSelectedAddress(address);
          onLocationSelect(selectedPosition[0], selectedPosition[1], address);
        });
    }
  }, [selectedPosition, onLocationSelect]);

  const handleLocationSelect = (lat: number, lng: number) => {
    // التحقق من اختيار المحافظة أولاً
    if (!governorate) {
      toast({
        title: "⚠️ يرجى اختيار المحافظة أولاً",
        description: "اختر المحافظة من القائمة قبل تحديد الموقع على الخريطة",
        variant: "destructive"
      });
      return;
    }

    // التحقق من أن الموقع ضمن حدود المحافظة المختارة
    if (!isLocationInGovernorate(lat, lng, governorate)) {
      const governorateName = getGovernorateName(governorate);
      toast({
        title: `❌ الموقع خارج حدود ${governorateName}`,
        description: `الموقع الذي اخترته ليس داخل حدود ${governorateName}. يرجى اختيار موقع داخل المحافظة المحددة.`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // إذا كان الموقع صحيح، تابع
    const newPosition: [number, number] = [lat, lng];
    setSelectedPosition(newPosition);
    setMapCenter(newPosition);

    // رسالة نجاح
    toast({
      title: "✅ تم تحديد الموقع",
      description: `الموقع داخل حدود ${getGovernorateName(governorate)}`,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: { lat: number; lng: number; name: string }) => {
    handleLocationSelect(result.lat, result.lng);
    setSearchResults([]);
    setSearchQuery('');
  };

  const resetLocation = () => {
    setSelectedPosition(null);
    setSelectedAddress('');
    setSearchResults([]);
  };

  // استخدام GPS لتحديد الموقع الحالي
  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: "غير مدعوم",
        description: "جهازك لا يدعم خدمة تحديد الموقع (GPS)",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingGPS(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // التحقق من الموقع قبل تعيينه
        handleLocationSelect(latitude, longitude);
        setIsLoadingGPS(false);

        console.log(`✓ GPS موقعك: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        console.log(`✓ دقة الموقع: ${Math.round(accuracy)} متر`);
      },
      (error) => {
        setIsLoadingGPS(false);
        let errorMessage = 'فشل في تحديد الموقع';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'يرجى السماح للتطبيق بالوصول إلى موقعك من إعدادات المتصفح';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متوفرة. تأكد من تفعيل GPS في جهازك';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى';
            break;
        }

        console.error('GPS Error:', errorMessage, error);

        toast({
          title: "خطأ في تحديد الموقع",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <MapPin className="h-5 w-5" />
          تحديد موقع العقار على الخريطة
          {governorate && (
            <span className="text-sm font-normal text-gray-600">
              ({getGovernorateName(governorate)})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* تنبيه إذا لم يتم اختيار محافظة */}
        {!governorate && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-right">
            <p className="text-amber-800 font-medium flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              يرجى اختيار المحافظة أولاً من القائمة أعلاه قبل تحديد الموقع
            </p>
          </div>
        )}

        {/* شريط البحث */}
        <div className="space-y-2">
          <Label>البحث عن موقع</Label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مدينة، حي، أو عنوان..."
              className="text-right"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={!governorate}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !governorate}
              className="shrink-0"
            >
              {isSearching ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* نتائج البحث */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="p-2 border rounded cursor-pointer hover:bg-gray-50 text-right text-sm"
              >
                {result.name}
              </div>
            ))}
          </div>
        )}

        {/* الخريطة */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetLocation}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                إعادة تعيين
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={useCurrentLocation}
                disabled={isLoadingGPS || !governorate}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
              >
                {isLoadingGPS ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    <span>جاري التحديد...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-3 w-3" />
                    <span>موقعي الحالي</span>
                  </>
                )}
              </Button>
            </div>

            <Label>أو انقر على الخريطة</Label>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
              style={mapContainerStyle}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationPicker onLocationSelect={handleLocationSelect} />

              {selectedPosition && (
                <Marker position={selectedPosition} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* عرض الموقع المحدد */}
        {selectedPosition && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">الموقع المحدد:</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <div>الإحداثيات: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}</div>
              {selectedAddress && (
                <div>العنوان: {selectedAddress}</div>
              )}
            </div>
          </div>
        )}

        {/* تعليمات */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md text-right">
          <p className="font-medium mb-1">كيفية استخدام الخريطة:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-1">
              <Navigation className="h-3 w-3 text-green-600" />
              <strong>GPS:</strong> اضغط "موقعي الحالي" لتحديد موقعك تلقائياً
            </li>
            <li>• <strong>النقر:</strong> انقر في أي مكان على الخريطة</li>
            <li>• <strong>البحث:</strong> استخدم شريط البحث للعثور على عنوان</li>
            <li className="text-amber-700 font-medium mt-2">
              ⚠️ يمكنك تحديد موقع فقط داخل حدود المحافظة المختارة
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}