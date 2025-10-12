import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="relative text-primary-foreground hover:bg-white/20"
        onClick={() => setOpen((o) => !o)}
        title="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-xl border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-semibold">الإشعارات</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={async () => { await markAllRead(); }} className="text-blue-600">
                  <Check className="h-4 w-4 mr-1" />
                  تعيين مقروءة
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>إغلاق</Button>
            </div>
          </div>
          <Card className="border-0 rounded-none">
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="p-4 text-sm text-gray-500">جارِ التحميل...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">لا توجد إشعارات</div>
                ) : (
                  <ul className="divide-y">
                    {notifications.map((n) => (
                      <li key={n.id} className={`p-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{n.title || 'إشعار'}</span>
                              {!n.read && <Badge variant="secondary" className="bg-red-500 text-white">جديد</Badge>}
                            </div>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{n.message}</p>
                            {n.created_at && (
                              <p className="text-[11px] text-gray-400 mt-1" dir="ltr">{new Date(n.created_at).toLocaleString()}</p>
                            )}
                          </div>
                          {!n.read && (
                            <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="text-blue-600">تحديد كمقروء</Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
