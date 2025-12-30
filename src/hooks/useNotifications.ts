import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationItem } from '@/services/notifications';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotificationService } from '@/services/notifications';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!user);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const { toast } = useToast();

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) {
      toast({ title: 'غير مسجّل', description: 'يجب تسجيل الدخول لحذف إشعار', variant: 'destructive' });
      return;
    }

    // Verify owner/admin on server before attempting delete to avoid
    // optimistic-removal + revert flicker when RLS prevents deletion.
    try {
      const { data: existing, error: existingError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', id)
        .maybeSingle();

      if (existingError) {
        console.error('Failed to read notification before delete:', existingError);
        toast({ title: 'خطأ', description: 'فشل التحقق من ملكية الإشعار', variant: 'destructive' });
        return;
      }

      if (!existing) {
        toast({ title: 'غير موجود', description: 'الإشعار غير موجود على الخادم', variant: 'destructive' });
        // Ensure list sync
        await load();
        return;
      }

      const isOwner = existing.user_id === user.id;
      if (!isOwner && !isAdmin) {
        console.warn('User attempted to delete notification they do not own', { notificationId: id, owner: existing.user_id, currentUser: user.id });
        toast({ title: 'غير مسموح', description: 'ليس لديك صلاحية حذف هذا الإشعار', variant: 'destructive' });
        return;
      }

      // Optimistically remove the notification from local state and keep a reference
      let previousNotifications: NotificationItem[] | undefined;
      setNotifications(prev => {
        previousNotifications = prev;
        return prev.filter(n => n.id !== id);
      });

      try {
        await deleteNotificationService(id);
        // Re-sync with server to ensure we don't show stale data after reload.
        await load();
        toast({ title: 'تم حذف الإشعار', description: 'تم حذف الإشعار بنجاح' });
      } catch (error) {
        // Revert optimistic update on failure
        if (previousNotifications) setNotifications(previousNotifications);
        console.error('Error deleting notification:', error);
        if (error instanceof Error && error.message.includes('No notification was deleted')) {
          toast({
            title: 'غير مسموح',
            description: 'لم يتم حذف الإشعار على الخادم — قد تكون سياسات قاعدة البيانات تمنع الحذف. اطلب من المسؤول تفعيل حذف الإشعارات الخاصة بالمستخدم.',
            variant: 'destructive',
          });
          return;
        }
        toast({ title: 'خطأ', description: 'فشل في حذف الإشعار', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Unexpected error during delete flow:', err);
      toast({ title: 'خطأ', description: 'حصل خطأ غير متوقع أثناء الحذف', variant: 'destructive' });
    }
  }, [user, isAdmin, toast, load]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to realtime changes on notifications for this user
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        // For simplicity, reload on any change. This keeps behavior predictable
        // and avoids complex type issues with realtime payload shapes.
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { notifications, unreadCount, loading, reload: load, markRead, markAllRead, deleteNotification };
}

export default useNotifications;
