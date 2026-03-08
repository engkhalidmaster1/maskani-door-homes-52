import React from 'react';
import { useCompare, CompareProperty } from '@/context/CompareContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ExternalLink, Bed, Bath, Ruler, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { formatCurrency, getPropertyTypeLabel } from '@/lib/utils';
import { getMarketLabel } from '@/constants/markets';

interface CompareRow {
  label: string;
  icon?: React.ReactNode;
  render: (p: CompareProperty) => React.ReactNode;
}

const rows: CompareRow[] = [
  {
    label: 'السعر',
    render: (p) => (
      <span className="text-lg font-bold text-primary">{formatCurrency(p.price)}</span>
    ),
  },
  {
    label: 'نوع العرض',
    render: (p) => (
      <Badge variant={p.listing_type === 'sale' ? 'default' : 'secondary'}>
        {p.listing_type === 'sale' ? '💰 بيع' : '🏠 إيجار'}
      </Badge>
    ),
  },
  {
    label: 'نوع العقار',
    render: (p) => <span className="text-sm">{getPropertyTypeLabel(p.property_type)}</span>,
  },
  {
    label: 'غرف النوم',
    icon: <Bed className="w-4 h-4" />,
    render: (p) => <span className="text-sm font-semibold">{p.bedrooms}</span>,
  },
  {
    label: 'الحمامات',
    icon: <Bath className="w-4 h-4" />,
    render: (p) => <span className="text-sm font-semibold">{p.bathrooms}</span>,
  },
  {
    label: 'المساحة',
    icon: <Ruler className="w-4 h-4" />,
    render: (p) => <span className="text-sm">{p.area ? `${p.area} م²` : '—'}</span>,
  },
  {
    label: 'الموقع',
    icon: <MapPin className="w-4 h-4" />,
    render: (p) => {
      const market = p.market ? getMarketLabel(p.market as any) : null;
      return <span className="text-xs">{market || p.location || p.address || '—'}</span>;
    },
  },
  {
    label: 'الأثاث',
    render: (p) => {
      if (!p.furnished) return <span className="text-xs text-muted-foreground">—</span>;
      return p.furnished === 'yes' ? (
        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> مفروش</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> فارغ</span>
      );
    },
  },
  {
    label: 'الحالة',
    render: (p) => {
      const statusMap: Record<string, string> = { available: '🟢 متاح', negotiating: '🟡 تفاوض', sold: '🔴 مباع', rented: '🔵 مؤجر' };
      return <span className="text-xs">{statusMap[p.status || 'available'] || p.status || '—'}</span>;
    },
  },
  {
    label: 'سعر المتر',
    render: (p) => {
      if (!p.area || p.area === 0) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs font-medium">{formatCurrency(Math.round(p.price / p.area))} / م²</span>;
    },
  },
];

export function CompareSheet() {
  const { items, remove, isOpen, setIsOpen } = useCompare();
  const navigate = useNavigate();

  // Find best values for highlighting
  const bestPrice = items.length > 0 ? Math.min(...items.map(p => p.price)) : 0;
  const bestArea = items.length > 0 ? Math.max(...items.map(p => p.area || 0)) : 0;
  const bestPricePerM = items.length > 0
    ? Math.min(...items.filter(p => p.area && p.area > 0).map(p => p.price / (p.area || 1)))
    : 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="text-right text-xl">مقارنة العقارات ({items.length})</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-80px)]">
          <div className="px-4 pb-8">
            {/* Property headers with images */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `120px repeat(${items.length}, 1fr)` }}>
              {/* Empty corner */}
              <div />
              {items.map((item) => (
                <div key={item.id} className="text-center space-y-2">
                  <div className="relative mx-auto w-full aspect-[4/3] rounded-xl overflow-hidden border bg-muted">
                    {item.images?.[0] ? (
                      <img
                        src={getOptimizedImageUrl(item.images[0], 300)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold truncate px-1">{item.title}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => { navigate(`/property/${item.id}`); setIsOpen(false); }}
                  >
                    <ExternalLink className="w-3 h-3" /> التفاصيل
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Comparison rows */}
            {rows.map((row, idx) => (
              <div
                key={row.label}
                className="grid items-center gap-3 py-3 border-b border-border/50 last:border-0"
                style={{ gridTemplateColumns: `120px repeat(${items.length}, 1fr)` }}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {row.icon}
                  <span>{row.label}</span>
                </div>
                {items.map((item) => {
                  // Highlight best values
                  let highlight = false;
                  if (row.label === 'السعر' && item.price === bestPrice && items.length > 1) highlight = true;
                  if (row.label === 'المساحة' && (item.area || 0) === bestArea && bestArea > 0 && items.length > 1) highlight = true;
                  if (row.label === 'سعر المتر' && item.area && item.area > 0 && Math.round(item.price / item.area) === Math.round(bestPricePerM) && items.length > 1) highlight = true;

                  return (
                    <div
                      key={item.id}
                      className={`text-center px-2 py-1 rounded-lg transition-colors ${
                        highlight ? 'bg-green-50 ring-1 ring-green-200' : ''
                      }`}
                    >
                      {row.render(item)}
                      {highlight && <span className="block text-[9px] text-green-600 mt-0.5">⭐ الأفضل</span>}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Amenities comparison */}
            {items.some(p => p.amenities && p.amenities.length > 0) && (
              <>
                <Separator className="my-4" />
                <div
                  className="grid items-start gap-3 py-3"
                  style={{ gridTemplateColumns: `120px repeat(${items.length}, 1fr)` }}
                >
                  <div className="text-xs font-medium text-muted-foreground pt-1">المرافق</div>
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-wrap gap-1 justify-center">
                      {(item.amenities || []).map((amenity, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                          {amenity}
                        </Badge>
                      ))}
                      {(!item.amenities || item.amenities.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
