import { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();

  // دالة حذف الإشعار من Supabase
  const handleDelete = async (id: string) => {
    if (window.confirm('هل تريد حذف هذا الإشعار نهائياً؟')) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (!error) {
        window.location.reload();
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  // إغلاق النافذة عند الضغط على Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  // طلب إذن الإشعارات من المتصفح
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // تحديث title المتصفح عند وجود إشعارات غير مقروءة
  useEffect(() => {
    const originalTitle = document.title.replace(/^\(\d+\) /, ''); // إزالة العداد السابق
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle}`;
      
      // تأثير وميض في التاب
      let isVisible = true;
      const blinkInterval = setInterval(() => {
        document.title = isVisible ? `🔔 ${originalTitle}` : `(${unreadCount}) ${originalTitle}`;
        isVisible = !isVisible;
      }, 1000);

      return () => {
        clearInterval(blinkInterval);
        document.title = originalTitle;
      };
    } else {
      document.title = originalTitle;
    }
  }, [unreadCount]);

  // إظهار إشعار في المتصفح عند وصول إشعار جديد
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.read && 'Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(latestNotification.title || 'إشعار جديد من سكني', {
          body: latestNotification.message,
          icon: '/maskani-icon-192x192.png',
          badge: '/maskani-icon-192x192.png',
          tag: latestNotification.id,
          requireInteraction: true,
          silent: false
        });

        browserNotification.onclick = () => {
          window.focus();
          setOpen(true);
          markRead(latestNotification.id);
          browserNotification.close();
        };

        // صوت إشعار (إذا كان متاحاً)
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // تجاهل أخطاء تشغيل الصوت
          });
        } catch (error) {
          // تجاهل أخطاء الصوت
        }

        // إغلاق الإشعار تلقائياً بعد 8 ثوان
        setTimeout(() => {
          browserNotification.close();
        }, 8000);
      }
    }
  }, [notifications, markRead]);

  // إضافة أيقونة حسب نوع الإشعار
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      case 'system':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'broadcast':
      case 'announcement':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className={`relative text-primary-foreground hover:bg-white/20 transition-all duration-200 rounded-full p-2 ${
          unreadCount > 0 ? 'animate-pulse' : ''
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
      >
        <Bell className={`h-5 w-5 transition-transform duration-200 ${
          unreadCount > 0 ? 'animate-bounce' : ''
        }`} />
        {unreadCount > 0 && (
          <>
            {/* شعاع متوهج */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
            {/* رقم الإشعارات */}
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-lg min-w-[18px] h-[18px] flex items-center justify-center animate-pulse border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop للإغلاق عند النقر خارج النافذة */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* نافذة منبثقة وسط الشاشة دائماً */}
          <div className="fixed top-1/2 left-1/2 z-50 w-[380px] max-w-[calc(100vw-1rem)] bg-white text-gray-900 rounded-2xl shadow-2xl border-0 overflow-hidden animate-in fade-in duration-300 transform -translate-x-1/2 -translate-y-1/2 max-h-[90vh] flex flex-col" dir="rtl">
            {/* Header مع تدرج لوني محسّن */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-4 relative overflow-hidden text-right" dir="rtl">
              {/* تأثير خلفية متحركة */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
              
              <div className="flex flex-row-reverse items-center justify-between relative z-10">
                <div className="flex flex-row-reverse items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg">الإشعارات</h3>
                    <p className="text-white/80 text-sm">آخر التحديثات</p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-lg">
                      {unreadCount} جديد
                    </Badge>
                  )}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setOpen(false)}
                  className="absolute top-2 right-2 text-white bg-white/20 hover:bg-white/30 rounded-full h-9 w-9 transition-all duration-200 hover:scale-110 shadow-lg"
                  aria-label="إغلاق الإشعارات"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* أزرار العمل */}
              {unreadCount > 0 && (
                <div className="mt-4 flex gap-2 relative z-10">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={async () => { await markAllRead(); }}
                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-full px-4 py-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    تعيين الكل كمقروء
                  </Button>
                </div>
              )}
            </div>

            {/* المحتوى */}
            <div className="flex-1 bg-gray-50/50 overflow-y-auto text-right" dir="rtl">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">جارِ التحميل...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-gray-600 font-semibold mb-1">لا توجد إشعارات</h4>
                    <p className="text-sm text-gray-400">ستظهر الإشعارات الجديدة هنا</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((n, index) => (
                      <div 
                        key={n.id} 
                        className={`p-4 transition-all duration-300 hover:bg-white hover:shadow-sm ${
                          !n.read 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* أيقونة الإشعار */}
                          <div className={`p-2.5 rounded-full shadow-sm ${
                            !n.read 
                              ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
                              : 'bg-gray-100'
                          }`}>
                            {getNotificationIcon(n.type)}
                          </div>
                          
                          {/* محتوى الإشعار */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-900 text-sm text-right">
                                    {n.title || 'إشعار'}
                                  </h4>
                                  {!n.read && (
                                    <div className="flex items-center justify-end">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-blue-600 font-medium ml-1">جديد</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-2 text-right">
                                  {n.message}
                                </p>
                                {n.created_at && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                                    <span className="text-gray-400">🕒</span>
                                    <span dir="ltr">{new Date(n.created_at).toLocaleString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2 justify-end mt-2">
                                {!n.read && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => markRead(n.id)}
                                    className="text-blue-600 hover:text-white hover:bg-blue-600 rounded-full px-3 py-1 shrink-0 transition-all duration-200 text-xs font-medium shadow-sm"
                                  >
                                    <Check className="h-3 w-3 ml-1" />
                                    قرأت
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDelete(n.id)}
                                  className="text-red-600 hover:text-white hover:bg-red-600 rounded-full px-3 py-1 shrink-0 transition-all duration-200 text-xs font-medium shadow-sm"
                                >
                                  حذف
                                </Button>
                              </div>
// تم حذف التعريف المكرر لدالة الحذف خارج المكون
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Footer محسّن */}
            {notifications.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 text-center border-t">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-xs text-gray-600 font-medium">
                    إجمالي الإشعارات: {notifications.length}
                  </p>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsBell;
