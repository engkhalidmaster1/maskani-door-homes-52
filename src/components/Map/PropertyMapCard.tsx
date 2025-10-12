import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Edit, Trash2, Phone, Mail, Store } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import useVerification from '@/hooks/useVerification';
import { formatCurrency } from '@/lib/utils';
import { getMarketLabel, resolveMarketValue } from '@/constants/markets';

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: "sale" | "rent";
  price: number;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  location: string | null;
  address: string | null;
  amenities: string[] | null;
  images: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  ownership_type?: "ملك صرف" | "سر قفلية" | null;
  latitude?: number;
  longitude?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  market?: string | null;
  marketLabel?: string | null;
}

interface PropertyMapCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onContact?: (property: Property) => void;
  canManage?: boolean;
  showActions?: boolean;
  isApproximate?: boolean;
}

export const PropertyMapCard: React.FC<PropertyMapCardProps> = ({
  property,
  onEdit,
  onDelete,
  onView,
  onContact,
  canManage = false,
  showActions = true,
  isApproximate = false
}) => {
  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder.svg';
  const resolvedMarket = resolveMarketValue(
    property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined
  );
  const marketLabel = property.marketLabel ?? (resolvedMarket ? getMarketLabel(resolvedMarket) : null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
  };
  // Show verified badge for owner/publisher. Currently based on property.user_id
  const { verified: isVerified } = useVerification(property.user_id);

  return (
    <Card className="w-80 shadow-lg border-0">
      <CardHeader className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-bold text-right mb-2">
              {property.title}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={property.listing_type === 'sale' ? 'destructive' : 'default'}
                className="text-xs"
              >
                {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {property.property_type}
              </Badge>
              {property.ownership_type && (
                <Badge variant="secondary" className="text-xs">
                  {property.ownership_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {/* صورة العقار */}
        <div className="mb-3">
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-32 object-cover rounded-md"
            onError={handleImageError}
          />
        </div>

        {/* تفاصيل العقار */}
        <div className="space-y-2 text-right">
          {(property.location || marketLabel) && (
            <div className="space-y-1 text-right">
              {property.location && (
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm text-gray-600">{property.location}</span>
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
              )}
              {marketLabel && (
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded-full border border-amber-200">
                  <Store className="h-3 w-3" />
                  <span>قرب {marketLabel}</span>
                </div>
              )}
            </div>
          )}

          {isApproximate && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-md p-2 text-right">
              📍 تم تحديد هذا الموقع بناءً على السوق الأقرب، وقد يختلف الموقع الدقيق على الواقع.
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              🛏️ {property.bedrooms} | 🚿 {property.bathrooms}
              {property.area && ` | ${property.area} م²`}
            </div>
          </div>
          
          <p className="text-lg font-bold text-primary">
            {formatCurrency(property.price)} د.ع.‏
          </p>
          
          {property.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {property.description}
            </p>
          )}

          {/* معلومات المالك */}
          {(property.owner_name || property.owner_phone) && (
            <div className="bg-gray-50 p-2 rounded-md">
              {property.owner_name && (
                <p className="text-xs font-medium flex items-center gap-1">
                  👤 {property.owner_name}
                  <VerifiedBadge verified={!!isVerified} />
                </p>
              )}
              {property.owner_phone && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{property.owner_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        {showActions && (
          <div className="flex gap-1 mt-4 flex-wrap">
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(property.id)}
                className="flex items-center gap-1 flex-1 text-xs"
              >
                <Eye className="h-3 w-3" />
                عرض
              </Button>
            )}
            
            {onContact && (property.owner_phone || property.owner_email) && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onContact(property)}
                className="flex items-center gap-1 flex-1 text-xs"
              >
                <Phone className="h-3 w-3" />
                اتصال
              </Button>
            )}
            
            {canManage && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(property)}
                className="flex items-center gap-1 text-xs"
              >
                <Edit className="h-3 w-3" />
                تعديل
              </Button>
            )}
            
            {canManage && onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(property.id)}
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                حذف
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};