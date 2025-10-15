import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  MapPin, 
  Filter, 
  Target, 
  Navigation,
  Layers,
  Clock,
  Star,
  Settings,
  Map,
  List,
  Grid
} from 'lucide-react';
import { useGeoSearch } from '@/hooks/useGeoSearch';
import { GeoCoordinate, GeoSearchCriteria, GeoSearchResult } from '@/services/geoSearchEngine';

interface AdvancedGeoSearchProps {
  onLocationSelect?: (location: GeoCoordinate) => void;
  onResultsChange?: (results: GeoSearchResult[]) => void;
  initialLocation?: GeoCoordinate;
  className?: string;
}

export const AdvancedGeoSearch = React.memo(({ 
  onLocationSelect, 
  onResultsChange,
  initialLocation,
  className 
}: AdvancedGeoSearchProps) => {
  // Search hook
  const {
    results,
    isSearching,
    error,
    total,
    searchTime,
    search,
    searchWithinRadius,
    clearResults,
    suggestions,
    popularAreas,
    getSuggestions,
    loadMore,
    hasMore,
    currentCriteria
  } = useGeoSearch({
    enableAutoComplete: true,
    debounceMs: 300,
    defaultRadius: 5,
    cacheResults: true
  });

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoCoordinate | null>(
    initialLocation || null
  );
  const [radius, setRadius] = useState([5]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'relevance' | 'newest'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  // Property types options
  const propertyTypeOptions = [
    'شقة', 'بيت', 'فيلا', 'مكتب', 'محل تجاري', 'أرض', 'مستودع', 'مزرعة'
  ];

  // Features options
  const featureOptions = [
    'مصعد', 'موقف سيارات', 'حديقة', 'مسبح', 'جيم', 'أمن وحراسة', 
    'مولد كهرباء', 'إنترنت', 'تدفئة مركزية', 'مكيف', 'شرفة', 'مطبخ مجهز'
  ];

  // Update results when search results change
  useEffect(() => {
    if (onResultsChange && results) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  // Handle location detection
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setSelectedLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [onLocationSelect]);

  // Handle search query changes
  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    getSuggestions(value);
    setShowSuggestions(value.length > 2);
  }, [getSuggestions]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  }, []);

  // Handle popular area selection
  const handleAreaSelect = useCallback((area: { name: string; center: GeoCoordinate; count: number }) => {
    setSelectedLocation(area.center);
    setSearchQuery(area.name);
    if (onLocationSelect) {
      onLocationSelect(area.center);
    }
  }, [onLocationSelect]);

  // Handle property type toggle
  const handlePropertyTypeToggle = useCallback((type: string) => {
    setPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Handle feature toggle
  const handleFeatureToggle = useCallback((feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  }, []);

  // Handle search execution
  const handleSearch = useCallback(async () => {
    if (!selectedLocation) {
      // Try to get current location first
      getCurrentLocation();
      return;
    }

    const criteria: GeoSearchCriteria = {
      center: selectedLocation,
      radiusKm: radius[0],
      searchQuery: searchQuery.trim() || undefined,
      priceRange: {
        min: priceRange[0],
        max: priceRange[1]
      },
      propertyType: propertyTypes.length > 0 ? propertyTypes : undefined,
      features: features.length > 0 ? features : undefined
    };

    await search(criteria, {
      sortBy,
      includeAmenities: true,
      fuzzySearch: true
    });
  }, [selectedLocation, radius, searchQuery, priceRange, propertyTypes, features, sortBy, search, getCurrentLocation]);

  // Handle radius search
  const handleRadiusSearch = useCallback(async () => {
    if (!selectedLocation) return;
    
    await searchWithinRadius(selectedLocation, radius[0], {
      sortBy,
      includeAmenities: true
    });
  }, [selectedLocation, radius, sortBy, searchWithinRadius]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setPriceRange([0, 1000000]);
    setPropertyTypes([]);
    setFeatures([]);
    setRadius([5]);
    setSortBy('relevance');
    clearResults();
  }, [clearResults]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          البحث الجغرافي الذكي
        </CardTitle>
        <CardDescription>
          ابحث عن العقارات باستخدام الموقع والمرشحات المتقدمة
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">البحث</TabsTrigger>
            <TabsTrigger value="filters">المرشحات</TabsTrigger>
            <TabsTrigger value="results">النتائج ({total})</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-query">البحث النصي</Label>
              <div className="relative">
                <Input
                  id="search-query"
                  placeholder="ابحث عن عقار، منطقة، أو عنوان..."
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>الموقع المحدد</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-1"
                >
                  <Navigation className="h-4 w-4" />
                  موقعي الحالي
                </Button>
              </div>
              
              {selectedLocation && (
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Popular Areas */}
            <div className="space-y-3">
              <Label>المناطق الشائعة</Label>
              <div className="grid grid-cols-2 gap-2">
                {popularAreas.slice(0, 6).map((area, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAreaSelect(area)}
                    className="justify-start"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {area.name} ({area.count})
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Radius */}
            <div className="space-y-3">
              <Label>نطاق البحث: {radius[0]} كم</Label>
              <Slider
                value={radius}
                onValueChange={setRadius}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            {/* Price Range */}
            <div className="space-y-3">
              <Label>نطاق السعر: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} دينار</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={2000000}
                min={0}
                step={50000}
                className="w-full"
              />
            </div>

            {/* Property Types */}
            <div className="space-y-3">
              <Label>نوع العقار</Label>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={propertyTypes.includes(type)}
                      onCheckedChange={() => handlePropertyTypeToggle(type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>المزايا والخدمات</Label>
              <div className="grid grid-cols-2 gap-2">
                {featureOptions.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={features.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <Label htmlFor={`feature-${feature}`} className="text-sm">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>ترتيب حسب</Label>
              <Select 
                value={sortBy} 
                onValueChange={(value: 'distance' | 'price' | 'relevance' | 'newest') => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">الأكثر صلة</SelectItem>
                  <SelectItem value="distance">الأقرب للموقع</SelectItem>
                  <SelectItem value="price">السعر</SelectItem>
                  <SelectItem value="newest">الأحدث</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {/* Results Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {total} نتيجة
                </Badge>
                {searchTime > 0 && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {searchTime}ms
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-accent' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-accent' : ''}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={viewMode === 'map' ? 'bg-accent' : ''}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card key={result.property.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{result.property.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.property.address}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {result.distance}م
                          </Badge>
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            {(result.relevanceScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        {result.nearbyAmenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.nearbyAmenities.slice(0, 3).map((amenity) => (
                              <Badge key={amenity.id} variant="outline" className="text-xs">
                                {amenity.name} ({amenity.distance}م)
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {result.property.price?.toLocaleString()} دينار
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.property.propertyType}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isSearching}
                    className="w-full"
                  >
                    {isSearching ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </Button>
                )}
              </div>
            )}

            {/* No Results */}
            {results.length === 0 && !isSearching && currentCriteria && (
              <div className="text-center py-8 text-muted-foreground">
                لم يتم العثور على نتائج مطابقة لمعايير البحث
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !selectedLocation}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'جاري البحث...' : 'بحث'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetFilters}
          >
            <Settings className="h-4 w-4 mr-2" />
            إعادة تعيين
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});