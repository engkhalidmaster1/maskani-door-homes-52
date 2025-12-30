import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, MapPin } from "lucide-react";

interface SearchFilters {
  keyword: string;
  propertyType: string;
  listingType: string;
  location: string;
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  area: [number, number];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const AdvancedSearch = ({ onSearch, isVisible, onClose }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    propertyType: "",
    listingType: "",
    location: "",
    priceRange: [0, 1000000],
    bedrooms: "",
    bathrooms: "",
    area: [0, 500]
  });

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      propertyType: "",
      listingType: "",
      location: "",
      priceRange: [0, 1000000],
      bedrooms: "",
      bathrooms: "",
      area: [0, 500]
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث المتقدم
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق البحث المتقدم">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* الكلمة المفتاحية */}
          <div className="space-y-2">
            <Label htmlFor="keyword">الكلمة المفتاحية</Label>
            <Input
              id="keyword"
              placeholder="ابحث في العنوان أو الوصف..."
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>

          {/* نوع العقار ونوع الإعلان */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع العقار</Label>
              <Select value={filters.propertyType} onValueChange={(value) => setFilters({...filters, propertyType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العقار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="فيلا">فيلا</SelectItem>
                  <SelectItem value="شقة">شقة</SelectItem>
                  <SelectItem value="بيت شعبي">بيت شعبي</SelectItem>
                  <SelectItem value="استراحة">استراحة</SelectItem>
                  <SelectItem value="مزرعة">مزرعة</SelectItem>
                  <SelectItem value="أرض">أرض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع الإعلان</Label>
              <Select value={filters.listingType} onValueChange={(value) => setFilters({...filters, listingType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإعلان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">للبيع</SelectItem>
                  <SelectItem value="rent">للإيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الموقع */}
          <div className="space-y-2">
            <Label htmlFor="location">الموقع</Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="اختر الموقع..."
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="pr-10"
              />
            </div>
          </div>

          {/* نطاق السعر */}
          <div className="space-y-4">
            <Label>نطاق السعر (دينار عراقي)</Label>
            <div className="px-3">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters({...filters, priceRange: [value[0], value[1]]})}
                max={1000000}
                min={0}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{filters.priceRange[0].toLocaleString()} د.ع</span>
                <span>{filters.priceRange[1].toLocaleString()} د.ع</span>
              </div>
            </div>
          </div>

          {/* عدد الغرف والحمامات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عدد غرف النوم</Label>
              <Select value={filters.bedrooms} onValueChange={(value) => setFilters({...filters, bedrooms: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>عدد الحمامات</Label>
              <Select value={filters.bathrooms} onValueChange={(value) => setFilters({...filters, bathrooms: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="أي عدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* المساحة */}
          <div className="space-y-4">
            <Label>المساحة (متر مربع)</Label>
            <div className="px-3">
              <Slider
                value={filters.area}
                onValueChange={(value) => setFilters({...filters, area: [value[0], value[1]]})}
                max={500}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{filters.area[0]} م²</span>
                <span>{filters.area[1]} م²</span>
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSearch} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              بحث
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
