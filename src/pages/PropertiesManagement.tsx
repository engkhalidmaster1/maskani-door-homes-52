import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { PropertyCardMobile } from "@/components/Property/PropertyCardMobile";
import { BulkActionsBar, BulkDeleteConfirmation } from "@/components/Property/BulkActionsBar";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  RefreshCw,
  Download,
  ArrowUp,
  X
} from "lucide-react";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type ManagedProperty = PropertyRow & {
  listing_type: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  property_code?: string | null;
  ownership_type?: string | null;
  status?: string; // available, sold, rented, under_negotiation
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "حدث خطأ غير متوقع";

type SortField = 'date' | 'price' | 'code';
type SortOrder = 'asc' | 'desc';

export const PropertiesManagement = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Optimistic toggle handler for publish/hide
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, {is_published: boolean, is_hidden: boolean} | undefined>>({});

  const handleTogglePublication = async (propertyId: string, currentStatus: boolean) => {
    // Find property
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    // Optimistically update local state
    const newIsPublished = !currentStatus;
    const newIsHidden = currentStatus;
    setProperties(prev => prev.map(p =>
      p.id === propertyId ? { ...p, is_published: newIsPublished, is_hidden: newIsHidden } : p
    ));
    setOptimisticToggles(prev => ({ ...prev, [propertyId]: { is_published: newIsPublished, is_hidden: newIsHidden } }));
    // Backend update
    const { error } = await supabase
      .from('properties')
      .update({ is_published: newIsPublished, is_hidden: newIsHidden })
      .eq('id', propertyId);
    if (error) {
      // Revert on error
      setProperties(prev => prev.map(p =>
        p.id === propertyId ? { ...p, is_published: currentStatus, is_hidden: !currentStatus } : p
      ));
      setOptimisticToggles(prev => ({ ...prev, [propertyId]: undefined }));
      toast({ title: 'خطأ في تحديث حالة العقار', description: error.message, variant: 'destructive' });
    } else {
      setOptimisticToggles(prev => ({ ...prev, [propertyId]: undefined }));
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // New filter controls
  const [listingTypeFilter, setListingTypeFilter] = useState<'' | 'sale' | 'rent'>(() => {
    return localStorage.getItem('maskani-admin-listingTypeFilter') as '' | 'sale' | 'rent' || '';
  });
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'' | 'apartment' | 'house' | 'commercial'>(() => {
    return localStorage.getItem('maskani-admin-propertyTypeFilter') as '' | 'apartment' | 'house' | 'commercial' || '';
  });

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('maskani-admin-listingTypeFilter', listingTypeFilter);
  }, [listingTypeFilter]);
  useEffect(() => {
    localStorage.setItem('maskani-admin-propertyTypeFilter', propertyTypeFilter);
  }, [propertyTypeFilter]);

  // Server-side pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [totalCount, setTotalCount] = useState<number>(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const [jumpPage, setJumpPage] = useState<string>('');

  // Debounced search term to reduce query frequency
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // URL params handling
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedFromParams = useRef(false);

  // Initialize state from URL params on first mount
  useEffect(() => {
    const pStr = searchParams.get('page');
    const pNum = pStr ? parseInt(pStr, 10) : 1;
    if (!Number.isNaN(pNum) && pNum > 0) setPage(pNum);

    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);

    const lt = searchParams.get('lt');
    if (lt === 'sale' || lt === 'rent') setListingTypeFilter(lt);

    const pt = searchParams.get('pt');
    if (pt === 'apartment' || pt === 'house' || pt === 'commercial') setPropertyTypeFilter(pt);

    const sort = searchParams.get('sort');
    if (sort) {
      const [field, order] = sort.split('-') as [SortField, SortOrder];
      const validField = field === 'date' || field === 'price' || field === 'code' ? field : 'date';
      const validOrder = order === 'asc' || order === 'desc' ? order : 'desc';
      setSortBy(validField);
      setSortOrder(validOrder);
    }

    hasInitializedFromParams.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilters =
    (searchTerm && searchTerm.trim().length > 0) ||
    listingTypeFilter !== '' ||
    propertyTypeFilter !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setListingTypeFilter('');
    setPropertyTypeFilter('');
    setPage(1);
  };

  // Multi-select functionality
  const {
    selectedItems,
    toggleItem,
    isSelected,
    selectAll,
    clearAll,
    toggleAll,
    selectionStats
  } = useMultiSelect({
    items: properties,
    getItemId: (property) => property.id
  });

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' });

      if (!isAdmin) {
        if (user) {
          // فلترة العقارات العامة لإخفاء المخفية
          query = query.or(`and(is_published.eq.true,is_hidden.eq.false),user_id.eq.${user.id}`);
        } else {
          query = query.eq('is_published', true).eq('is_hidden', false);
        }
      }

      // Apply server-side filters
      if (listingTypeFilter) {
        query = query.eq('listing_type', listingTypeFilter);
      }
      if (propertyTypeFilter) {
        query = query.eq('property_type', propertyTypeFilter);
      }
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.replace(/[%_]/g, '');
        query = query.or(
          `title.ilike.%${term}%,location.ilike.%${term}%,property_code.ilike.%${term}%`
        );
      }

      // Sorting
      const sortColumn =
        sortBy === 'price' ? 'price' : sortBy === 'code' ? 'property_code' : 'created_at';

      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Pagination (range is inclusive)
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const rawData = (data as PropertyRow[] | null) ?? [];
      const validatedData: ManagedProperty[] = rawData.map((item) => ({
        ...item,
        listing_type: item.listing_type === 'rent' ? 'rent' : 'sale',
        bedrooms: item.bedrooms ?? 0,
        bathrooms: item.bathrooms ?? 0,
      }));

      setProperties(validatedData);
      setTotalCount(count ?? 0);
    } catch (error) {
      toast({
        title: "خطأ في تحميل العقارات",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user, listingTypeFilter, propertyTypeFilter, debouncedSearchTerm, sortBy, sortOrder, page, toast]);

  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder];
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset to first page when filters or search change (handled above for sort)
  useEffect(() => {
    if (!hasInitializedFromParams.current) return;
    setPage(1);
  }, [listingTypeFilter, propertyTypeFilter, debouncedSearchTerm]);

  // Sync state to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (searchTerm) params.set('q', searchTerm);
    if (listingTypeFilter) params.set('lt', listingTypeFilter);
    if (propertyTypeFilter) params.set('pt', propertyTypeFilter);
    if (!(sortBy === 'date' && sortOrder === 'desc')) params.set('sort', `${sortBy}-${sortOrder}`);
    setSearchParams(params, { replace: true });
  }, [page, searchTerm, listingTypeFilter, propertyTypeFilter, sortBy, sortOrder, setSearchParams]);

  // Handle scroll for enhanced sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkDelete = async () => {
    try {
      const propertyIds = selectedItems.map(p => p.id);
      
      // Delete properties (only allow users to delete their own, or admins to delete any)
      let query = supabase
        .from('properties')
        .delete()
        .in('id', propertyIds);

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "تم حذف العقارات",
        description: `تم حذف ${selectedItems.length} عقار بنجاح`,
      });

      // Refresh properties list
      await fetchProperties();
      clearAll();
      setShowDeleteConfirmation(false);
    } catch (error) {
      toast({
        title: "خطأ في حذف العقارات",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleBulkPublish = async () => {
    try {
      const propertyIds = selectedItems.map(p => p.id);
      
      let query = supabase
        .from('properties')
        .update({ is_published: true, is_hidden: false })
        .in('id', propertyIds);

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "تم نشر العقارات",
        description: `تم نشر ${selectedItems.length} عقار بنجاح`,
      });

      await fetchProperties();
      clearAll();
    } catch (error) {
      toast({
        title: "خطأ في نشر العقارات",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const propertyIds = selectedItems.map(p => p.id);
      
      let query = supabase
        .from('properties')
        .update({ is_published: false, is_hidden: true })
        .in('id', propertyIds);

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "تم إلغاء نشر العقارات",
        description: `تم إلغاء نشر ${selectedItems.length} عقار بنجاح`,
      });

      await fetchProperties();
      clearAll();
    } catch (error) {
      toast({
        title: "خطأ في إلغاء نشر العقارات",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">جاري تحميل العقارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sticky Filter Bar matching Header */}
      <div className="gradient-primary text-primary-foreground shadow-elegant sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between md:h-16 md:gap-4">
            {/* Search */}
            <div className="w-full md:flex-1 md:max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/80 w-5 h-5 group-focus-within:scale-110 transition-transform" />
                <Input
                  placeholder="البحث بالعنوان، الموقع، أو الشفرة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 h-11 text-sm bg-white text-gray-800 border-2 border-white/70 focus:border-white focus:ring-0 rounded-xl shadow-md transition-all w-full"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="w-full md:w-auto flex items-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible py-1">
              {/* Listing type: sale / rent */}
              <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm shrink-0">
                <Button
                  variant={listingTypeFilter === 'sale' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListingTypeFilter(prev => prev === 'sale' ? '' : 'sale')}
                  className={`h-9 px-3 rounded-lg transition ${listingTypeFilter === 'sale' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="للبيع"
                >
                  💰 للبيع
                </Button>
                <Button
                  variant={listingTypeFilter === 'rent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListingTypeFilter(prev => prev === 'rent' ? '' : 'rent')}
                  className={`h-9 px-3 rounded-lg transition ${listingTypeFilter === 'rent' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="للإيجار"
                >
                  🏠 للإيجار
                </Button>
              </div>

              {/* Property type: apartment / house / commercial */}
              <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm shrink-0">
                <Button
                  variant={propertyTypeFilter === 'apartment' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'apartment' ? '' : 'apartment')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'apartment' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="شقة"
                >
                  🏢 شقة
                </Button>
                <Button
                  variant={propertyTypeFilter === 'house' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'house' ? '' : 'house')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'house' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="بيت"
                >
                  🏠 بيت
                </Button>
                <Button
                  variant={propertyTypeFilter === 'commercial' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPropertyTypeFilter(prev => prev === 'commercial' ? '' : 'commercial')}
                  className={`h-9 px-3 rounded-lg transition ${propertyTypeFilter === 'commercial' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'}`}
                  title="محل تجاري"
                >
                  🏪 محل تجاري
                </Button>
              </div>

              {/* Sort */}
              <div className="relative group shrink-0">
                <select
                  aria-label="ترتيب العقارات"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none h-11 px-4 pr-10 bg-white text-gray-800 border-2 border-white/70 rounded-xl text-sm font-medium focus:border-white focus:ring-0 shadow-md cursor-pointer min-w-[180px]"
                >
                  <option value="date-desc">الأحدث أولاً</option>
                  <option value="date-asc">الأقدم أولاً</option>
                  <option value="price-asc">السعر: منخفض إلى مرتفع</option>
                  <option value="price-desc">السعر: مرتفع إلى منخفض</option>
                  <option value="code-asc">الشفرة: أ-ي</option>
                  <option value="code-desc">الشفرة: ي-أ</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 text-primary-foreground/80" />
                  ) : (
                    <SortDesc className="w-4 h-4 text-primary-foreground/80" />
                  )}
                </div>
              </div>

              {/* View Mode - Desktop */}
              {!isMobile && (
                <div className="flex rounded-xl p-1 border-2 border-white/70 bg-white/20 backdrop-blur-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`h-9 px-3 rounded-lg transition ${
                      viewMode === 'grid' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`h-9 px-3 rounded-lg transition ${
                      viewMode === 'list' ? 'bg-white text-gray-800 shadow' : 'text-primary-foreground hover:bg-white/20'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchProperties}
                className="gap-2 h-11 px-4 rounded-xl text-primary-foreground hover:bg-white/20 border-2 border-white shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>

              {/* Clear Filters - shows only when active */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="gap-2 h-11 px-3 rounded-xl text-red-50 hover:bg-white/20 border-2 border-white shrink-0"
                  title="مسح الفلاتر"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Content Area - Seamless Integration with Modern Filter */}
        <div className="p-3 md:p-6 pt-2 md:pt-4 space-y-4 md:space-y-6">
          {/* Stats Cards - Enhanced Design */}
          {isAdmin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 md:p-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{totalCount}</div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">إجمالي العقارات</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 md:p-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                      {properties.filter(p => p.is_published).length}
                    </div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">منشور</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 md:p-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">
                      {properties.filter(p => !p.is_published).length}
                    </div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">غير منشور</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 md:p-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                      {selectionStats.selectedCount}
                    </div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">محدد</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Properties Grid/List */}
          {properties.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Grid3X3 className="w-12 h-12 md:w-16 md:h-16 mx-auto" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">لا توجد عقارات</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {searchTerm ? 'لم يتم العثور على عقارات تطابق البحث' : 'لم يتم العثور على أي عقارات'}
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    مسح البحث
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={`transition-all duration-300 ${
              isMobile || viewMode === 'list'
                ? 'space-y-3 md:space-y-4'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
            }`}>
              {properties.map((property) => (
                isMobile ? (
                  <PropertyCardMobile
                    key={property.id}
                    property={property}
                    showCheckbox={isAdmin}
                    isSelected={isSelected(property)}
                    onSelectionChange={() => toggleItem(property)}
                  />
                ) : (
                  <PropertyCard
                    key={property.id}
                    property={{ ...property, ...(optimisticToggles[property.id] || {}) }}
                    showCheckbox={isAdmin}
                    isSelected={isSelected(property)}
                    onSelectionChange={() => toggleItem(property)}
                    onTogglePublication={handleTogglePublication}
                  />
                )
              ))}
            </div>
          )}

          {/* Pagination Controls (Numbered + Jump) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-2 md:py-4">
            <div className="text-sm text-gray-600">
              صفحة {totalCount === 0 ? 0 : page} من {totalCount === 0 ? 0 : totalPages}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="rounded-xl"
              >
                الأولى
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl"
              >
                السابق
              </Button>

              {/* Numbered pages with ellipsis */}
              {(() => {
                const pages: (number | '...')[] = [];
                const add = (n: number | '...') => pages.push(n);
                const tp = totalPages;
                const cur = page;
                const start = Math.max(2, cur - 2);
                const end = Math.min(tp - 1, cur + 2);
                add(1);
                if (start > 2) add('...');
                for (let i = start; i <= end; i++) add(i);
                if (end < tp - 1) add('...');
                if (tp > 1) add(tp);
                return pages.map((p, idx) =>
                  p === '...'
                    ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">…</span>
                      )
                    : (
                        <Button
                          key={`page-${p}`}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                          className="rounded-xl min-w-9"
                        >
                          {p}
                        </Button>
                      )
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl"
              >
                التالي
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="rounded-xl"
              >
                الأخيرة
              </Button>

              {/* Jump to page */}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-gray-600">اذهب إلى</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = parseInt(jumpPage, 10);
                      if (!Number.isNaN(n)) {
                        const clamped = Math.min(totalPages, Math.max(1, n));
                        setPage(clamped);
                        setJumpPage('');
                      }
                    }
                  }}
                  className="w-20 h-9"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const n = parseInt(jumpPage, 10);
                    if (!Number.isNaN(n)) {
                      const clamped = Math.min(totalPages, Math.max(1, n));
                      setPage(clamped);
                      setJumpPage('');
                    }
                  }}
                  className="rounded-xl"
                >
                  انتقال
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar - Admins only */}
        {isAdmin && (
          <>
            <BulkActionsBar
              selectedCount={selectionStats.selectedCount}
              totalCount={properties.length}
              isAllSelected={selectionStats.isAllSelected}
              isSomeSelected={selectionStats.isSomeSelected}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onBulkDelete={() => setShowDeleteConfirmation(true)}
              onBulkPublish={handleBulkPublish}
              onBulkUnpublish={handleBulkUnpublish}
              isVisible={selectionStats.hasSelection}
            />

            {/* Delete Confirmation Dialog */}
            <BulkDeleteConfirmation
              isOpen={showDeleteConfirmation}
              selectedCount={selectionStats.selectedCount}
              onConfirm={handleBulkDelete}
              onCancel={() => setShowDeleteConfirmation(false)}
            />
          </>
        )}

        {/* Scroll to Top Button - Premium Design */}
        {isScrolled && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border-2 border-white/20"
            size="sm"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};