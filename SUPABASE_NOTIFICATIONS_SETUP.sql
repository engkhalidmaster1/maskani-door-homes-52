
-- Supabase Notifications Setup - Complete Script
-- Copy and paste this entire script into Supabase SQL Editor

-- =============================================================================
-- STEP 1: Ensure Required Functions Exist (Dynamic Roles System)
-- =============================================================================

-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in admin_users table with active status
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = p_user_id 
    AND active IS DISTINCT FROM false
  );
END;
$$;

-- =============================================================================
-- STEP 2: Create/Fix Notifications Table and Policies
-- =============================================================================

-- Create notifications table with proper structure (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  type text DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now()
);

-- CRITICAL FIX: Drop existing type constraint and recreate with correct values
DO $$
BEGIN
  -- Drop existing constraint (all variations)
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_check;  
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS check_type;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  -- Add the correct constraint that allows 'broadcast'
  ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('system', 'broadcast', 'personal', 'alert', 'info', 'announcement', 'warning'));
    
  RAISE NOTICE 'Type constraint updated to allow broadcast notifications';
END $$;

-- Ensure RLS is enabled on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system setup complete!';
  RAISE NOTICE '📱 Users should now see notification bell in header';
  RAISE NOTICE '🔔 Admins can broadcast via Dashboard > Admin Controls';
  RAISE NOTICE '⚡ Real-time updates are enabled';
END $$;