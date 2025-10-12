import { supabase } from '@/integrations/supabase/client';

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean | null;
  created_at: string | null;
  type?: string | null;
};

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, read, created_at, type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as NotificationItem[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
}
