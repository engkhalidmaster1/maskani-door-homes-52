import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdditionalDetailsSectionProps {
  formData: {
    furnished: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  showFurnishedField: boolean;
}

export const AdditionalDetailsSection = React.memo(({ 
  formData, 
  onChange, 
  showFurnishedField 
}: AdditionalDetailsSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        تفاصيل إضافية
      </h2>
      
      <div className="space-y-6">
        {/* نوع الأثاث - يظهر فقط للإيجار */}
        {showFurnishedField && (
          <div>
            <Label htmlFor="furnished" className="block text-sm font-medium text-gray-700 mb-2">
              نوع الأثاث
            </Label>
            <Select
              value={formData.furnished}
              onValueChange={(value) => onChange('furnished', value)}
              required={showFurnishedField}
            >
              <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">🛋️ مؤثثة</SelectItem>
                <SelectItem value="no">📦 غير مؤثثة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* وصف العقار */}
        <div>
          <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            وصف العقار <span className="text-gray-500 text-sm">(اختياري)</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="أضف وصفاً مفصلاً للعقار..."
            rows={4}
            className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
});