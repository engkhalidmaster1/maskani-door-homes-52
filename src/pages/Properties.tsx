import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter, Eye, EyeOff, Edit, Trash2, Home, User, Search, SlidersHorizontal, SortAsc, SortDesc, Grid3X3, List, MapPin, Ruler, Bed, Bath } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";

export const Properties = () => {
  const { user, isAdmin } = useAuth();
  const { properties, userProperties, isLoading, togglePropertyPublication, deleteProperty } = useProperties();
  const navigate = useNavigate();

  // حفظ تبويب العقارات الحالي في localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('properties_active_tab') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('properties_active_tab', activeTab);
  }, [activeTab]);

  const [filters, setFilters] = useState({
    listing_type: "" as "" | "sale" | "rent",
    location: "all",
    price_range: [0, 5000000] as [number, number],
    bedrooms: [] as number[],
    bathrooms: [] as number[],
    search: "",
    sort_by: "newest" as "newest" | "oldest" | "price_low" | "price_high" | "area",
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return localStorage.getItem('properties_view_mode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('properties_view_mode', viewMode);
  }, [viewMode]);

  const filteredProperties = useMemo(() => {
    const filtered = properties.filter(property => {
      // فلتر نوع العقار
      if (filters.listing_type && property.listing_type !== filters.listing_type) {
        return false;
      }

      // فلتر الموقع
      if (filters.location && filters.location !== "all" && !property.location?.includes(filters.location)) {
        return false;
      }

      // فلتر النطاق السعري
      if (property.price < filters.price_range[0] || property.price > filters.price_range[1]) {
        return false;
      }

      // فلتر عدد الغرف
      if (filters.bedrooms.length > 0 && !filters.bedrooms.includes(property.bedrooms)) {
        return false;
      }

      // فلتر عدد الحمامات
      if (filters.bathrooms.length > 0 && !filters.bathrooms.includes(property.bathrooms)) {
        return false;
      }

      // البحث النصي
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          property.title,
          property.description,
          property.location,
          property.address,
          property.marketLabel
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    // الترتيب
    filtered.sort((a, b) => {
      switch (filters.sort_by) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'area':
          return (b.area || 0) - (a.area || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [properties, filters]);

  const handleEdit = (propertyId: string) => {
    navigate(`/edit-property/${propertyId}`);
  };

  const handleDelete = (propertyId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deleteProperty(propertyId);
    }
  };

  const handleTogglePublication = (propertyId: string, currentStatus: boolean) => {
    togglePropertyPublication(propertyId, currentStatus);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Building className="h-6 w-6" />
          </div>
          العقارات
        </h1>

  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-white p-1 shadow-lg border border-gray-200">
              <TabsTrigger 
                value="all" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 gap-2 min-w-[140px]"
              >
                <Home className="h-4 w-4" />
                جميع العقارات
              </TabsTrigger>
              {user && (
                <TabsTrigger 
                  value="my" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 gap-2 min-w-[140px]"
                >
                  <User className="h-4 w-4" />
                  عقاراتي
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            {/* Search Bar */}
            <Card className="p-4 shadow-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="ابحث في العنوان، الموقع، الوصف..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-primary"
                  dir="rtl"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-6 shadow-card">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Basic Filters */}
                <div className="flex flex-wrap gap-3 flex-1">
                  {/* نوع العقار: بيع أو إيجار */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 font-bold transition-all shadow-sm ${
                        filters.listing_type === "sale" 
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-md border-red-600" 
                          : "hover:bg-red-100 text-red-600 border-red-300 hover:text-red-700"
                      }`}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        listing_type: prev.listing_type === "sale" ? "" : "sale" 
                      }))}
                    >
                      للبيع
                    </Button>
                    <Button
                      variant="outline"
                      className={`flex-1 font-bold transition-all shadow-sm ${
                        filters.listing_type === "rent" 
                          ? "bg-green-500 hover:bg-green-600 text-white shadow-md border-green-600" 
                          : "hover:bg-green-100 text-green-600 border-green-300 hover:text-green-700"
                      }`}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        listing_type: prev.listing_type === "rent" ? "" : "rent" 
                      }))}
                    >
                      للإيجار
                    </Button>
                  </div>

                  <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
                    <SelectTrigger className="text-right w-48" dir="rtl">
                      <SelectValue placeholder="جميع المواقع" className="text-right" />
                    </SelectTrigger>
                    <SelectContent className="text-right" dir="rtl">
                      <SelectItem value="all" className="text-right">كل المواقع</SelectItem>
                      <SelectItem value="السوق الأول" className="text-right">السوق الأول</SelectItem>
                      <SelectItem value="السوق الثاني" className="text-right">السوق الثاني</SelectItem>
                      <SelectItem value="السوق الثالث" className="text-right">السوق الثالث</SelectItem>
                      <SelectItem value="السوق الرابع" className="text-right">السوق الرابع</SelectItem>
                      <SelectItem value="السوق الخامس" className="text-right">السوق الخامس</SelectItem>
                      <SelectItem value="السوق السادس" className="text-right">السوق السادس</SelectItem>
                      <SelectItem value="الفنادق" className="text-right">الفنادق</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Options */}
                  <Select
                    value={filters.sort_by}
                    onValueChange={(value: "newest" | "oldest" | "price_low" | "price_high" | "area") =>
                      setFilters({ ...filters, sort_by: value })
                    }
                  >
                    <SelectTrigger className="text-right w-48" dir="rtl">
                      <SelectValue placeholder="ترتيب حسب" className="text-right" />
                    </SelectTrigger>
                    <SelectContent className="text-right" dir="rtl">
                      <SelectItem value="newest" className="text-right flex items-center gap-2">
                        <SortDesc className="h-4 w-4" />
                        الأحدث
                      </SelectItem>
                      <SelectItem value="oldest" className="text-right flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        الأقدم
                      </SelectItem>
                      <SelectItem value="price_low" className="text-right">السعر: من الأقل للأعلى</SelectItem>
                      <SelectItem value="price_high" className="text-right">السعر: من الأعلى للأقل</SelectItem>
                      <SelectItem value="area" className="text-right">المساحة</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ 
                      listing_type: "", 
                      location: "all", 
                      price_range: [0, 5000000],
                      bedrooms: [],
                      bathrooms: [],
                      search: "",
                      sort_by: "newest"
                    })}
                    className="px-6"
                  >
                    مسح الكل
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <CollapsibleContent className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-right block">النطاق السعري (دينار عراقي)</Label>
                      <div className="px-3">
                        <Slider
                          value={filters.price_range}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, price_range: value as [number, number] }))}
                          max={5000000}
                          min={0}
                          step={50000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <span>{filters.price_range[0].toLocaleString('ar-IQ')}</span>
                          <span>{filters.price_range[1].toLocaleString('ar-IQ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bedrooms */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-right block">عدد الغرف</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <Button
                            key={num}
                            variant={filters.bedrooms.includes(num) ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              bedrooms: prev.bedrooms.includes(num)
                                ? prev.bedrooms.filter(b => b !== num)
                                : [...prev.bedrooms, num]
                            }))}
                            className="flex-1 min-w-[60px]"
                          >
                            {num === 5 ? "5+" : num}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-right block">عدد الحمامات</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map(num => (
                          <Button
                            key={num}
                            variant={filters.bathrooms.includes(num) ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              bathrooms: prev.bathrooms.includes(num)
                                ? prev.bathrooms.filter(b => b !== num)
                                : [...prev.bathrooms, num]
                            }))}
                            className="flex-1 min-w-[60px]"
                          >
                            {num === 4 ? "4+" : num}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-right block">النتائج</Label>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{filteredProperties.length}</div>
                        <div className="text-sm text-gray-600">عقار متاح</div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Properties Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property}
                    showActions={user && (property.user_id === user.id || isAdmin)}
                    onEdit={user && (property.user_id === user.id || isAdmin) ? handleEdit : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                    onTogglePublication={user && (property.user_id === user.id || isAdmin) ? handleTogglePublication : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="p-4 hover-lift shadow-md">
                    <div className="flex gap-4">
                      {/* Property Image */}
                      <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        {property.images?.[0] ? (
                          <LazyImage
                            src={getOptimizedImageUrl(property.images[0], 'small')}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                            <Building className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Property Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-1" dir="rtl">
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              {property.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 ml-1" />
                                  <span>{property.location}</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-xl font-bold text-primary">
                              {formatCurrency(property.price)}
                            </span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          {property.area && (
                            <div className="flex items-center">
                              <Ruler className="h-4 w-4 ml-1" />
                              <span>{property.area} م²</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 ml-1" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 ml-1" />
                            <span>{property.bathrooms}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <Button
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="flex-1 mr-2"
                          >
                            عرض التفاصيل
                          </Button>
                          
                          {user && (property.user_id === user.id || isAdmin) && (
                            <div className="flex gap-1">
                              {onEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(property.id);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onTogglePublication && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublication(property.id, property.is_published);
                                  }}
                                >
                                  {property.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(property.id);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد عقارات</h3>
                <p className="text-muted-foreground">جرب تعديل معايير البحث</p>
              </div>
            )}
          </TabsContent>

          {user && (
            <TabsContent value="my" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property}
                    showActions={true}
                    onEdit={handleEdit}
                    onDelete={isAdmin ? handleDelete : undefined}
                    onTogglePublication={handleTogglePublication}
                  />
                ))}
              </div>

              {userProperties.length === 0 && (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد عقارات</h3>
                  <p className="text-muted-foreground">ابدأ بإضافة عقارك الأول</p>
                  <Button 
                    onClick={() => navigate('/add-property')} 
                    className="mt-4"
                  >
                    إضافة عقار جديد
                  </Button>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};