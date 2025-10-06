import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OfflineStatusIndicator() {
  const { isOnline, pendingActions, syncPendingActions, clearPendingActions } = useOfflineSync();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-green-600">متصل بالإنترنت</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-600" />
              <span className="text-red-600">غير متصل بالإنترنت</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* مؤشر حالة المزامنة */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">حالة المزامنة:</span>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "مزامنة تلقائية" : "عمل دون اتصال"}
          </Badge>
        </div>

        {/* الأعمال المعلقة */}
        {pendingActions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                {pendingActions.length} عملية في انتظار المزامنة
              </span>
            </div>
            
            <div className="space-y-2">
              {pendingActions.slice(0, 3).map((action) => (
                <div key={action.id} className="flex items-center gap-2 text-xs p-2 bg-orange-50 rounded-md">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span className="flex-1">
                    {action.type === 'CREATE' && 'إنشاء عنصر جديد'}
                    {action.type === 'UPDATE' && 'تحديث عنصر'}
                    {action.type === 'DELETE' && 'حذف عنصر'}
                  </span>
                  <span className="text-orange-600">
                    محاولة {action.retryCount + 1}
                  </span>
                </div>
              ))}
              
              {pendingActions.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  و {pendingActions.length - 3} عملية أخرى...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isOnline && (
                <Button
                  size="sm"
                  onClick={syncPendingActions}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  مزامنة الآن
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearPendingActions}
                className="flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                مسح القائمة
              </Button>
            </div>
          </div>
        )}

        {/* رسالة عدم وجود أعمال معلقة */}
        {pendingActions.length === 0 && isOnline && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>جميع البيانات محدثة</span>
          </div>
        )}

        {/* نصائح للعمل دون اتصال */}
        {!isOnline && (
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
            <p className="font-medium mb-1">نصائح للعمل دون اتصال:</p>
            <ul className="space-y-1">
              <li>• يمكنك إضافة وتعديل العقارات</li>
              <li>• ستحفظ التغييرات محلياً</li>
              <li>• ستتم المزامنة تلقائياً عند عودة الاتصال</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
