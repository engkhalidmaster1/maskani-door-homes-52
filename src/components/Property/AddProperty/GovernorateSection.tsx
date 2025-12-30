import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// حدود المحافظات الجغرافية (Bounding Boxes)
export const GOVERNORATE_BOUNDS = {
    erbil: {
        name: 'أربيل',
        nameEn: 'Erbil',
        center: { lat: 36.1911, lng: 44.0094 },
        bounds: {
            north: 36.65,
            south: 35.75,
            east: 44.50,
            west: 43.55
        }
    },
    duhok: {
        name: 'دهوك',
        nameEn: 'Duhok',
        center: { lat: 36.8677, lng: 42.9874 },
        bounds: {
            north: 37.35,
            south: 36.40,
            east: 43.50,
            west: 42.50
        }
    },
    sulaymaniyah: {
        name: 'سليمانية',
        nameEn: 'Sulaymaniyah',
        center: { lat: 35.5559, lng: 45.4377 },
        bounds: {
            north: 36.00,
            south: 35.10,
            east: 45.90,
            west: 44.95
        }
    }
} as const;

export type GovernorateType = keyof typeof GOVERNORATE_BOUNDS;

interface GovernorateSectionProps {
    selectedGovernorate: GovernorateType | '';
    onChange: (governorate: GovernorateType) => void;
}

export const GovernorateSection = ({ selectedGovernorate, onChange }: GovernorateSectionProps) => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
                    <span className="text-lg">📍</span>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    اختيار المحافظة
                </span>
                <span className="text-red-500 text-base">*</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* أربيل */}
                <Button
                    type="button"
                    variant={selectedGovernorate === 'erbil' ? 'default' : 'outline'}
                    className={`h-20 text-lg font-bold transition-all duration-300 ${selectedGovernorate === 'erbil'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'hover:bg-blue-50 hover:border-blue-400'
                        }`}
                    onClick={() => onChange('erbil')}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">🏛️</span>
                        <span>أربيل</span>
                        <span className="text-xs opacity-75">Erbil</span>
                    </div>
                </Button>

                {/* دهوك */}
                <Button
                    type="button"
                    variant={selectedGovernorate === 'duhok' ? 'default' : 'outline'}
                    className={`h-20 text-lg font-bold transition-all duration-300 ${selectedGovernorate === 'duhok'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                            : 'hover:bg-green-50 hover:border-green-400'
                        }`}
                    onClick={() => onChange('duhok')}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">⛰️</span>
                        <span>دهوك</span>
                        <span className="text-xs opacity-75">Duhok</span>
                    </div>
                </Button>

                {/* سليمانية */}
                <Button
                    type="button"
                    variant={selectedGovernorate === 'sulaymaniyah' ? 'default' : 'outline'}
                    className={`h-20 text-lg font-bold transition-all duration-300 ${selectedGovernorate === 'sulaymaniyah'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                            : 'hover:bg-purple-50 hover:border-purple-400'
                        }`}
                    onClick={() => onChange('sulaymaniyah')}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">🏔️</span>
                        <span>سليمانية</span>
                        <span className="text-xs opacity-75">Sulaymaniyah</span>
                    </div>
                </Button>
            </div>

            {selectedGovernorate && (
                <div className="mt-4 p-3 bg-white rounded-lg border-2 border-blue-300 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-gray-700 text-center">
                        ✅ تم اختيار: <span className="font-bold text-blue-600">{GOVERNORATE_BOUNDS[selectedGovernorate].name}</span>
                        <br />
                        <span className="text-xs text-gray-500">
                            سيتم التحقق من أن موقع العقار على الخريطة يقع ضمن حدود {GOVERNORATE_BOUNDS[selectedGovernorate].name}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * دالة للتحقق من أن الإحداثيات تقع ضمن حدود المحافظة
 */
export function isLocationInGovernorate(
    lat: number,
    lng: number,
    governorate: GovernorateType
): boolean {
    const bounds = GOVERNORATE_BOUNDS[governorate].bounds;

    return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
    );
}

/**
 * دالة للحصول على اسم المحافظة بالعربية
 */
export function getGovernorateName(governorate: GovernorateType): string {
    return GOVERNORATE_BOUNDS[governorate].name;
}
