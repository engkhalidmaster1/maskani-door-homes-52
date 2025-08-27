import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
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
    listing_type: "",
    location: "",
    price_range: "",
  });

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