import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { PropertyStatusBadge } from "@/components/Property/PropertyStatusBadge";
import { PropertyStatusBadgeEnhanced } from "@/components/Property/PropertyStatusBadgeEnhanced";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Building, Home as HomeIcon, MapPin, Bed, Bath, Ruler, Heart, CheckSquare, Square, Edit, Trash2, Eye, EyeOff, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency, formatDate, getPropertyTypeLabel } from "@/lib/utils";
import { getMarketLabel, resolveMarketValue } from "@/constants/markets";

interface Property {
  id: string;
  title: string;
  description?: string | null;
  property_type: string;
  listing_type: "sale" | "rent";
  price: number;
  area?: number | null;
  bedrooms: number;
  bathrooms: number;
  location?: string | null;
  address?: string | null;
  amenities?: string[] | null;
  images?: string[] | null;
  is_published: boolean;
  is_hidden?: boolean;
  status?: string; // available, sold, rented, under_negotiation
  created_at: string;
  updated_at: string;
  market?: string | null;
  marketLabel?: string | null;
}

interface PropertyCardProps {
  property: Property;
  showActions?: boolean;
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  onTogglePublication?: (propertyId: string, currentStatus: boolean) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (property: Property, selected: boolean) => void;
  isOwner?: boolean;
  isOffline?: boolean;
}

export const PropertyCard = ({ 
  property, 
  showActions = false,
  onEdit,
  onDelete,
  onTogglePublication,
  showCheckbox = false,
  isSelected = false,
  onSelectionChange,
  isOwner = false,
  isOffline = false
}: PropertyCardProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);
  const [optimisticPublished, setOptimisticPublished] = useState<undefined | boolean>(undefined);
  const [optimisticHidden, setOptimisticHidden] = useState<undefined | boolean>(undefined);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const resolvedMarket = resolveMarketValue(property.market ?? property.location ?? property.address ?? property.marketLabel ?? undefined);
  const marketLabel = property.marketLabel ?? (resolvedMarket ? getMarketLabel(resolvedMarket) : null);

  const getPropertyIcon = () => {
    switch (property.property_type) {
      case "apartment":
        return <Building className="h-12 w-12" />;
      case "house":
        return <HomeIcon className="h-12 w-12" />;
      case "villa":
        return <HomeIcon className="h-12 w-12" />;
      default:
        return <HomeIcon className="h-12 w-12" />;
    }
  };

  // استخدم الحالة المتفائلة إذا وُجدت، وإلا القيمة الأصلية
  const isPublished = optimisticPublished !== undefined ? optimisticPublished : property.is_published;
  const isHidden = optimisticHidden !== undefined ? optimisticHidden : property.is_hidden;

  const handleTogglePublication = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOptimisticPublished(!isPublished);
    setOptimisticHidden(isPublished);
    if (onTogglePublication) {
      await onTogglePublication(property.id, isPublished);
      // إعادة الضبط مباشرة بعد اكتمال التحديث (أو عند تحديث القائمة)
      setOptimisticPublished(undefined);
      setOptimisticHidden(undefined);
    }
  };

  return (
    <Card className="overflow-hidden hover-lift shadow-md group relative border-2 border-gray-100">

      {/* Selection Checkbox */}
      {showCheckbox && (
        <button
          title="تحديد العقار"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelectionChange?.(property, !isSelected);
          }}
          className="absolute top-3 left-3 z-20 p-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md transition-all hover:scale-110"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 hover:text-primary" />
          )}
        </button>
      )}

      {/* Favorite Button */}
      {user && (
        <button
          title={isFavorite(property.id) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!isToggling) {
              setIsToggling(true);
              toggleFavorite(property.id).finally(() => setIsToggling(false));
            }
          }}
          disabled={isToggling}
          className={`absolute top-3 ${showCheckbox ? 'left-16' : 'left-3'} z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${
            isFavorite(property.id) 
              ? 'text-red-500' 
              : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart 
            className={`w-4 h-4 transition-all ${
              isFavorite(property.id) ? 'fill-current' : ''
            }`} 
          />
        </button>
      )}

      {/* Main Content - Clickable Area */}
      <div 
        onClick={() => navigate(`/property/${property.id}`)} 
        className="cursor-pointer"
      >
        {/* Property Image/Icon */}
        <div className="relative h-48 overflow-hidden">
          {(() => {
            const imageUrl = property.images?.[0];
            return imageUrl ? (
              <LazyImage
                src={getOptimizedImageUrl(imageUrl, isMobile ? 'small' : 'medium')}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 relative">
                {getPropertyIcon()}
                <div className="mt-3 text-center">
                  <span className="text-sm font-medium text-gray-600">{getPropertyTypeLabel(property.property_type)}</span>
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-orange-600 font-medium">بلا صورة</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Property Status Badge - Deal Status */}
          <PropertyStatusBadgeEnhanced 
            status={property.status} 
            listingType={property.listing_type}
          />

          {/* Listing Type Badge */}
          <Badge
            variant="default"
            className={`absolute top-3 right-3 backdrop-blur-sm font-bold z-10 ${
              property.listing_type === "sale" 
                ? "bg-red-500 text-white" 
                : "bg-green-500 text-white"
            }`}
          >
            {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
          </Badge>
          
          {!property.is_published && (
            <Badge
              variant="secondary"
              className="absolute top-3 right-20 bg-white/90 backdrop-blur-sm z-10"
            >
              غير منشور
            </Badge>
          )}
        </div>

        {/* Property Details */}
        <div className="p-4 bg-white">
          {/* Title and Price */}
          <div className="flex items-center justify-between mb-3 border-b pb-3 border-gray-200" dir="rtl">
            <div className="text-right w-3/5">
              <h3 className="text-lg font-bold text-gray-800 line-clamp-1" dir="rtl">{property.title}</h3>
            </div>
            <div className="w-2/5 text-left">
              <span className="text-xl font-bold text-primary bg-blue-50 px-2 py-1 rounded">
                {formatCurrency(property.price)}
              </span>
            </div>
          </div>

          {/* Location */}
          {(property.location || marketLabel) && (
            <div className="space-y-1 mb-3 text-right" dir="rtl">
              {property.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 ml-1 text-blue-500" />
                  <span className="text-gray-700 text-sm line-clamp-1">{property.location}</span>
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

          {/* Offline Status Indicator */}
          {isOffline && property.id.startsWith('temp_') && (
            <div className="flex items-center mb-3 px-2 py-1 bg-orange-50 rounded text-right" dir="rtl">
              <div className="w-2 h-2 bg-orange-500 rounded-full ml-2 animate-pulse"></div>
              <span className="text-orange-700 text-xs font-medium">محفوظ محلياً - في انتظار المزامنة</span>
            </div>
          )}

          {isOffline && !property.id.startsWith('temp_') && (
            <div className="flex items-center mb-3 px-2 py-1 bg-blue-50 rounded text-right" dir="rtl">
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
              <span className="text-blue-700 text-xs font-medium">يعمل دون اتصال</span>
            </div>
          )}

          {/* Features */}
          <div className="flex items-center gap-3 justify-end border-t pt-3 border-gray-200">
            {property.area && (
              <div className="flex items-center flex-row-reverse bg-blue-50 p-1 px-2 rounded">
                <Ruler className="h-4 w-4 ml-1 text-blue-500" />
                <span className="text-gray-700 font-medium text-sm">{property.area} م²</span>
              </div>
            )}
            <div className="flex items-center flex-row-reverse bg-green-50 p-1 px-2 rounded">
              <Bath className="h-4 w-4 ml-1 text-green-500" />
              <span className="text-gray-700 font-medium text-sm">{property.bathrooms}</span>
            </div>
            <div className="flex items-center flex-row-reverse bg-purple-50 p-1 px-2 rounded">
              <Bed className="h-4 w-4 ml-1 text-purple-500" />
              <span className="text-gray-700 font-medium text-sm">{property.bedrooms}</span>
            </div>
            {/* معلومات الصور */}
            {property.images && property.images.length > 0 ? (
              <div className="flex items-center flex-row-reverse bg-emerald-50 p-1 px-2 rounded">
                <svg className="w-4 h-4 ml-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium text-sm">{property.images.length}</span>
              </div>
            ) : (
              <div className="flex items-center flex-row-reverse bg-orange-50 p-1 px-2 rounded">
                <svg className="w-4 h-4 ml-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium text-sm">بلا صورة</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Buttons - Moved to Bottom */}
        {showActions && (
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2 justify-center">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(property.id);
                }}
                className="flex-1 bg-white hover:bg-primary hover:text-white border-gray-300"
              >
                <Edit className="h-4 w-4 ml-1" />
                تعديل
              </Button>
            )}
            {onTogglePublication && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTogglePublication}
                className="flex-1 bg-white hover:bg-primary hover:text-white border-gray-300"
                disabled={isToggling}
              >
                {isHidden ? (
                  <>
                    <Eye className="h-4 w-4 ml-1" />
                    إظهار
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 ml-1" />
                    إخفاء
                  </>
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(property.id);
                }}
                className="flex-1 bg-white hover:bg-red-500 hover:text-white border-gray-300"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                حذف
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
