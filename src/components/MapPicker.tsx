import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, RotateCcw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ar&countrycodes=sa`
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

export function MapPicker({ initialPosition, onLocationSelect, height = '400px' }: MapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialPosition || null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialPosition || [34.406075, 43.789876] // قضاء الدور, محافظة صلاح الدين, العراق
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapContainerStyle = useMemo<React.CSSProperties>(
    () => ({ height, width: '100%' }),
    [height]
  );

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
    const newPosition: [number, number] = [lat, lng];
    setSelectedPosition(newPosition);
    setMapCenter(newPosition);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <MapPin className="h-5 w-5" />
          تحديد موقع العقار على الخريطة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
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
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={resetLocation}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              إعادة تعيين
            </Button>
            <Label>انقر على الخريطة لتحديد الموقع</Label>
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
            <li>• انقر على أي مكان في الخريطة لتحديد موقع العقار</li>
            <li>• استخدم شريط البحث للعثور على مواقع محددة</li>
            <li>• يمكنك التكبير والتصغير باستخدام الماوس</li>
            <li>• الموقع المحدد سيظهر على شكل علامة حمراء</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}