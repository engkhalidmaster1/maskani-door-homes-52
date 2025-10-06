import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Home as HomeIcon, Layers, Store, MapPin, Bed, Bath, Ruler, Heart, CheckSquare, Square, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

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
  const navigate = useNavigate();

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
    <Card className="overflow-hidden hover-lift shadow-card group relative">
      {/* Actions Buttons */}
      {showActions && (
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(property.id);
              }}
              className="bg-white hover:bg-primary hover:text-white"
            >
              <Edit className="h-4 w-4" />
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
              className="bg-white hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onTogglePublication && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTogglePublication(property.id, property.is_published);
              }}
              className="bg-white hover:bg-primary hover:text-white"
            >
              {property.is_published ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* Selection Checkbox */}
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

      {/* Favorite Button */}
      {user && (
        <button
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
      <div onClick={() => navigate(`/property/${property.id}`)} className="cursor-pointer">
        {/* Property Image/Icon */}
        <div className="relative h-48 overflow-hidden">
          {(() => {
            const imageUrl = property.images?.[0];
            return imageUrl ? (
              <img
                src={imageUrl}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-bg') as HTMLElement;
                  if (fallbackDiv) fallbackDiv.style.display = 'flex';
                }}
              />
            ) : (
              <div className="fallback-bg w-full h-full flex items-center justify-center bg-muted">
                {getPropertyIcon()}
              </div>
            );
          })()}
        </div>

        {/* Property Info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={property.listing_type === "sale" ? "default" : "outline"}>
              {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
            </Badge>
            <span className="text-xl font-bold text-primary">
              {formatPrice(property.price)}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-2">{property.title}</h3>

          {property.location && (
            <div className="flex items-center text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 ml-1" />
              <span>{property.location}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center">
              <Bed className="h-4 w-4 ml-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 ml-1" />
              <span>{property.bathrooms}</span>
            </div>
            {property.area && (
              <div className="flex items-center">
                <Ruler className="h-4 w-4 ml-1" />
                <span>{property.area} م²</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
