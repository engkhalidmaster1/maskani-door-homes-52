-- Notifications: broadcast function and RLS policies

-- Ensure RLS is enabled on notifications
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can select their own notifications
DO $$
BEGIN
  CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policy: users can update 'read' status of their notifications
DO $$
BEGIN
  CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- By default, disallow inserts from clients; inserts happen via RPC

-- Helper function: check admin (assumes is_admin(uuid) returns boolean exists)
-- Broadcast RPC: create a notification for each existing user
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title text,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  -- Authorization: only admins
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Insert one notification per user (from auth.users to cover all accounts)
  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  SELECT gen_random_uuid(), u.id, p_title, p_message, false, 'broadcast', now()
  FROM auth.users u;
END;
$$;

-- Optional: mark all as read RPC for current user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read IS DISTINCT FROM true;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- Optional helpful indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_user_id_read'
  ) THEN
    CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
  END IF;
END $$;

-- Enable Realtime for notifications table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
