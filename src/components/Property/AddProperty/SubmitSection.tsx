import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface SubmitSectionProps {
  isLoading: boolean;
  canAddProperty: () => boolean;
  userStatus: {
    properties_limit: number;
  } | null;
  onReset: () => void;
}

export const SubmitSection = React.memo(({ 
  isLoading, 
  canAddProperty, 
  userStatus, 
  onReset 
}: SubmitSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          type="submit" 
          className="flex-1 h-12 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white 
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" 
          disabled={isLoading || !canAddProperty()}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              جاري النشر...
            </>
          ) : !canAddProperty() ? (
            <>
              <span className="mr-2">⚠️</span>
              تجاوزت الحد المسموح
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              نشر العقار
            </>
          )}
        </Button>
        
        <Button 
          type="button" 
          variant="outline"
          className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onReset}
        >
          إعادة تعيين
        </Button>
      </div>
      
      {!canAddProperty() && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ⚠️ لقد وصلت إلى الحد الأقصى للعقارات المسموحة ({userStatus?.properties_limit}). 
            اتصل بالإدارة لترقية حسابك.
          </p>
        </div>
      )}
    </div>
  );
});