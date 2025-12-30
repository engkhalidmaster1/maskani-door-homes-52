-- Add a policy to allow users to delete their own notifications
-- and allow admins to delete any notification.
-- This keeps deletion safe while enabling administrative cleanup.

DO $$
BEGIN
  CREATE POLICY notifications_delete_own ON public.notifications
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
