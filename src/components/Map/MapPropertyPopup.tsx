import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Phone, Store, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getMarketLabel, resolveMarketValue } from '@/constants/markets';

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: 'sale' | 'rent';
  price: number;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  location: string | null;
  address: string | null;
  images: string[] | null;
  owner_name?: string;
  owner_phone?: string;
  market?: string | null;
  marketLabel?: string | null;
}

interface MapPropertyPopupProps {
  property: Property;
  isApproximate?: boolean;
  onView?: (id: string) => void;
  onContact?: (property: Property) => void;
}

/**
 * Lightweight popup for map markers - no heavy hooks (useVerification/useFavorite removed)
 */
export const MapPropertyPopup: React.FC<MapPropertyPopupProps> = ({
  property,
  isApproximate = false,
  onView,
  onContact,
}) => {
  const mainImage = property.images?.[0] || '/placeholder.svg';
  const resolvedMarket = resolveMarketValue(
    property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined
  );
  const marketLabel = property.marketLabel ?? (resolvedMarket ? getMarketLabel(resolvedMarket) : null);

  return (
    <div className="w-72 font-[Tajawal]" dir="rtl">
      {/* Image */}
      <img
        src={mainImage}
        alt={property.title}
        className="w-full h-36 object-cover rounded-t-lg"
        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
      />

      <div className="p-3 space-y-2">
        {/* Title + badges */}
        <h3 className="font-bold text-sm leading-tight line-clamp-1">{property.title}</h3>
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={property.listing_type === 'sale' ? 'destructive' : 'default'}
            className="text-[10px] px-1.5 py-0"
          >
            {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {property.property_type}
          </Badge>
        </div>

        {/* Location */}
        {(property.location || marketLabel) && (
          <div className="space-y-1">
            {property.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
            )}
            {marketLabel && (
              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-amber-200">
                <Store className="h-2.5 w-2.5" />
                <span>قرب {marketLabel}</span>
              </div>
            )}
          </div>
        )}

        {isApproximate && (
          <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
            📍 موقع تقديري بناءً على السوق الأقرب
          </p>
        )}

        {/* Details row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>🛏️ {property.bedrooms}</span>
          <span>🚿 {property.bathrooms}</span>
          {property.area && <span>{property.area} م²</span>}
        </div>

        {/* Price */}
        <p className="text-base font-bold text-primary">
          {formatCurrency(property.price)}
        </p>

        {/* Owner */}
        {property.owner_name && (
          <p className="text-xs text-muted-foreground">👤 {property.owner_name}</p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          {onView && (
            <Button size="sm" variant="outline" onClick={() => onView(property.id)} className="flex-1 h-7 text-xs">
              <Eye className="h-3 w-3 ml-1" />
              عرض
            </Button>
          )}
          {onContact && property.owner_phone && (
            <Button size="sm" onClick={() => onContact(property)} className="flex-1 h-7 text-xs">
              <Phone className="h-3 w-3 ml-1" />
              اتصال
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
