import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LazyImage } from "@/components/ui/lazy-image";
import { PropertyStatusBadge } from "@/components/Property/PropertyStatusBadge";
import { PropertyStatusBadgeEnhanced } from "@/components/Property/PropertyStatusBadgeEnhanced";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Heart, MapPin, BedDouble, Bath, Square, Phone, Eye, Edit, Trash2, Store } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getPropertyTypeLabel, getPropertyTypeEmoji } from "@/lib/utils";
import { getMarketLabel, resolveMarketValue } from "@/constants/markets";

interface Property {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  property_type: string;
  listing_type: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  area?: number | null;
  location?: string | null;
  address?: string | null;
  images?: string[] | null;
  is_published: boolean;
  status?: string; // available, sold, rented, under_negotiation
  created_at: string;
  updated_at: string;
  user_id: string;
  property_code?: string;
  amenities?: string[] | null;
  ownership_type?: string | null;
  market?: string | null;
  marketLabel?: string | null;
}

interface PropertyCardMobileProps {
  property: Property;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (property: Property, selected: boolean) => void;
  showActions?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
}

export const PropertyCardMobile: React.FC<PropertyCardMobileProps> = ({
  property,
  showCheckbox = false,
  isSelected = false,
  onSelectionChange,
  showActions = true,
  onEdit,
  onDelete
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const resolvedMarket = resolveMarketValue(
    property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined
  );
  const marketLabel = property.marketLabel ?? (resolvedMarket ? getMarketLabel(resolvedMarket) : null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لحفظ العقارات",
        variant: "destructive",
      });
      return;
    }
    await toggleFavorite(property.id);
  };

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(property, checked);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100">
      <div onClick={handleCardClick}>
        {/* Image Section */}
        <div className="relative h-48 bg-gray-100">
          {/* Property Status Badge - Deal Status */}
          <PropertyStatusBadgeEnhanced 
            status={property.status} 
            listingType={property.listing_type}
          />

          {property.images && property.images.length > 0 ? (
            <LazyImage
              src={getOptimizedImageUrl(property.images[0], 'small')}
              alt={property.title}
              className="w-full h-full object-cover"
              placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E"
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-500 relative">
              <div className="text-center">
                <div className="mb-2">
                  <span className="text-4xl">{getPropertyTypeEmoji(property.property_type)}</span>
                </div>
                <span className="text-sm font-medium text-gray-600 block">{getPropertyTypeLabel(property.property_type)}</span>
                <div className="flex items-center gap-1 mt-1 justify-center">
                  <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-orange-600 font-medium">بلا صورة</span>
                </div>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {showCheckbox && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleCheckboxChange}
                  className="bg-white/80 border-white"
                />
              </div>
            )}
            
            <div className="flex gap-1">
              {/* Favorite Button */}
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                onClick={handleFavoriteClick}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isFavorite(property.id) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-600'
                  }`} 
                />
              </Button>

              {/* View Button */}
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/property/${property.id}`);
                }}
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Badge 
              variant={property.listing_type === 'sale' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {property.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}
            </Badge>
            
            {!property.is_published && (
              <Badge variant="destructive" className="text-xs">
                غير منشور
              </Badge>
            )}
          </div>

          {/* Image Count */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="bg-black/50 text-white border-none text-xs">
                {property.images.length} صور
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-3 bg-white">
          {/* Title and Price */}
          <div className="flex items-center justify-between mb-3 border-b pb-2 border-gray-200" dir="rtl">
            <div className="text-right w-3/5">
              <h3 className="font-semibold text-sm line-clamp-2 text-gray-800" dir="rtl">{property.title}</h3>
            </div>
            <div className="w-2/5 text-left">
              <div className="text-sm font-bold text-primary bg-blue-50 px-2 py-1 rounded">
                {formatPrice(property.price)}
              </div>
            </div>
          </div>

          {/* Location */}
          {(property.location || marketLabel) && (
            <div className="space-y-1 mb-2 text-right" dir="rtl">
              {property.location && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-3 w-3 ml-1 text-blue-500" />
                  <span className="text-xs line-clamp-1 text-gray-700">{property.location}</span>
                </div>
              )}
              {marketLabel && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-amber-200">
                  <Store className="h-3 w-3" />
                  قرب {marketLabel}
                </span>
              )}
            </div>
          )}

          {/* Property Details */}
          <div className="flex items-center gap-2 justify-end border-t pt-2 border-gray-200">
            {property.area && (
              <div className="flex items-center gap-1 flex-row-reverse bg-blue-50 p-1 px-2 rounded">
                <Square className="h-3 w-3 ml-1 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">{property.area}م²</span>
              </div>
            )}
            <div className="flex items-center gap-1 flex-row-reverse bg-green-50 p-1 px-2 rounded">
              <Bath className="h-3 w-3 ml-1 text-green-500" />
              <span className="text-xs font-medium text-gray-700">{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1 flex-row-reverse bg-purple-50 p-1 px-2 rounded">
              <BedDouble className="h-3 w-3 ml-1 text-purple-500" />
              <span className="text-xs font-medium text-gray-700">{property.bedrooms}</span>
            </div>
            {/* معلومات الصور */}
            {property.images && property.images.length > 0 ? (
              <div className="flex items-center gap-1 flex-row-reverse bg-emerald-50 p-1 px-2 rounded">
                <svg className="w-3 h-3 ml-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-gray-700">{property.images.length}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-row-reverse bg-orange-50 p-1 px-2 rounded">
                <svg className="w-3 h-3 ml-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-gray-700">بلا صورة</span>
              </div>
            )}
          </div>

          {/* Property Code */}
          {property.property_code && (
            <div className="text-xs text-gray-500 mb-2">
              الرمز: {property.property_code}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (user?.id === property.user_id || onEdit || onDelete) && (
            <div className="flex gap-2 pt-2 border-t bg-gray-50 -mx-3 px-3 pb-1">
              {(user?.id === property.user_id || onEdit) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs bg-white hover:bg-primary hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) {
                      onEdit(property);
                    } else {
                      navigate(`/edit-property/${property.id}`);
                    }
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  تعديل
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs bg-white hover:bg-blue-500 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/property/${property.id}`);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                عرض
              </Button>

              {(user?.id === property.user_id || onDelete) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white hover:bg-red-500 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) {
                      onDelete(property);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  حذف
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};