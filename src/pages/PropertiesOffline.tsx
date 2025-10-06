import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter, Wifi, WifiOff, RefreshCw, Plus } from "lucide-react";
import { usePropertiesOffline } from "@/hooks/usePropertiesOffline";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import {
  MARKET_KEYWORDS,
  MARKET_OPTIONS,
  MarketValue,
  normalizeArabicText,
  resolveMarketValue,
} from "@/constants/markets";

type ListingTypeFilter = "all" | "sale" | "rent";
type OwnershipTypeFilter = "all" | "ملك صرف" | "سر قفلية";
type LocationFilter = "all" | MarketValue;

const LOCATION_OPTIONS: Array<{ value: LocationFilter; label: string }> = [
  { value: "all", label: "جميع المواقع" },
  ...MARKET_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const LOCATION_KEYWORDS: Record<LocationFilter, string[]> = {
  all: [],
  ...MARKET_OPTIONS.reduce((acc, option) => {
    acc[option.value] = MARKET_KEYWORDS[option.value];
    return acc;
  }, {} as Record<MarketValue, string[]>),
};

const LOCATION_KEYWORDS_NORMALIZED: Record<LocationFilter, string[]> = Object.fromEntries(
  (Object.entries(LOCATION_KEYWORDS) as Array<[LocationFilter, string[]]>).map(([key, keywords]) => [
    key,
    keywords.map((keyword) => normalizeArabicText(keyword)),
  ])
) as Record<LocationFilter, string[]>;

export const PropertiesOffline = () => {
  const { user } = useAuth();
  const { 
    properties, 
    userProperties, 
    isLoading, 
    isOnline,
    fetchProperties,
    syncUnsyncedData
  } = usePropertiesOffline();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<{
    listing_type: ListingTypeFilter;
    location: LocationFilter;
    ownership_type: OwnershipTypeFilter;
    price_range: string;
  }>({
    listing_type: "all",
    location: "all",
    ownership_type: "all",
    price_range: "",
  });

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesListingType =
        filters.listing_type === "all" || property.listing_type === filters.listing_type;

      const matchesLocation = (() => {
        if (filters.location === "all") {
          return true;
        }

        const normalizedSelectedLocation = normalizeArabicText(filters.location);
  const resolvedMarket = resolveMarketValue(property.market ?? property.location ?? null);

        if (resolvedMarket && resolvedMarket === filters.location) {
          return true;
        }

        const keywords = LOCATION_KEYWORDS_NORMALIZED[filters.location];

        const searchableFields = [
          property.market,
          property.location,
          property.address,
          property.title,
          property.description,
        ]
          .filter((field): field is string => typeof field === "string" && field.trim().length > 0)
          .map((field) => normalizeArabicText(field));

        if (resolvedMarket) {
          searchableFields.push(normalizeArabicText(resolvedMarket));
        }

        if (!searchableFields.length) {
          return false;
        }

        if (searchableFields.some((field) => field.includes(normalizedSelectedLocation))) {
          return true;
        }

        return keywords.some((keyword) =>
          searchableFields.some((field) => field.includes(keyword))
        );
      })();

      const matchesOwnershipType =
        filters.ownership_type === "all" || property.ownership_type === filters.ownership_type;

      return matchesListingType && matchesLocation && matchesOwnershipType;
    });
  }, [properties, filters]);

  const handleRefresh = async () => {
    if (isOnline) {
      await fetchProperties();
      await syncUnsyncedData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header مع مؤشر حالة الاتصال */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Building className="h-8 w-8" />
            العقارات
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "متصل" : "غير متصل"}
            </Badge>
            {!isOnline && (
              <Badge variant="outline" className="text-xs">
                يعمل دون اتصال بالإنترنت
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {isOnline && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          )}
          
          {user && (
            <Button
              onClick={() => navigate("/add-property")}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة عقار
            </Button>
          )}
        </div>
      </div>

      {/* الفلاتر */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">فلترة العقارات</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 font-bold transition-all shadow-sm ${
                filters.listing_type === "all"
                  ? "bg-gray-500 hover:bg-gray-600 text-white shadow-md border-gray-600"
                  : "hover:bg-gray-100 text-gray-600 border-gray-300 hover:text-gray-700"
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, listing_type: "all" }))}
            >
              الكل
            </Button>
            <Button
              variant="outline"
              className={`flex-1 font-bold transition-all shadow-sm ${
                filters.listing_type === "sale"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md border-red-600"
                  : "hover:bg-red-100 text-red-600 border-red-300 hover:text-red-700"
              }`}
              onClick={() => setFilters((prev) => ({ ...prev, listing_type: "sale" }))}
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
              onClick={() => setFilters((prev) => ({ ...prev, listing_type: "rent" }))}
            >
              للإيجار
            </Button>
          </div>

          <Select
            value={filters.location}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, location: value as LocationFilter }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.ownership_type}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, ownership_type: value as OwnershipTypeFilter }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="نوع الملكية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="ملك صرف">ملك صرف</SelectItem>
              <SelectItem value="سر قفلية">سر قفلية</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() =>
              setFilters({
                listing_type: "all",
                location: "all",
                ownership_type: "all",
                price_range: "",
              })
            }
            variant="outline"
          >
            مسح الفلاتر
          </Button>
        </div>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">جميع العقارات</TabsTrigger>
          {user && <TabsTrigger value="mine">عقاراتي</TabsTrigger>}
        </TabsList>

        <TabsContent value="all">
          {/* رسالة عدم الاتصال */}
          {!isOnline && (
            <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2 text-orange-800">
                <WifiOff className="h-5 w-5" />
                <div>
                  <p className="font-medium">تعمل حالياً دون اتصال بالإنترنت</p>
                  <p className="text-sm">يتم عرض العقارات المحفوظة محلياً. ستتم مزامنة البيانات الجديدة عند عودة الاتصال.</p>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property}
                  isOffline={!isOnline}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد عقارات متاحة
              </h3>
              <p className="text-gray-600 mb-4">
                {!isOnline 
                  ? "لا توجد عقارات محفوظة محلياً. تحتاج للاتصال بالإنترنت لتحميل العقارات."
                  : "لم يتم العثور على عقارات تطابق معايير البحث المحددة."
                }
              </p>
              {!isOnline && (
                <Button variant="outline" disabled>
                  يتطلب اتصال بالإنترنت
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="mine">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">عقاراتي ({userProperties.length})</h2>
              <Button onClick={() => navigate("/add-property")}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عقار جديد
              </Button>
            </div>

            {userProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property}
                    isOwner={true}
                    isOffline={!isOnline}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لم تضف أي عقارات بعد
                </h3>
                <p className="text-gray-600 mb-4">
                  ابدأ بإضافة عقارك الأول ليتمكن العملاء من العثور عليه
                </p>
                <Button onClick={() => navigate("/add-property")}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عقار الآن
                </Button>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
