import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  User
} from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  listing_type: "sale" | "rent";
  images: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  amenities: string[];
  user_id: string;
}

interface PropertyCardMobileProps {
  property: Property;
  showActions?: boolean;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (propertyId: string) => void;
  onTogglePublication?: (propertyId: string, currentStatus: boolean) => void;
  onSelectionChange?: (property: Property, selected: boolean) => void;
}

export const PropertyCardMobile = ({
  property,
  showActions = false,
  showCheckbox = false,
  isSelected = false,
  onEdit,
  onDelete,
  onTogglePublication,
  onSelectionChange,
}: PropertyCardMobileProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(property.id);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(property, e.target.checked);
  };

  return (
    <Card className="group hover-lift shadow-card overflow-hidden">
      <div className="relative">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">لا توجد صورة</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Badge 
            variant={property.listing_type === "sale" ? "default" : "secondary"}
            className="text-xs"
          >
            {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
          </Badge>
          {!property.is_published && (
            <Badge variant="outline" className="text-xs bg-background/90">
              غير منشور
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className={`p-1.5 rounded-full shadow-md transition-colors ${
                isFavorite(property.id)
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-background/90 text-muted-foreground hover:bg-background hover:text-red-500"
              }`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`h-3 w-3 ${isFavorite(property.id) ? "fill-current" : ""}`} />
            </Button>
          )}
          
          {showCheckbox && (
            <div className="bg-background/90 p-1 rounded">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="w-4 h-4"
              />
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        {/* Title & Price */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {property.title}
          </h3>
          <p className="text-lg font-bold text-primary">
            {formatPrice(property.price)}
          </p>
        </div>

        {/* Location */}
        {property.location && (
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs line-clamp-1">{property.location}</span>
          </div>
        )}

        {/* Property Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            <span>{property.bathrooms}</span>
          </div>
          {property.area && (
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              <span>{property.area} م²</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Link to={`/property/${property.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs h-7">
              <Eye className="h-3 w-3 mr-1" />
              عرض
            </Button>
          </Link>

          {showActions && (
            <>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(property);
                  }}
                  className="px-2 h-7"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}

              {onTogglePublication && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onTogglePublication(property.id, property.is_published);
                  }}
                  className="px-2 h-7"
                >
                  {property.is_published ? (
                    <XCircle className="h-3 w-3 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(property.id);
                  }}
                  className="px-2 h-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};