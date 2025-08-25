import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
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

export const Properties = () => {
  const { user, isAdmin } = useAuth();
  const { properties, userProperties, isLoading, togglePropertyPublication, deleteProperty } = useProperties();
  const [filters, setFilters] = useState({
    listing_type: "",
    location: "",
    price_range: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (filters.listing_type && property.listing_type !== filters.listing_type) {
        return false;
      }
      if (filters.location && !property.location?.includes(filters.location)) {
        return false;
      }
      return true;
    });
  }, [properties, filters]);

  const PropertyActionButtons = ({ property, isOwner }: { property: any, isOwner: boolean }) => (
    <div className="flex gap-2 mt-4">
      {(isOwner || isAdmin) && (
        <>
          <Button
            size="sm"
            variant={property.is_published ? "secondary" : "default"}
            onClick={() => togglePropertyPublication(property.id, property.is_published)}
            className="gap-1"
          >
            {property.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {property.is_published ? "إلغاء النشر" : "نشر"}
          </Button>
          
          {isAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteProperty(property.id)}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          )}
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل العقارات...</p>
        </div>
      </div>
    );
  }

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

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">جميع العقارات</TabsTrigger>
            {user && <TabsTrigger value="my">عقاراتي</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">فلترة النتائج</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={filters.listing_type} onValueChange={(value) => setFilters({ ...filters, listing_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">للبيع</SelectItem>
                    <SelectItem value="rent">للإيجار</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المواقع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="السوق الأول">السوق الأول</SelectItem>
                    <SelectItem value="السوق الثاني">السوق الثاني</SelectItem>
                    <SelectItem value="السوق الثالث">السوق الثالث</SelectItem>
                    <SelectItem value="السوق الرابع">السوق الرابع</SelectItem>
                    <SelectItem value="السوق الخامس">السوق الخامس</SelectItem>
                    <SelectItem value="السوق السادس">السوق السادس</SelectItem>
                    <SelectItem value="الفنادق">الفنادق</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ listing_type: "", location: "", price_range: "" })}
                >
                  مسح الفلاتر
                </Button>
              </div>
            </Card>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden shadow-card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        property.listing_type === 'sale' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {property.bedrooms} غرف، {property.bathrooms} حمام
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{property.title}</h3>
                    <p className="text-muted-foreground mb-4">{property.location}</p>
                    
                    {property.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(property.price)}
                      </span>
                      {property.area && (
                        <span className="text-sm text-muted-foreground">
                          {property.area} م²
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

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
                {userProperties.map((property) => {
                  const isOwner = property.user_id === user.id;
                  return (
                    <Card key={property.id} className="overflow-hidden shadow-card hover-lift">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            property.listing_type === 'sale' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-warning/20 text-warning'
                          }`}>
                            {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            property.is_published
                              ? 'bg-success/20 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {property.is_published ? 'منشور' : 'غير منشور'}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">{property.title}</h3>
                        <p className="text-muted-foreground mb-4">{property.location}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(property.price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {property.bedrooms} غرف، {property.bathrooms} حمام
                          </span>
                        </div>

                        <PropertyActionButtons property={property} isOwner={isOwner} />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {userProperties.length === 0 && (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد عقارات</h3>
                  <p className="text-muted-foreground">ابدأ بإضافة عقارك الأول</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};