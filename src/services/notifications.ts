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

export async function deleteNotification(id: string) {
  // Try RPC-based delete first (safer when RLS/permissions are strict)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('delete_user_notification', { p_id: id });
    if (!rpcError) {
      return rpcData;
    }
    // If RPC exists but returns an error, log and fall back to direct delete
    console.warn('delete_user_notification RPC error, falling back to direct delete', rpcError);
  } catch (rpcErr) {
    // RPC might not exist — we'll fall back to direct delete below
    console.debug('delete_user_notification RPC not available or failed', rpcErr);
  }

  // Fallback: request the deleted rows back so we can verify a row was actually removed.
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('No notification was deleted');
  }
}
