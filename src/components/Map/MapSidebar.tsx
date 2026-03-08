import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, List, Home, BarChart3, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface Property {
  id: string;
  title: string;
  listing_type: 'sale' | 'rent';
  price: number;
  location: string | null;
  images: string[] | null;
  bedrooms: number;
  bathrooms: number;
  area: number | null;
}

interface MarkerData {
  property: Property;
  coords: [number, number];
  source: 'precise' | 'market';
}

interface MapSidebarProps {
  items: MarkerData[];
  totalCount: number;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPropertyClick: (coords: [number, number], propertyId: string) => void;
  hoveredPropertyId: string | null;
  onHover: (id: string | null) => void;
  stats: {
    minPrice: number;
    maxPrice: number;
  };
}

const CHUNK = 12;

export const MapSidebar: React.FC<MapSidebarProps> = ({
  items,
  totalCount,
  isLoading,
  isOpen,
  onClose,
  onPropertyClick,
  hoveredPropertyId,
  onHover,
  stats,
}) => {
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(Math.min(CHUNK, items.length));
  }, [items.length]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || visibleCount >= items.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + CHUNK, items.length));
        }
      },
      { threshold: 0.5, rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  const renderPropertyCard = (item: MarkerData) => {
    const { property, coords, source } = item;
    const isHovered = hoveredPropertyId === property.id;

    return (
      <div
        key={property.id}
        className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
          isHovered
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-border hover:border-primary/30 bg-card'
        }`}
        onClick={() => onPropertyClick(coords, property.id)}
        onMouseEnter={() => onHover(property.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Home className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">{property.title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge
              variant={property.listing_type === 'sale' ? 'destructive' : 'default'}
              className="text-[10px] px-1.5 py-0"
            >
              {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
            </Badge>
            {source === 'market' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">تقديري</Badge>
            )}
          </div>
          <p className="text-sm font-bold text-primary mt-1">{formatCurrency(property.price)}</p>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            🛏️ {property.bedrooms} • 🚿 {property.bathrooms}
            {property.area && ` • ${property.area}م²`}
          </div>
        </div>
      </div>
    );
  };

  const listContent = (
    <>
      {isLoading ? (
        <div className="space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground px-4">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد عقارات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {visibleItems.map(renderPropertyCard)}
          {visibleCount < items.length && (
            <div ref={loadMoreRef} className="py-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((p) => Math.min(p + CHUNK, items.length))}
                className="text-xs"
              >
                تحميل المزيد ({items.length - visibleCount} متبقي)
              </Button>
            </div>
          )}
          {visibleCount >= items.length && items.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">تم عرض الكل</p>
          )}
        </div>
      )}
    </>
  );

  // ============ MOBILE: Bottom Sheet ============
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: bottomSheetExpanded ? '10%' : '65%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[1001] bg-background rounded-t-2xl shadow-2xl border-t"
            style={{ height: '90vh' }}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer"
              onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
            >
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">{totalCount} عقار</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                >
                  <ChevronUp className={`h-4 w-4 transition-transform ${bottomSheetExpanded ? 'rotate-180' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
              {listContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ============ DESKTOP: Side Panel ============
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 h-full w-[380px] bg-background shadow-2xl z-[1000] overflow-hidden flex flex-col border-l"
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <List className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-base">قائمة العقارات</h3>
                <p className="text-xs opacity-90">
                  {visibleItems.length} من {totalCount}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Price range bar */}
          {stats.minPrice > 0 && (
            <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between text-xs">
              <span className="font-semibold">{formatCurrency(stats.minPrice)}</span>
              <span className="text-muted-foreground">—</span>
              <span className="font-semibold">{formatCurrency(stats.maxPrice)}</span>
            </div>
          )}

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {listContent}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
