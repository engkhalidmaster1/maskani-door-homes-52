import React from "react";
import { Input } from "@/components/ui/input";
import { Camera, Zap, HardDrive } from "lucide-react";

interface PropertyImagesSectionProps {
  selectedImages: File[];
  imagePreviewUrls: string[];
  userStatus: {
    images_limit: number;
  } | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export const PropertyImagesSection = React.memo(({ 
  selectedImages,
  imagePreviewUrls,
  userStatus,
  onImageChange,
  onRemoveImage
}: PropertyImagesSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  صور العقار
                  <span className="text-sm font-normal text-gray-500">(اختياري)</span>
                </h2>
                <div className="flex items-center gap-3">
                  {
                    (() => {
                      const rawLimit = userStatus?.images_limit;
                      const limit = rawLimit === undefined || rawLimit === null ? 2 : rawLimit;
                      const displayLimit = limit < 0 ? '∞' : limit;
                      return (
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                          <Camera className="h-3 w-3" />
                          {selectedImages.length} / {displayLimit}
                        </span>
                      );
                    })()
                  }
                  {selectedImages.length > 0 && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      محسّنة
                    </span>
                  )}
                </div>
              </div>      <div className="space-y-4">
                  <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={onImageChange}
          className="h-11 cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-blue-500 
                     file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm 
                     file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={(() => {
            const rawLimit = userStatus?.images_limit;
            const limit = rawLimit === undefined || rawLimit === null ? 2 : rawLimit;
            // إذا كان الحد سالباً => غير محدود => لا يتم تعطيل
            if (limit < 0) return false;
            return selectedImages.length >= limit;
          })()}
        />
        
                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`معاينة ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 
                                     flex items-center justify-center text-sm hover:bg-red-600 
                                     opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Zap className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Image Stats */}
                    {selectedImages.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3 w-3" />
                          <span>إجمالي: {(selectedImages.reduce((total, img) => total + img.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">محسّن للرفع</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}        {selectedImages.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">لم يتم اختيار صور بعد</p>
          </div>
        )}
      </div>
    </div>
  );
});