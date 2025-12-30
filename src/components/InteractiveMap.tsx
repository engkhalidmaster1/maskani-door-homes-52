import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map as MapIcon, 
  Navigation, 
  Target, 
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin
} from 'lucide-react';
import { GeoCoordinate, GeoSearchResult, GeoBounds } from '@/services/geoSearchEngine';

interface InteractiveMapProps {
  results: GeoSearchResult[];
  center?: GeoCoordinate;
  bounds?: GeoBounds;
  onLocationSelect?: (location: GeoCoordinate) => void;
  onBoundsChange?: (bounds: GeoBounds) => void;
  onMarkerClick?: (result: GeoSearchResult) => void;
  className?: string;
  height?: string;
}

// Default center (Baghdad)
const DEFAULT_CENTER = { latitude: 33.3152, longitude: 44.3661 };

export const InteractiveMap = React.memo(({
  results = [],
  center = DEFAULT_CENTER,
  bounds,
  onLocationSelect,
  onBoundsChange,
  onMarkerClick,
  className,
  height = '400px'
}: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(12);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!mapRef.current) return;

        // Note: You'll need to add your Google Maps API key
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        // Load the Maps JavaScript API
        await (loader as unknown as { load: () => Promise<void> }).load();

        const mapOptions: google.maps.MapOptions = {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: mapZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        };

        const map = new google.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Add click listener for location selection
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng && onLocationSelect) {
            const location: GeoCoordinate = {
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng()
            };
            onLocationSelect(location);
          }
        });

        // Add bounds change listener
        map.addListener('bounds_changed', () => {
          const bounds = map.getBounds();
          if (bounds && onBoundsChange) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onBoundsChange({
              northeast: { latitude: ne.lat(), longitude: ne.lng() },
              southwest: { latitude: sw.lat(), longitude: sw.lng() }
            });
          }
        });

        // Add center change listener
        map.addListener('center_changed', () => {
          const center = map.getCenter();
          if (center) {
            setMapCenter({
              latitude: center.lat(),
              longitude: center.lng()
            });
          }
        });

        // Add zoom change listener
        map.addListener('zoom_changed', () => {
          setMapZoom(map.getZoom() || 12);
        });

        setIsMapLoaded(true);

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('فشل في تحميل الخريطة');
      }
    };

    initializeMap();
  }, [center.latitude, center.longitude, onLocationSelect, onBoundsChange, mapZoom]);

  // Update map markers when results change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    results.forEach((result, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: result.property.latitude,
          lng: result.property.longitude
        },
        map: mapInstanceRef.current,
        title: result.property.title,
        icon: {
          url: getMarkerIcon(result.property.propertyType || 'default'),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(result)
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onMarkerClick) {
          onMarkerClick(result);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if we have results
    if (results.length > 0 && bounds) {
      const mapBounds = new google.maps.LatLngBounds();
      results.forEach(result => {
        mapBounds.extend({
          lat: result.property.latitude,
          lng: result.property.longitude
        });
      });
      mapInstanceRef.current.fitBounds(mapBounds);
    }

  }, [results, isMapLoaded, bounds, onMarkerClick]);

  // Get marker icon based on property type
  const getMarkerIcon = (propertyType: string): string => {
    const iconMap: Record<string, string> = {
      'شقة': '/icons/apartment-marker.png',
      'بيت': '/icons/house-marker.png',
      'فيلا': '/icons/villa-marker.png',
      'مكتب': '/icons/office-marker.png',
      'محل تجاري': '/icons/shop-marker.png',
      'أرض': '/icons/land-marker.png',
      'default': '/icons/property-marker.png'
    };

    return iconMap[propertyType] || iconMap['default'];
  };

  // Create info window content
  const createInfoWindowContent = (result: GeoSearchResult): string => {
    return `
      <div style="padding: 8px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
          ${result.property.title}
        </h3>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
          ${result.property.address}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px;">
          <strong>${result.property.price?.toLocaleString()} دينار</strong>
        </p>
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #888;">
          المسافة: ${result.distance}م | نقاط الصلة: ${Math.round(result.relevanceScore * 100)}%
        </p>
        ${result.nearbyAmenities.length > 0 ? `
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">
            المرافق القريبة: ${result.nearbyAmenities.slice(0, 2).map(a => a.name).join(', ')}
          </p>
        ` : ''}
      </div>
    `;
  };

  // Get current location using GPS
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('جهازك لا يدعم خدمة تحديد الموقع (GPS)');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        console.log(`✓ GPS موقعك: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
        console.log(`✓ دقة الموقع: ${Math.round(position.coords.accuracy)} متر`);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({
            lat: location.latitude,
            lng: location.longitude
          });
          mapInstanceRef.current.setZoom(15);
        }

        if (onLocationSelect) {
          onLocationSelect(location);
        }
      },
      (error) => {
        let errorMessage = 'فشل في تحديد الموقع';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'يرجى السماح للتطبيق بالوصول إلى موقعك من إعدادات المتصفح';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متوفرة حالياً. تأكد من تفعيل GPS';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى';
            break;
        }
        
        console.error('GPS Error:', errorMessage, error);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,  // استخدام GPS بدقة عالية
        timeout: 10000,            // 10 ثواني
        maximumAge: 0              // طلب موقع جديد دائماً (لا تستخدم cache)
      }
    );
  }, [onLocationSelect]);

  // Center map on coordinates
  const centerMapOnLocation = useCallback((location: GeoCoordinate) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: location.latitude,
        lng: location.longitude
      });
      mapInstanceRef.current.setZoom(15);
    }
  }, []);

  // Zoom in
  const zoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  }, []);

  // Reset map view
  const resetView = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: DEFAULT_CENTER.latitude,
        lng: DEFAULT_CENTER.longitude
      });
      mapInstanceRef.current.setZoom(12);
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            الخريطة التفاعلية
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {results.length} عقار
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                title="موقعي الحالي"
              >
                <Navigation className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                title="تكبير"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                title="تصغير"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                title="إعادة تعيين العرض"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {mapError ? (
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">{mapError}</p>
              <p className="text-sm text-muted-foreground mt-1">
                يرجى التأكد من وجود اتصال بالإنترنت
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Map Container */}
            <div 
              ref={mapRef}
              style={{ height }}
              className="w-full rounded-lg border bg-muted"
            />

            {/* Map Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                الإحداثيات: {mapCenter.latitude.toFixed(4)}, {mapCenter.longitude.toFixed(4)}
              </div>
              <div>
                مستوى التكبير: {mapZoom}
              </div>
            </div>

            {/* Map Legend */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">دليل الرموز:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>شقة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>بيت</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>فيلا</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>مكتب</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});