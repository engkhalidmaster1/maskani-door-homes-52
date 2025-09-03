import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Home as HomeIcon, MapPin, Bed, Bath, Ruler, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface HomePropertyCardProps {
  property: Property;
}

export const HomePropertyCard = ({ property }: HomePropertyCardProps) => {
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
    <Card className="overflow-hidden hover-lift shadow-md group relative border-2 border-gray-100">
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
          className={`absolute top-3 left-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${
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

          {/* Status Badges */}
          <Badge
            variant="default"
            className={`absolute top-3 right-3 backdrop-blur-sm font-bold ${
              property.listing_type === "sale" 
                ? "bg-red-500 text-white" 
                : "bg-green-500 text-white"
            }`}
          >
            {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
          </Badge>
        </div>

        {/* Property Details */}
        <div className="p-4 bg-white">
          {/* Title and Price */}
          <div className="flex items-center justify-between mb-3 flex-row-reverse border-b pb-3 border-gray-200">
            <div className="text-right w-3/5">
              <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{property.title}</h3>
            </div>
            <div className="w-2/5 text-left">
              <span className="text-xl font-bold text-primary bg-blue-50 px-2 py-1 rounded">
                {formatPrice(property.price)}
              </span>
            </div>
          </div>

          {/* Location */}
          {property.location && (
            <div className="flex items-center mb-3 flex-row-reverse text-right">
              <MapPin className="h-4 w-4 ml-1 text-blue-500" />
              <span className="text-gray-700 text-sm line-clamp-1">{property.location}</span>
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
          </div>
        </div>
      </div>
    </Card>
  );
};
