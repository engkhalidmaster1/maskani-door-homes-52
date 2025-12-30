-- 2025-10-20 - Safe server-side delete helper for notifications
-- Allow a user to delete their own notification, or allow admins to delete any.

CREATE OR REPLACE FUNCTION public.delete_user_notification(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.notifications n
    WHERE n.id = p_id
      AND (n.user_id = v_user OR public.is_admin(v_user))
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  DELETE FROM public.notifications WHERE id = p_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_notification(uuid) TO authenticated;
