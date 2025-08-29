import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Home as HomeIcon, Layers, Store, MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";

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
}

export const PropertyCard = ({ 
  property, 
  showActions = false,
  onEdit,
  onDelete,
  onTogglePublication
}: PropertyCardProps) => {
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
      <Card className="overflow-hidden hover-lift shadow-card group cursor-pointer">
      {/* Property Image/Icon */}
      <div className="gradient-primary text-primary-foreground h-48 flex items-center justify-center relative">
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
            className="absolute top-4 left-4 bg-muted text-muted-foreground"
          >
            غير منشور
          </Badge>
        )}
        
        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          {getPropertyIcon()}
        </div>
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