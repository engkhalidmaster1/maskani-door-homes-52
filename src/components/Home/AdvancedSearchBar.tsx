import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, DollarSign, Bed, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  price: number;
  property_type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
}

interface AdvancedSearchBarProps {
  className?: string;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // جلب اقتراحات البحث الفورية
  const fetchSuggestions = useCallback(async () => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('id, title, price, property_type, location, bedrooms, bathrooms')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .ilike('title', `%${debouncedSearch}%`)
        .limit(5);

      // تطبيق الفلاتر
      if (propertyType !== 'all') {
        query = query.eq('property_type', propertyType);
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (bedrooms !== 'all') {
        query = query.eq('bedrooms', parseInt(bedrooms));
      }
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        query = query.gte('price', min);
        if (max) query = query.lte('price', max);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, propertyType, location, bedrooms, priceRange]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // البحث الكامل
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (propertyType !== 'all') params.set('type', propertyType);
    if (location) params.set('location', location);
    if (bedrooms !== 'all') params.set('bedrooms', bedrooms);
    if (priceRange !== 'all') params.set('priceRange', priceRange);

    navigate(`/properties?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPropertyType('all');
    setPriceRange('all');
    setLocation('');
    setBedrooms('all');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={cn("w-full relative", className)}>
      {/* شريط البحث الرئيسي */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* حقل البحث الرئيسي */}
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث عن عقار... (العنوان، المنطقة، الوصف)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pr-12 pl-4 h-12 text-lg rounded-xl border-gray-200 focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="مسح البحث"
                title="مسح البحث"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-12 px-4 rounded-xl"
            >
              <SlidersHorizontal className="h-5 w-5 ml-2" />
              فلاتر متقدمة
            </Button>
            <Button
              onClick={handleSearch}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Search className="h-5 w-5 ml-2" />
              بحث
            </Button>
          </div>
        </div>

        {/* الفلاتر المتقدمة */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* نوع العقار */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  نوع العقار
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="apartment">شقة</SelectItem>
                    <SelectItem value="villa">فيلا</SelectItem>
                    <SelectItem value="house">منزل</SelectItem>
                    <SelectItem value="land">أرض</SelectItem>
                    <SelectItem value="commercial">تجاري</SelectItem>
                    <SelectItem value="farm">مزرعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* الموقع */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  المنطقة
                </label>
                <Input
                  type="text"
                  placeholder="اسم المنطقة..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>

              {/* نطاق السعر */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  نطاق السعر
                </label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأسعار</SelectItem>
                    <SelectItem value="0-50000">أقل من 50,000</SelectItem>
                    <SelectItem value="50000-100000">50,000 - 100,000</SelectItem>
                    <SelectItem value="100000-200000">100,000 - 200,000</SelectItem>
                    <SelectItem value="200000-500000">200,000 - 500,000</SelectItem>
                    <SelectItem value="500000-1000000">500,000 - 1,000,000</SelectItem>
                    <SelectItem value="1000000-999999999">أكثر من 1,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* عدد الغرف */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  عدد الغرف
                </label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">أي عدد</SelectItem>
                    <SelectItem value="1">1 غرفة</SelectItem>
                    <SelectItem value="2">2 غرفة</SelectItem>
                    <SelectItem value="3">3 غرف</SelectItem>
                    <SelectItem value="4">4 غرف</SelectItem>
                    <SelectItem value="5">5+ غرف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نتائج البحث الفورية (Autocomplete) */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
          {!isLoading && suggestions.map((property) => (
            <button
              key={property.id}
              onClick={() => handleSuggestionClick(property.id)}
              className="w-full p-4 hover:bg-gray-50 transition-colors text-right border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{property.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {property.bedrooms} غرف
                    </span>
                    <span className="font-semibold text-primary">
                      {property.price.toLocaleString('ar-SA')} ريال
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div className="p-3 bg-gray-50 text-center">
            <Button
              variant="ghost"
              onClick={handleSearch}
              className="text-sm text-primary hover:text-primary/80"
            >
              عرض جميع النتائج
            </Button>
          </div>
        </div>
      )}

      {/* رسالة عند عدم وجود نتائج */}
      {showSuggestions && !isLoading && suggestions.length === 0 && debouncedSearch.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 text-center z-50">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">لم يتم العثور على نتائج</p>
          <p className="text-sm text-gray-500">جرب استخدام كلمات بحث مختلفة أو قم بتعديل الفلاتر</p>
        </div>
      )}

      {/* Overlay لإغلاق الاقتراحات */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
