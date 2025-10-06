import React, { useState, useEffect, useCallback } from 'react';
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
  Download
} from "lucide-react";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type ManagedProperty = PropertyRow & {
  listing_type: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  property_code?: string | null;
  ownership_type?: string | null;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "حدث خطأ غير متوقع";

type SortField = 'date' | 'price' | 'code';
type SortOrder = 'asc' | 'desc';

export const PropertiesManagement = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<ManagedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
    items: filteredProperties,
    getItemId: (property) => property.id
  });

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*');

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
    } catch (error) {
      toast({
        title: "خطأ في تحميل العقارات",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, toast, user]);

  const filterAndSortProperties = useCallback(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = properties.filter((property) => {
      if (!search) return true;
      return (
        property.title.toLowerCase().includes(search) ||
        property.location?.toLowerCase().includes(search) ||
        property.property_code?.toLowerCase().includes(search)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date': {
          const comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        case 'price': {
          const comparison = a.price - b.price;
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        case 'code': {
          const aCode = a.property_code ?? '';
          const bCode = b.property_code ?? '';
          const comparison = aCode.localeCompare(bCode);
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        default:
          return 0;
      }
    });

    setFilteredProperties(sorted);
  }, [properties, searchTerm, sortBy, sortOrder]);

  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder];
    setSortBy(field);
    setSortOrder(order);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    filterAndSortProperties();
  }, [filterAndSortProperties]);

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
        .update({ is_published: true })
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
        .update({ is_published: false })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 flex items-center gap-3 md:gap-4 border-b-2 border-primary pb-3 md:pb-4">
          <div className="bg-primary text-primary-foreground p-2 md:p-3 rounded-xl">
            <Grid3X3 className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          إدارة العقارات
        </h1>

        {/* Controls */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-full md:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث بالعنوان، الموقع، أو الشفرة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                {/* Sort */}
                <select
                  aria-label="ترتيب العقارات"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs md:text-sm min-w-0"
                >
                  <option value="date-desc">الأحدث أولاً</option>
                  <option value="date-asc">الأقدم أولاً</option>
                  <option value="price-asc">السعر: منخفض إلى مرتفع</option>
                  <option value="price-desc">السعر: مرتفع إلى منخفض</option>
                  <option value="code-asc">الشفرة: أ-ي</option>
                  <option value="code-desc">الشفرة: ي-أ</option>
                </select>

                {/* View Mode - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Refresh */}
                <Button variant="outline" size="sm" onClick={fetchProperties}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-primary">{properties.length}</div>
                <div className="text-xs md:text-sm text-gray-600">إجمالي العقارات</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  {properties.filter(p => p.is_published).length}
                </div>
                <div className="text-xs md:text-sm text-gray-600">منشور</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-orange-600">
                  {properties.filter(p => !p.is_published).length}
                </div>
                <div className="text-xs md:text-sm text-gray-600">غير منشور</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  {selectionStats.selectedCount}
                </div>
                <div className="text-xs md:text-sm text-gray-600">محدد</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid/List */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Grid3X3 className="w-12 h-12 md:w-16 md:h-16 mx-auto" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">لا توجد عقارات</h3>
              <p className="text-gray-600 text-sm md:text-base">
                {searchTerm ? 'لم يتم العثور على عقارات تطابق البحث' : 'لم يتم العثور على أي عقارات'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            isMobile || viewMode === 'list'
              ? 'space-y-3 md:space-y-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
          }>
            {filteredProperties.map((property) => (
              isMobile ? (
                <PropertyCardMobile
                  key={property.id}
                  property={property}
                  showCheckbox={true}
                  isSelected={isSelected(property)}
                  onSelectionChange={() => toggleItem(property)}
                />
              ) : (
                <PropertyCard
                  key={property.id}
                  property={property}
                  showCheckbox={true}
                  isSelected={isSelected(property)}
                  onSelectionChange={() => toggleItem(property)}
                />
              )
            ))}
          </div>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectionStats.selectedCount}
          totalCount={filteredProperties.length}
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
      </div>
    </div>
  );
};