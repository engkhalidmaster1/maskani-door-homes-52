import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Building, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Properties = () => {
  const [filters, setFilters] = useState({
    type: "",
    market: "",
    floor: "",
  });

  // Sample properties data
  const properties = [
    {
      id: "1",
      title: "شقة فاخرة في مجمع الدور",
      type: "sale" as const,
      building: "١٢",
      apartment: "٣٠٤",
      floor: "الثالث",
      market: "السوق الأول",
      price: "٢٥٠،٠٠٠ دينار",
      icon: "home" as const,
    },
    {
      id: "2",
      title: "شقة جديدة في مجمع الدور",
      type: "rent" as const,
      building: "٧",
      apartment: "١٠١",
      floor: "الأول",
      market: "الفنادق",
      price: "٥٠٠،٠٠٠ دينار/سنوي",
      furnished: "yes" as const,
      icon: "building" as const,
    },
    {
      id: "3",
      title: "شقة عائلية في مجمع الدور",
      type: "sale" as const,
      building: "٢٣",
      apartment: "٥٠١",
      floor: "الخامس",
      market: "السوق الثاني",
      price: "٣٧٥،٠٠٠ دينار",
      icon: "house-user" as const,
    },
    {
      id: "4",
      title: "شقة مفروشة في مجمع الدور",
      type: "rent" as const,
      building: "١٥",
      apartment: "٢٠٢",
      floor: "الثاني",
      market: "السوق الخامس",
      price: "٤٠٠،٠٠٠ دينار/سنوي",
      furnished: "no" as const,
      icon: "building" as const,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Building className="h-6 w-6" />
          </div>
          جميع العقارات
        </h1>

        {/* Filters */}
        <Card className="p-6 mb-8 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">فلترة النتائج</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">للبيع</SelectItem>
                <SelectItem value="rent">للإيجار</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.market} onValueChange={(value) => setFilters({ ...filters, market: value })}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأسواق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market1">السوق الأول</SelectItem>
                <SelectItem value="market2">السوق الثاني</SelectItem>
                <SelectItem value="market3">السوق الثالث</SelectItem>
                <SelectItem value="market4">السوق الرابع</SelectItem>
                <SelectItem value="market5">السوق الخامس</SelectItem>
                <SelectItem value="market6">السوق السادس</SelectItem>
                <SelectItem value="hotels">الفنادق</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.floor} onValueChange={(value) => setFilters({ ...filters, floor: value })}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الطوابق" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i + 1} value={`floor${i + 1}`}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ type: "", market: "", floor: "" })}
            >
              مسح الفلاتر
            </Button>
          </div>
        </Card>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* No Results */}
        {properties.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground">جرب تعديل معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
};