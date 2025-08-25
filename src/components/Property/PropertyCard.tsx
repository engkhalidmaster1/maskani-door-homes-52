import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Home as HomeIcon, Layers, Store } from "lucide-react";

interface Property {
  id: string;
  title: string;
  type: "sale" | "rent";
  building: string;
  apartment: string;
  floor: string;
  market: string;
  price: string;
  furnished?: "yes" | "no";
  icon: "home" | "building" | "house-user";
}

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const getIcon = () => {
    switch (property.icon) {
      case "building":
        return <Building className="h-12 w-12" />;
      case "house-user":
        return <HomeIcon className="h-12 w-12" />;
      default:
        return <HomeIcon className="h-12 w-12" />;
    }
  };

  return (
    <Card className="overflow-hidden hover-lift shadow-card group cursor-pointer">
      {/* Property Image/Icon */}
      <div className="gradient-primary text-primary-foreground h-48 flex items-center justify-center relative">
        <Badge
          variant={property.type === "sale" ? "default" : "secondary"}
          className={`absolute top-4 right-4 ${
            property.type === "sale"
              ? "bg-success text-success-foreground"
              : "bg-warning text-warning-foreground"
          }`}
        >
          {property.type === "sale" ? "للبيع" : "للإيجار"}
        </Badge>
        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          {getIcon()}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3 text-card-foreground">
          {property.title}
        </h3>
        
        <Badge variant="outline" className="mb-3 gradient-primary text-primary-foreground border-0">
          مجمع الدور
        </Badge>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>العمارة: {property.building}</span>
          </div>
          <div className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            <span>الشقة: {property.apartment}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>الطابق: {property.floor}</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>قرب سوق: {property.market}</span>
          </div>
        </div>

        {property.furnished && (
          <Badge
            variant="outline"
            className={`mb-4 ${
              property.furnished === "yes"
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {property.furnished === "yes" ? "مؤثثة" : "غير مؤثثة"}
          </Badge>
        )}

        <div className="text-2xl font-bold text-primary mt-4">
          {property.price}
        </div>
      </div>
    </Card>
  );
};