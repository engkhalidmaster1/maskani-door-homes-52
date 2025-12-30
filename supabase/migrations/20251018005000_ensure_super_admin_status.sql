-- ========================================
-- 2025-10-18 - Ensure super-admin has unlimited user_status as well
-- Extends/overwrites ensure_super_admin() so it also upserts a user_status
-- with unlimited properties/images for the protected account.
-- ========================================

CREATE OR REPLACE FUNCTION public.ensure_super_admin()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_uid UUID := auth.uid();
  v_owner_id UUID;
BEGIN
  -- Find the admin user id
  SELECT id INTO v_owner_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Super admin user not found.';
  END IF;

  -- Only the real super-admin may call this RPC
  IF v_uid IS DISTINCT FROM v_owner_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Upsert the admin permissions row (run as definer to bypass RLS safely)
  INSERT INTO public.user_permissions (
    user_id, role, limits, can_publish, is_verified, is_active, verified_at, verified_by, created_at, updated_at
  ) VALUES (
    v_owner_id,
    'admin',
  '{"properties": -1, "images_per_property": -1, "storage_mb": -1}'::jsonb,
    true,
    true,
    true,
    now(),
    v_owner_id,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    limits = EXCLUDED.limits,
    can_publish = EXCLUDED.can_publish,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active,
    verified_at = EXCLUDED.verified_at,
    verified_by = EXCLUDED.verified_by,
    updated_at = now();

  -- Upsert a matching user_status with unlimited limits so UI and checks treat the admin as unlimited
  INSERT INTO public.user_statuses (
    user_id, status, properties_limit, images_limit, can_publish, is_verified, verified_at, verified_by, created_at, updated_at
  ) VALUES (
    v_owner_id,
    'trusted_owner',
    -1,
    -1,
    true,
    true,
    now(),
    v_owner_id,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = EXCLUDED.status,
    properties_limit = EXCLUDED.properties_limit,
    images_limit = EXCLUDED.images_limit,
    can_publish = EXCLUDED.can_publish,
    is_verified = EXCLUDED.is_verified,
    verified_at = EXCLUDED.verified_at,
    verified_by = EXCLUDED.verified_by,
    updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_super_admin TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ ensure_super_admin() extended to also upsert user_status (unlimited)';
END $$;
