-- Fix set_user_role function to remove last_sign_in_at column reference
-- This column doesn't exist in user_permissions table

CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id uuid,
  new_role TEXT,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  l_limits jsonb;
  l_properties_limit INTEGER;
  l_images_limit INTEGER;
  l_status_text public.user_statuses.status%TYPE := 'publisher';
BEGIN
  -- Ensure caller is an admin according to the unified user_permissions table
  IF NOT EXISTS (SELECT 1 FROM public.user_permissions up WHERE up.user_id = admin_user_id AND up.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins may change user roles';
  END IF;

  -- Map roles to limits and status
  IF new_role = 'admin' THEN
    l_limits := '{"properties": -1, "images_per_property": -1, "storage_mb": -1}'::jsonb;
    l_properties_limit := -1;
    l_images_limit := -1;
    l_status_text := 'trusted_owner'; -- admin still gets a trusted_owner status row
  ELSIF new_role = 'office' THEN
    l_limits := '{"properties": 100, "images_per_property": 10, "storage_mb": 5000}'::jsonb;
    l_properties_limit := 100;
    l_images_limit := 10;
    l_status_text := 'office_agent';
  ELSIF new_role = 'agent' THEN
    l_limits := '{"properties": 30, "images_per_property": 10, "storage_mb": 1024}'::jsonb;
    l_properties_limit := 30;
    l_images_limit := 10;
    l_status_text := 'trusted_owner';
  ELSIF new_role = 'publisher' THEN
    l_limits := '{"properties": 3, "images_per_property": 10, "storage_mb": 200}'::jsonb;
    l_properties_limit := 3;
    l_images_limit := 10;
    l_status_text := 'publisher';
  ELSE
    RAISE EXCEPTION 'Unknown role: %', new_role;
  END IF;

  -- Upsert user_permissions (removed last_sign_in_at column reference)
  INSERT INTO public.user_permissions (
    user_id, role, properties_count, can_publish, is_verified, is_active, limits
  ) VALUES (
    target_user_id, new_role, 0, (new_role <> 'publisher'), (new_role <> 'publisher'), true, l_limits
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    limits = EXCLUDED.limits,
    can_publish = EXCLUDED.can_publish,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  -- Upsert user_statuses to keep business logic consistent
  INSERT INTO public.user_statuses (
    user_id, status, properties_limit, images_limit, can_publish, is_verified, verified_at, verified_by, created_at, updated_at
  ) VALUES (
    target_user_id, l_status_text, l_properties_limit, l_images_limit, (new_role <> 'publisher'), (new_role <> 'publisher'), CASE WHEN (new_role <> 'publisher') THEN now() ELSE NULL END, CASE WHEN (new_role <> 'publisher') THEN admin_user_id ELSE NULL END, now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    properties_limit = EXCLUDED.properties_limit,
    images_limit = EXCLUDED.images_limit,
    can_publish = EXCLUDED.can_publish,
    is_verified = EXCLUDED.is_verified,
    verified_at = COALESCE(EXCLUDED.verified_at, public.user_statuses.verified_at),
    verified_by = COALESCE(EXCLUDED.verified_by, public.user_statuses.verified_by),
    updated_at = now();

  RETURN TRUE;
END;
$$;