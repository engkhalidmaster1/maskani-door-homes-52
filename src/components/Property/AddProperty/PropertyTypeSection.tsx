import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PropertyTypeSectionProps {
  formData: {
    property_type: string;
    listing_type: string;
  };
  onChange: (field: string, value: string) => void;
  onTypeChange: (value: string) => void;
}

export const PropertyTypeSection = React.memo(({ formData, onChange, onTypeChange }: PropertyTypeSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg shadow-md">
          <span className="text-lg">🏘️</span>
        </div>
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          تصنيف العقار
        </span>
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نوع العقار */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-purple-500">🏗️</span>
            نوع العقار <span className="text-red-500 text-base">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant={formData.property_type === "apartment" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.property_type === "apartment" 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400"
              }`}
              onClick={() => onChange('property_type', 'apartment')}
            >
              🏢 شقة
            </Button>
            <Button
              type="button"
              variant={formData.property_type === "house" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.property_type === "house" 
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400"
              }`}
              onClick={() => onChange('property_type', 'house')}
            >
              🏠 بيت
            </Button>
            <Button
              type="button"
              variant={formData.property_type === "commercial" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.property_type === "commercial" 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-400"
              }`}
              onClick={() => onChange('property_type', 'commercial')}
            >
              🏪 محل تجاري
            </Button>
          </div>
        </div>

        {/* نوع العرض */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-purple-500">💼</span>
            نوع العرض <span className="text-red-500 text-base">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={formData.listing_type === "sale" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.listing_type === "sale" 
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-yellow-50 hover:border-yellow-400"
              }`}
              onClick={() => onTypeChange("sale")}
            >
              💰 للبيع
            </Button>
            <Button
              type="button"
              variant={formData.listing_type === "rent" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.listing_type === "rent" 
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-400"
              }`}
              onClick={() => onTypeChange("rent")}
            >
              🏠 للإيجار
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});