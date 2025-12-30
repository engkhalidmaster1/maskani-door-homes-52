import React from "react";
import { Home, Camera, PlusCircle } from "lucide-react";

interface UserStatusHeaderProps {
  userStatus: {
    status: string;
    properties_limit: number;
    images_limit: number;
  };
  getRemainingProperties: () => number;
  canAddProperty: () => boolean;
}

export const UserStatusHeader = React.memo(({ 
  userStatus, 
  getRemainingProperties, 
  canAddProperty 
}: UserStatusHeaderProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border mb-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-3 rounded-lg text-white">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إضافة عقار جديد</h1>
            <p className="text-sm text-gray-600">املأ البيانات أدناه لإضافة عقار جديد</p>
          </div>
        </div>
        
        {/* User Status Info */}
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <span className="text-sm font-medium">
              {userStatus?.status === 'publisher' && '📝 ناشر'}
              {userStatus?.status === 'trusted_owner' && '🏆 مالك موثوق'}
              {userStatus?.status === 'office_agent' && '🏢 مكلف بالنشر'}
            </span>
          </div>
          <div className="bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <Home className="h-4 w-4 text-blue-600" />
            {(() => {
              const limit = userStatus?.properties_limit ?? 0;
              const remaining = getRemainingProperties();
              const isUnlimited = limit === -1;
              return (
                <>
                  <span className="text-sm font-semibold text-blue-700">{isUnlimited ? '∞' : remaining}/{isUnlimited ? '∞' : limit}</span>
                  <span className="text-sm text-blue-600">عقار</span>
                </>
              );
            })()}
          </div>
          <div className="bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <Camera className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{userStatus?.images_limit === -1 ? '∞' : userStatus?.images_limit}</span>
            <span className="text-sm text-green-600">صور</span>
          </div>
          {!canAddProperty() && (
            <div className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="text-red-600 text-sm font-semibold">⚠️ تجاوزت الحد</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});