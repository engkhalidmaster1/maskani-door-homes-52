import React from "react";
import { NumberSelector, FLOOR_QUICK_OPTIONS, BEDROOM_QUICK_OPTIONS } from "@/components/ui/number-selector";

interface FloorAndRoomsSectionProps {
  formData: {
    floor: string;
    bedrooms: string;
    property_type: string;
  };
  onChange: (field: string, value: string) => void;
}

export const FloorAndRoomsSection = React.memo(({ formData, onChange }: FloorAndRoomsSectionProps) => {
  // إظهار الطابق وغرف النوم فقط للشقق والبيوت (إخفاؤها للمحلات التجارية)
  const isCommercial = formData.property_type === 'commercial';
  const isApartment = formData.property_type === 'apartment';

  // إخفاء القسم بالكامل للمحلات التجارية
  if (isCommercial) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl shadow-lg border-2 border-rose-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-lg shadow-md">
          <span className="text-lg">🏠</span>
        </div>
        <span className="bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
          {isApartment ? 'الطابق وعدد الغرف' : 'عدد الغرف'}
        </span>
      </h2>

      <div className={`grid grid-cols-1 ${isApartment ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* اختيار الطابق - يظهر فقط للشقق */}
        {isApartment && (
          <NumberSelector
            label="اختيار الطابق"
            value={formData.floor}
            onChange={(value) => onChange('floor', value)}
            quickOptions={FLOOR_QUICK_OPTIONS}
            customLabel="طابق آخر"
            customPlaceholder="مثال: 5, 10, 25"
            maxValue={50}
            minValue={0}
            required
            icon="🏢"
            colorScheme="rose"
          />
        )}

        {/* غرف النوم */}
        <NumberSelector
          label="غرف النوم"
          value={formData.bedrooms}
          onChange={(value) => onChange('bedrooms', value)}
          quickOptions={BEDROOM_QUICK_OPTIONS}
          customLabel="عدد آخر"
          customPlaceholder="مثال: 6, 8, 10"
          maxValue={20}
          minValue={1}
          required
          icon="🛏️"
          colorScheme="cyan"
        />
      </div>
    </div>
  );
});