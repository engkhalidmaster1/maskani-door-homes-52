import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Map,
  Filter,
  Grid3X3,
  List,
  Settings,
  Download,
  Share2,
  Bookmark
} from 'lucide-react';
import { AdvancedGeoSearch } from '@/components/AdvancedGeoSearch';
import { InteractiveMap } from '@/components/InteractiveMap';
import { GeoCoordinate, GeoSearchResult, GeoBounds } from '@/services/geoSearchEngine';

interface SmartSearchPageProps {
  className?: string;
}

export const SmartSearchPage = React.memo(({ className }: SmartSearchPageProps) => {
  const [selectedLocation, setSelectedLocation] = useState<GeoCoordinate | null>(null);
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [searchBounds, setSearchBounds] = useState<GeoBounds | undefined>();
  const [selectedResult, setSelectedResult] = useState<GeoSearchResult | null>(null);
  const [activeView, setActiveView] = useState<'search' | 'map' | 'results'>('search');

  // Handle location selection from search or map
  const handleLocationSelect = useCallback((location: GeoCoordinate) => {
    setSelectedLocation(location);
  }, []);

  // Handle search results update
  const handleResultsChange = useCallback((results: GeoSearchResult[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      setActiveView('results');
    }
  }, []);

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds: GeoBounds) => {
    setSearchBounds(bounds);
  }, []);

  // Handle marker click on map
  const handleMarkerClick = useCallback((result: GeoSearchResult) => {
    setSelectedResult(result);
  }, []);

  // Save search results
  const handleSaveResults = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const dataStr = JSON.stringify(searchResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [searchResults]);

  // Share search results
  const handleShareResults = useCallback(async () => {
    if (navigator.share && searchResults.length > 0) {
      try {
        await navigator.share({
          title: 'نتائج البحث العقاري',
          text: `تم العثور على ${searchResults.length} عقار مطابق لمعايير البحث`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url);
    }
  }, [searchResults.length]);

  return (
    <div className={`container mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">البحث الجغرافي الذكي</h1>
          <p className="text-muted-foreground">
            ابحث عن العقارات باستخدام الموقع والخرائط التفاعلية
          </p>
        </div>
        
        {searchResults.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {searchResults.length} نتيجة
            </Badge>
            
            <Button variant="outline" size="sm" onClick={handleSaveResults}>
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShareResults}>
              <Share2 className="h-4 w-4 mr-2" />
              مشاركة
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="lg:col-span-1">
          <AdvancedGeoSearch
            onLocationSelect={handleLocationSelect}
            onResultsChange={handleResultsChange}
            initialLocation={selectedLocation || undefined}
            className="sticky top-6"
          />
        </div>

        {/* Results and Map Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs 
            value={activeView} 
            onValueChange={(value: string) => setActiveView(value as 'search' | 'map' | 'results')}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                البحث
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                الخريطة
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                النتائج ({searchResults.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    ابدأ البحث
                  </CardTitle>
                  <CardDescription>
                    استخدم لوحة البحث على اليسار لتحديد معايير البحث والموقع
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <div className="space-y-4">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">مرحباً بك في البحث الذكي</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        يمكنك البحث عن العقارات باستخدام الموقع الجغرافي، النطاق، والمرشحات المتقدمة
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Map className="h-4 w-4" />
                        بحث جغرافي
                      </div>
                      <div className="flex items-center gap-1">
                        <Filter className="h-4 w-4" />
                        مرشحات ذكية
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="h-4 w-4" />
                        نتائج مخصصة
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <InteractiveMap
                results={searchResults}
                center={selectedLocation || undefined}
                bounds={searchBounds}
                onLocationSelect={handleLocationSelect}
                onBoundsChange={handleBoundsChange}
                onMarkerClick={handleMarkerClick}
                height="600px"
              />
              
              {selectedResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>العقار المحدد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">{selectedResult.property.title}</h3>
                      <p className="text-muted-foreground">{selectedResult.property.description}</p>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {selectedResult.property.price?.toLocaleString()} دينار
                        </Badge>
                        <Badge variant="secondary">
                          {selectedResult.distance}م من الموقع
                        </Badge>
                        <Badge variant="outline">
                          نقاط الصلة: {Math.round(selectedResult.relevanceScore * 100)}%
                        </Badge>
                      </div>
                      {selectedResult.nearbyAmenities.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">المرافق القريبة:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedResult.nearbyAmenities.slice(0, 5).map((amenity) => (
                              <Badge key={amenity.id} variant="outline" className="text-xs">
                                {amenity.name} ({amenity.distance}م)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">نتائج البحث</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        شبكة
                      </Button>
                      <Button variant="outline" size="sm">
                        <List className="h-4 w-4 mr-2" />
                        قائمة
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {searchResults.map((result) => (
                      <Card 
                        key={result.property.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedResult?.property.id === result.property.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <h4 className="font-semibold text-lg">{result.property.title}</h4>
                              <p className="text-muted-foreground line-clamp-2">
                                {result.property.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {result.property.propertyType}
                                </Badge>
                                <Badge variant="secondary">
                                  {result.distance}م
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(result.relevanceScore * 100)}% مطابقة
                                </Badge>
                              </div>
                              
                              {result.matchedCriteria.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-sm text-muted-foreground">مطابق للمعايير:</span>
                                  {result.matchedCriteria.map((criteria, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {criteria}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {result.nearbyAmenities.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-sm font-medium">المرافق القريبة:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {result.nearbyAmenities.slice(0, 4).map((amenity) => (
                                      <Badge key={amenity.id} variant="outline" className="text-xs">
                                        {amenity.name} ({amenity.distance}م)
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right space-y-2">
                              <div className="text-2xl font-bold text-primary">
                                {result.property.price?.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">دينار</div>
                              
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm">
                                  <Bookmark className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد نتائج حتى الآن</h3>
                    <p className="text-muted-foreground">
                      استخدم لوحة البحث لإيجاد العقارات المناسبة
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
});