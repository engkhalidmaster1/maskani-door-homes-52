import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { BulkActionsBar, BulkDeleteConfirmation } from "@/components/Property/BulkActionsBar";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  address: string;
  images: string[];
  is_published: boolean;
  created_at: string;
  user_id: string;
  property_code?: string;
}

export const PropertiesManagement = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'code'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  useEffect(() => {
    fetchProperties();
  }, [user, isAdmin]);

  useEffect(() => {
    filterAndSortProperties();
  }, [properties, searchTerm, sortBy, sortOrder]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('properties')
        .select('*');

      // If not admin, only show user's properties
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل العقارات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortProperties = () => {
    let filtered = [...properties];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.property_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort properties
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'code':
          comparison = (a.property_code || '').localeCompare(b.property_code || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProperties(filtered);
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
    } catch (error: any) {
      toast({
        title: "خطأ في حذف العقارات",
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: "خطأ في نشر العقارات",
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: "خطأ في إلغاء نشر العقارات",
        description: error.message,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Grid3X3 className="h-6 w-6" />
          </div>
          إدارة العقارات
        </h1>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث بالعنوان، الموقع، أو الشفرة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="date-desc">الأحدث أولاً</option>
                  <option value="date-asc">الأقدم أولاً</option>
                  <option value="price-asc">السعر: منخفض إلى مرتفع</option>
                  <option value="price-desc">السعر: مرتفع إلى منخفض</option>
                  <option value="code-asc">الشفرة: أ-ي</option>
                  <option value="code-desc">الشفرة: ي-أ</option>
                </select>

                {/* View Mode */}
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

                {/* Refresh */}
                <Button variant="outline" size="sm" onClick={fetchProperties}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{properties.length}</div>
                <div className="text-sm text-gray-600">إجمالي العقارات</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.is_published).length}
                </div>
                <div className="text-sm text-gray-600">منشور</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {properties.filter(p => !p.is_published).length}
                </div>
                <div className="text-sm text-gray-600">غير منشور</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectionStats.selectedCount}
                </div>
                <div className="text-sm text-gray-600">محدد</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid/List */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Grid3X3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">لا توجد عقارات</h3>
              <p className="text-gray-600">
                {searchTerm ? 'لم يتم العثور على عقارات تطابق البحث' : 'لم يتم العثور على أي عقارات'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProperties.map((property) => (
              <div key={property.id} className="p-4 border rounded">
                <h3>{property.title}</h3>
                <p>{property.price} دينار</p>
                <input 
                  type="checkbox" 
                  checked={isSelected(property)} 
                  onChange={() => toggleItem(property)}
                />
              </div>
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
