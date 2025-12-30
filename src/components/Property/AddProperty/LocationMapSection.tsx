import React, { Suspense, lazy } from "react";

// Lazy load MapPicker for better performance
const MapPicker = lazy(() => import("@/components/MapPicker").then(module => ({ default: module.MapPicker })));

interface LocationMapSectionProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  location: string;
  governorate?: string;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

export const LocationMapSection = React.memo(({
  latitude,
  longitude,
  address,
  location,
  governorate,
  onLocationSelect
}: LocationMapSectionProps) => {
  const hasValidPosition =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        تحديد الموقع على الخريطة
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        اضغط على الخريطة لتحديد الموقع الدقيق للعقار
      </p>
      <div className="rounded-lg overflow-hidden border">
        <Suspense
          fallback={
            <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">جاري تحميل الخريطة...</p>
              </div>
            </div>
          }
        >
          <MapPicker
            onLocationSelect={onLocationSelect}
            initialPosition={hasValidPosition ? [latitude!, longitude!] : undefined}
            height="400px"
            governorate={governorate as "" | "duhok" | "erbil" | "sulaymaniyah" | undefined}
          />
        </Suspense>
      </div>
      {hasValidPosition && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            ✅ تم تحديد الموقع بنجاح
          </p>
          <p className="text-xs text-green-600 mt-1">
            خط العرض: {latitude!.toFixed(6)} | خط الطول: {longitude!.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
});