import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PropertyDetailsProps {
  formData: {
    area: string;
    building: string;
    apartment: string;
    property_type: string;
  };
  onChange: (field: string, value: string) => void;
}

export const PropertyDetailsSection = React.memo(({ formData, onChange }: PropertyDetailsProps) => {
  // إظهار رقم العمارة والشقة فقط للشقق (إخفاؤها للبيوت والمحلات التجارية)
  const isApartment = formData.property_type === 'apartment';

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg border-2 border-emerald-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg shadow-md">
          <span className="text-lg">📐</span>
        </div>
        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          تفاصيل العقار
        </span>
      </h2>

      <div className={`grid grid-cols-1 ${isApartment ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
        {/* المساحة */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors">
          <Label htmlFor="area" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-emerald-500">📏</span>
            المساحة (م²) <span className="text-red-500 text-base">*</span>
          </Label>
          <Input
            id="area"
            type="number"
            value={formData.area}
            onChange={(e) => onChange('area', e.target.value)}
            placeholder="أدخل المساحة"
            className="h-12 border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-lg text-base"
            required
          />
        </div>

        {/* رقم العمارة - يظهر فقط للشقق */}
        {isApartment && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
            <Label htmlFor="building" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="text-blue-500">🏢</span>
              رقم العمارة
            </Label>
            <Input
              id="building"
              value={formData.building}
              onChange={(e) => onChange('building', e.target.value)}
              placeholder="أدخل رقم العمارة"
              className="h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-base"
            />
          </div>
        )}

        {/* رقم الشقة - يظهر فقط للشقق */}
        {isApartment && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100 hover:border-teal-300 transition-colors">
            <Label htmlFor="apartment" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="text-teal-500">🚪</span>
              رقم الشقة
            </Label>
            <Input
              id="apartment"
              value={formData.apartment}
              onChange={(e) => onChange('apartment', e.target.value)}
              placeholder="أدخل رقم الشقة"
              className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-base"
            />
          </div>
        )}
      </div>
    </div>
  );
});