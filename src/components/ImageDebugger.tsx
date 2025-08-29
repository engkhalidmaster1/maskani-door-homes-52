import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, AlertCircle, CheckCircle } from "lucide-react";

interface Property {
  id: string;
  title: string;
  images?: string[] | null;
  property_type: string;
}

interface ImageDebuggerProps {
  property: Property;
}

export const ImageDebugger: React.FC<ImageDebuggerProps> = ({ property }) => {
  const hasImages = property.images && property.images.length > 0;
  
  return (
    <Card className="border-dashed border-2 border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Camera className="w-5 h-5" />
          معلومات تشخيص الصور
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {hasImages ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm">
              حالة الصور: {hasImages ? "موجودة" : "غير موجودة"}
            </span>
            <Badge variant={hasImages ? "default" : "destructive"}>
              {hasImages ? property.images.length : 0} صورة
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div>معرف العقار: {property.id}</div>
            <div>العنوان: {property.title}</div>
            <div>نوع العقار: {property.property_type}</div>
          </div>
          
          {hasImages && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">روابط الصور:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {property.images?.map((url, index) => (
                  <div key={index} className="text-xs bg-white p-2 rounded border">
                    <div className="font-mono break-all">
                      {index + 1}. {url}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!hasImages && (
            <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
              لا توجد صور - سيتم عرض placeholder فارغ
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
