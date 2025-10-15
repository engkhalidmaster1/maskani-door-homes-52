import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "lucide-react";
import { MARKET_OPTIONS, MarketOption } from "@/constants/markets";

interface PriceAndLocationSectionProps {
  formData: {
    price: string;
    market: string;
  };
  onChange: (field: string, value: string) => void;
  isAdmin: boolean;
  selectedMarketOption?: MarketOption | null;
  locationPreview?: string;
  addressPreview?: string;
}

export const PriceAndLocationSection = React.memo(({ 
  formData, 
  onChange, 
  isAdmin,
  selectedMarketOption,
  locationPreview,
  addressPreview 
}: PriceAndLocationSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-lg border-2 border-amber-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-lg shadow-md">
          <span className="text-lg">💰</span>
        </div>
        <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          السعر والموقع
        </span>
      </h2>
      
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* السوق - للمدير فقط */}
        {isAdmin && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100 hover:border-teal-300 transition-colors">
            <Label htmlFor="market" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="text-teal-500">🏪</span>
              قرب أي سوق <span className="text-red-500 text-base">*</span>
            </Label>
            <Select
              value={formData.market}
              onValueChange={(value) => onChange('market', value)}
              required
            >
              <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg">
                <SelectValue placeholder="اختر السوق" />
              </SelectTrigger>
              <SelectContent>
                {MARKET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.icon ? `${option.icon} ` : ""}{option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMarketOption && (
              <div className="mt-3 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
                  <Store className="h-5 w-5" />
                  {selectedMarketOption.icon && (
                    <span className="text-lg">{selectedMarketOption.icon}</span>
                  )}
                  <span>{selectedMarketOption.label}</span>
                </div>
                {locationPreview && (
                  <p className="mt-2 text-sm text-teal-700">
                    📍 الموقع: <span className="font-semibold">{locationPreview}</span>
                  </p>
                )}
                {addressPreview && (
                  <p className="mt-1 text-sm text-teal-600">
                    🗺️ العنوان: <span className="font-medium">{addressPreview}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* السعر */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-100 hover:border-amber-300 transition-colors">
          <Label htmlFor="price" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-amber-500">💵</span>
            السعر (دينار عراقي) <span className="text-red-500 text-base">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => onChange('price', e.target.value)}
            placeholder="أدخل السعر بالدينار العراقي"
            className="h-12 border-2 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-lg text-base"
            required
          />
        </div>
      </div>
    </div>
  );
});