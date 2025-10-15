import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
          <div className="bg-white rounded-lg p-4 shadow-sm border border-rose-100 hover:border-rose-300 transition-colors">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="text-rose-500">🏢</span>
              اختيار الطابق <span className="text-red-500 text-base">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formData.floor === "الأرضي" ? "default" : "outline"}
                className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                  formData.floor === "الأرضي" 
                    ? "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white border-0 shadow-md scale-105" 
                    : "border-2 border-gray-300 text-gray-700 hover:bg-slate-50 hover:border-slate-400"
                }`}
                onClick={() => onChange('floor', 'الأرضي')}
              >
                🏢 الأرضي
              </Button>
              <Button
                type="button"
                variant={formData.floor === "الطابق الأول" ? "default" : "outline"}
                className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                  formData.floor === "الطابق الأول" 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md scale-105" 
                    : "border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400"
                }`}
                onClick={() => onChange('floor', 'الطابق الأول')}
              >
                1️⃣ الأول
              </Button>
              <Button
                type="button"
                variant={formData.floor === "الطابق الثاني" ? "default" : "outline"}
                className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                  formData.floor === "الطابق الثاني" 
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0 shadow-md scale-105" 
                    : "border-2 border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400"
                }`}
                onClick={() => onChange('floor', 'الطابق الثاني')}
              >
                2️⃣ الثاني
              </Button>
              <Button
                type="button"
                variant={formData.floor === "الطابق الثالث" ? "default" : "outline"}
                className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                  formData.floor === "الطابق الثالث" 
                    ? "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white border-0 shadow-md scale-105" 
                    : "border-2 border-gray-300 text-gray-700 hover:bg-violet-50 hover:border-violet-400"
                }`}
                onClick={() => onChange('floor', 'الطابق الثالث')}
              >
                3️⃣ الثالث
              </Button>
            </div>
          </div>
        )}

        {/* غرف النوم */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-cyan-100 hover:border-cyan-300 transition-colors">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-cyan-500">🛏️</span>
            غرف النوم <span className="text-red-500 text-base">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={formData.bedrooms === "1" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.bedrooms === "1" 
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-cyan-50 hover:border-cyan-400"
              }`}
              onClick={() => onChange('bedrooms', '1')}
            >
              🛏️ غرفة واحدة
            </Button>
            <Button
              type="button"
              variant={formData.bedrooms === "2" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.bedrooms === "2" 
                  ? "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-sky-50 hover:border-sky-400"
              }`}
              onClick={() => onChange('bedrooms', '2')}
            >
              🛏️ غرفتان
            </Button>
            <Button
              type="button"
              variant={formData.bedrooms === "3" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.bedrooms === "3" 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400"
              }`}
              onClick={() => onChange('bedrooms', '3')}
            >
              🛏️ 3 غرف
            </Button>
            <Button
              type="button"
              variant={formData.bedrooms === "4" ? "default" : "outline"}
              className={`h-12 text-sm font-semibold shadow-sm transition-all duration-200 ${
                formData.bedrooms === "4" 
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0 shadow-md scale-105" 
                  : "border-2 border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400"
              }`}
              onClick={() => onChange('bedrooms', '4')}
            >
              🛏️ 4 غرف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});