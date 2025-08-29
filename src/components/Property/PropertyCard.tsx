import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Home as HomeIcon, Layers, Store, MapPin, Bed, Bath, Ruler, Heart, CheckSquare, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { getImageForProperty, hasValidImages, getValidImages, getPropertyDefaultImage } from "@/utils/imageUtils";

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
  created_at: string;
  updated_at: string;
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
}

export const PropertyCard = ({ 
  property, 
  showActions = false,
  onEdit,
  onDelete,
  onTogglePublication,
  showCheckbox = false,
  isSelected = false,
  onSelectionChange
}: PropertyCardProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Handle non-authenticated user
      return;
    }

    setIsToggling(true);
    await toggleFavorite(property.id);
    setIsToggling(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(price);
  };

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

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="overflow-hidden hover-lift shadow-card group cursor-pointer relative">
        {/* Selection Checkbox - Top Left */}
        {showCheckbox && (
          <button
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

        {/* Favorite Button - Top Left (or Right if checkbox is shown) */}
        {user && (
          <button
            onClick={handleToggleFavorite}
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

        {/* Property Image/Icon */}
        <div className="relative h-48 overflow-hidden">
          {(() => {
            const imageToShow = getImageForProperty(property.images, property.property_type, 0);
            
            if (imageToShow) {
              // عرض الصورة المرفوعة
              return (
                <img
                  src={imageToShow}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-bg') as HTMLElement;
                    if (fallbackDiv) fallbackDiv.style.display = 'flex';
                  }}
                />
              );
            } else {
              // عرض placeholder إذا لم توجد صور مرفوعة
              return null; // سيظهر الـ fallback-bg
            }
          })()}
          
          {/* Placeholder for properties without images */}
          <div className="fallback-bg bg-gray-100 text-gray-400 h-full flex items-center justify-center" style={{display: !getImageForProperty(property.images, property.property_type, 0) ? 'flex' : 'none'}}>
            <div className="text-center opacity-60 group-hover:opacity-80 transition-opacity">
              {getPropertyIcon()}
              <p className="text-xs mt-2 font-medium">بدون صورة</p>
            </div>
          </div>

          {/* Property Code */}
          {(property as any).property_code && (
            <div className="absolute top-3 right-3 bg-primary/90 text-white px-2 py-1 rounded text-xs font-mono">
              {(property as any).property_code}
            </div>
          )}

          {/* Image count indicator */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {property.images.length} صور
            </div>
          )}

          <Badge
            variant={property.listing_type === "sale" ? "default" : "secondary"}
            className={`absolute top-4 right-4 ${
              property.listing_type === "sale"
                ? "bg-success text-success-foreground"
                : "bg-warning text-warning-foreground"
            }`}
          >
            {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
          </Badge>
          
          {!property.is_published && (
            <Badge
              variant="secondary"
              className="absolute top-4 left-16 bg-muted text-muted-foreground"
            >
              غير منشور
            </Badge>
          )}
        </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3 text-card-foreground">
          {property.title}
        </h3>
        
        <Badge variant="outline" className="mb-3 gradient-primary text-primary-foreground border-0">
          {property.property_type === "apartment" ? "شقة" : 
           property.property_type === "house" ? "بيت" : 
           property.property_type === "villa" ? "فيلا" : "عقار"}
        </Badge>

        {property.location && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.location}</span>
          </div>
        )}

        {property.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {property.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            <span>{property.bedrooms} غرف نوم</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms} حمام</span>
          </div>
          {property.area && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span>{property.area} م²</span>
            </div>
          )}
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{property.amenities.length - 3} المزيد
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="text-2xl font-bold text-primary mt-4">
          {formatPrice(property.price)}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(property.id);
                }}
                className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                تعديل
              </button>
            )}
            
            {onTogglePublication && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublication(property.id, property.is_published);
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                  property.is_published
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    : "bg-success text-success-foreground hover:bg-success/90"
                }`}
              >
                {property.is_published ? "إخفاء" : "نشر"}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(property.id);
                }}
                className="flex-1 bg-destructive text-destructive-foreground px-3 py-2 rounded-md text-sm hover:bg-destructive/90 transition-colors"
              >
                حذف
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
    </Link>
  );
};