import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BasicInfoSectionProps {
  formData: {
    title: string;
  };
  onChange: (field: string, value: string) => void;
}

export const BasicInfoSection = React.memo(({ formData, onChange }: BasicInfoSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
          <span className="text-lg">📝</span>
        </div>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          المعلومات الأساسية
        </span>
      </h2>
      
      <div className="grid grid-cols-1 gap-6">
        {/* عنوان العقار */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
          <Label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-blue-500">🏷️</span>
            عنوان العقار <span className="text-red-500 text-base">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="أدخل عنوان جذاب للعقار..."
            className="h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-base"
            required
          />
        </div>
      </div>
    </div>
  );
});