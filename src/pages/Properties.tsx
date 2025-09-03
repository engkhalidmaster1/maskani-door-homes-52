import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter, Eye, EyeOff, Edit, Trash2, Home, User } from "lucide-react";
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

export const Properties = () => {
  const { user, isAdmin } = useAuth();
  const { properties, userProperties, isLoading, togglePropertyPublication, deleteProperty } = useProperties();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    listing_type: "" as "" | "sale" | "rent",
    location: "all",
    ownership_type: "all" as "all" | "ملك صرف" | "سر قفلية",
    price_range: "",
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      if (filters.listing_type && property.listing_type !== filters.listing_type) {
        return false;
      }
      if (filters.location && filters.location !== "all" && !property.location?.includes(filters.location)) {
        return false;
      }
      if (filters.ownership_type && filters.ownership_type !== "all" && property.ownership_type !== filters.ownership_type) {
        return false;
      }
      return true;
    });
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
            {/* Filters */}
            <Card className="p-6 shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectTrigger className="text-right" dir="rtl">
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

                <Select value={filters.ownership_type} onValueChange={(value) => setFilters({ ...filters, ownership_type: value as "all" | "ملك صرف" | "سر قفلية" })}>
                  <SelectTrigger className="text-right" dir="rtl">
                    <SelectValue placeholder="نوع التملك" className="text-right" />
                  </SelectTrigger>
                  <SelectContent className="text-right" dir="rtl">
                    <SelectItem value="all" className="text-right">جميع الأنواع</SelectItem>
                    <SelectItem value="ملك صرف" className="text-right">ملك صرف</SelectItem>
                    <SelectItem value="سر قفلية" className="text-right">سر قفلية</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ listing_type: "", location: "all", ownership_type: "all", price_range: "" })}
                >
                  مسح الفلاتر
                </Button>
              </div>
            </Card>

            {/* Properties Grid */}
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