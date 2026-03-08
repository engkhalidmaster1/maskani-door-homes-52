import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

      if (propertyType !== 'all') query = query.eq('property_type', propertyType);
      if (location) query = query.ilike('location', `%${location}%`);
      if (bedrooms !== 'all') query = query.eq('bedrooms', parseInt(bedrooms));
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
    if (e.key === 'Enter') handleSearch();
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
      {/* Main search bar */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-lg border border-border p-3 md:p-4">
        {/* Search input + buttons */}
        <div className="flex flex-col gap-2.5 md:gap-3">
          <div className="relative">
            <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن عقار... (العنوان، المنطقة، الوصف)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pr-10 md:pr-12 pl-10 h-10 md:h-12 text-sm md:text-lg rounded-lg md:rounded-xl border-border focus:ring-2 focus:ring-primary bg-background"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
          </div>

          {/* Buttons row - side by side on mobile */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-9 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl flex-1 md:flex-none text-xs md:text-sm"
            >
              <SlidersHorizontal className="h-4 w-4 ml-1 md:ml-2" />
              فلاتر متقدمة
            </Button>
            <Button
              onClick={handleSearch}
              className="h-9 md:h-12 px-4 md:px-8 rounded-lg md:rounded-xl flex-1 md:flex-none text-xs md:text-sm"
            >
              <Search className="h-4 w-4 ml-1 md:ml-2" />
              بحث
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
                  {/* Property type */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      نوع العقار
                    </label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="h-9 md:h-10 rounded-lg text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="apartment">شقة</SelectItem>
                        <SelectItem value="house">بيت</SelectItem>
                        <SelectItem value="commercial">تجاري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      المنطقة
                    </label>
                    <Input
                      type="text"
                      placeholder="اسم المنطقة..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-9 md:h-10 rounded-lg text-xs md:text-sm"
                    />
                  </div>

                  {/* Price range */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      نطاق السعر
                    </label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="h-9 md:h-10 rounded-lg text-xs md:text-sm">
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

                  {/* Bedrooms */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5" />
                      عدد الغرف
                    </label>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger className="h-9 md:h-10 rounded-lg text-xs md:text-sm">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
          {!isLoading && suggestions.map((property) => (
            <button
              key={property.id}
              onClick={() => handleSuggestionClick(property.id)}
              className="w-full p-3 md:p-4 hover:bg-muted/50 transition-colors text-right border-b border-border last:border-0"
            >
              <div className="flex items-start gap-2.5 md:gap-3">
                <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg shrink-0">
                  <Home className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-card-foreground text-sm md:text-base mb-0.5 truncate">{property.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
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
          <div className="p-2.5 md:p-3 bg-muted/30 text-center">
            <Button
              variant="ghost"
              onClick={handleSearch}
              className="text-xs md:text-sm text-primary hover:text-primary/80"
            >
              عرض جميع النتائج
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {showSuggestions && !isLoading && suggestions.length === 0 && debouncedSearch.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border p-4 md:p-6 text-center z-50">
          <Search className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/40 mx-auto mb-2 md:mb-3" />
          <p className="text-card-foreground text-sm mb-1">لم يتم العثور على نتائج</p>
          <p className="text-xs md:text-sm text-muted-foreground">جرب استخدام كلمات بحث مختلفة أو قم بتعديل الفلاتر</p>
        </div>
      )}

      {/* Overlay to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
