import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyStatusBadge } from "@/components/Property/PropertyStatusBadge";
import { Building, Home as HomeIcon, MapPin, Bed, Bath, Ruler, Heart, Store, GitCompareArrows } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { getMarketLabel, resolveMarketValue } from "@/constants/markets";
import { useCompare } from "@/context/CompareContext";

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
  market?: string | null;
  amenities?: string[] | null;
  images?: string[] | null;
  is_published: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
  marketLabel?: string | null;
}

interface HomePropertyCardProps {
  property: Property;
}

export const HomePropertyCard = ({ property }: HomePropertyCardProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { has: isInCompare, toggle: toggleCompare } = useCompare();
  const [isToggling, setIsToggling] = useState(false);
  const navigate = useNavigate();
  const resolvedMarket = resolveMarketValue(property.market ?? property.location ?? property.address ?? undefined);
  const marketLabel = resolvedMarket ? getMarketLabel(resolvedMarket) : null;

  const getPropertyIcon = () => {
    switch (property.property_type) {
      case "apartment": return <Building className="h-8 w-8 md:h-12 md:w-12" />;
      case "house":
      case "villa": return <HomeIcon className="h-8 w-8 md:h-12 md:w-12" />;
      default: return <HomeIcon className="h-8 w-8 md:h-12 md:w-12" />;
    }
  };

  const fav = isFavorite(property.id);
  const compared = isInCompare(property.id);

  return (
    <Card className="overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 group relative border border-border">
      {/* Action buttons */}
      {user && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 z-10 flex gap-1.5">
          <button
            title={fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isToggling) {
                setIsToggling(true);
                toggleFavorite(property.id).finally(() => setIsToggling(false));
              }
            }}
            disabled={isToggling}
            className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${
              fav ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${fav ? 'fill-current' : ''}`} />
          </button>
          <button
            title={compared ? "إزالة من المقارنة" : "إضافة للمقارنة"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleCompare({
                id: property.id,
                title: property.title,
                property_type: property.property_type,
                listing_type: property.listing_type,
                price: property.price,
                area: property.area,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                location: property.location,
                address: property.address,
                images: property.images,
                furnished: (property as any).furnished,
                amenities: property.amenities,
                market: property.market,
                status: property.status,
                created_at: property.created_at,
              });
            }}
            className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 ${
              compared ? 'text-primary ring-2 ring-primary/30' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <GitCompareArrows className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      )}

      {/* Clickable area */}
      <div onClick={() => navigate(`/property/${property.id}`)} className="cursor-pointer">
        {/* Image */}
        <div className="relative h-36 md:h-48 overflow-hidden">
          {(() => {
            const imageUrl = property.images?.[0];
            return imageUrl ? (
              <img
                src={imageUrl}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-bg') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : (
              <div className="fallback-bg w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                {getPropertyIcon()}
                <span className="text-xs mt-2 text-muted-foreground">بلا صورة</span>
              </div>
            );
          })()}

          {/* Listing type badge */}
          <Badge
            className={`absolute top-2 md:top-3 right-2 md:right-3 text-[10px] md:text-xs font-bold backdrop-blur-sm ${
              property.listing_type === "sale"
                ? "bg-destructive text-destructive-foreground"
                : "bg-green-600 text-white"
            }`}
          >
            {property.listing_type === "sale" ? "للبيع" : "للإيجار"}
          </Badge>
        </div>

        {/* Details */}
        <div className="p-3 md:p-4 bg-card">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3" dir="rtl">
            <h3 className="text-sm md:text-lg font-bold text-card-foreground line-clamp-1 flex-1">
              {property.title}
            </h3>
            <span className="text-xs md:text-base font-bold text-primary bg-primary/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap shrink-0">
              {formatCurrency(property.price)}
            </span>
          </div>

          {/* Location */}
          {(property.location || marketLabel) && (
            <div className="mb-2 md:mb-3 space-y-1" dir="rtl">
              {property.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 ml-1 text-primary shrink-0" />
                  <span className="text-xs md:text-sm line-clamp-1">{property.location}</span>
                </div>
              )}
              {marketLabel && (
                <div className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full">
                  <Store className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  <span>قرب {marketLabel}</span>
                </div>
              )}
            </div>
          )}

          {/* Features row */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap border-t border-border pt-2 md:pt-3">
            <div className="flex items-center gap-1 bg-secondary px-1.5 md:px-2 py-0.5 md:py-1 rounded text-secondary-foreground">
              <Bed className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-sm font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1 bg-secondary px-1.5 md:px-2 py-0.5 md:py-1 rounded text-secondary-foreground">
              <Bath className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-sm font-medium">{property.bathrooms}</span>
            </div>
            {property.area && (
              <div className="flex items-center gap-1 bg-secondary px-1.5 md:px-2 py-0.5 md:py-1 rounded text-secondary-foreground">
                <Ruler className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-[10px] md:text-sm font-medium">{property.area} م²</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
