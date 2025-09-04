import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LazyImage } from "@/components/ui/lazy-image";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { Heart, MapPin, BedDouble, Bath, Square, Phone, Eye, Edit, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  created_at: string;
  updated_at: string;
  user_id: string;
  property_code?: string;
  amenities?: string[] | null;
  ownership_type?: string | null;
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div onClick={handleCardClick}>
        {/* Image Section */}
        <div className="relative h-48 bg-gray-100">
          {property.images && property.images.length > 0 ? (
            <LazyImage
              src={getOptimizedImageUrl(property.images[0], 'small')}
              alt={property.title}
              className="w-full h-full object-cover"
              placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E"
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">لا توجد صورة</span>
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
        <CardContent className="p-3">
          {/* Title and Price */}
          <div className="mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {property.title}
            </h3>
            <div className="text-lg font-bold text-primary">
              {formatPrice(property.price)}
            </div>
          </div>

          {/* Location */}
          {property.location && (
            <div className="flex items-center gap-1 text-gray-600 mb-2">
              <MapPin className="h-3 w-3" />
              <span className="text-xs line-clamp-1">{property.location}</span>
            </div>
          )}

          {/* Property Details */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              <span>{property.bathrooms}</span>
            </div>
            {property.area && (
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3" />
                <span>{property.area}م²</span>
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
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/property/${property.id}`);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                عرض
              </Button>

              {(user?.id === property.user_id || onEdit) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
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

              {(user?.id === property.user_id || onDelete) && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) {
                      onDelete(property);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};