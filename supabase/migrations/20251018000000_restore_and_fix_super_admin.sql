-- ========================================
-- 2025-10-18 - Restore Super Admin & Fix Protection Trigger
-- Ensures the protected super-admin has an admin permissions row
-- and hardens the protect_super_admin trigger so it doesn't
-- block harmless updates such as stats updates.
-- ========================================

-- 1) Create / Upsert super-admin permissions (safe operation)
DO $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_super_admin_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_super_admin_id IS NULL THEN
    RAISE NOTICE 'Super admin account not found (%). Skipping upsert.', v_super_admin_email;
  ELSE
    INSERT INTO public.user_permissions (
      user_id, role, limits, can_publish, is_verified, is_active, verified_at, verified_by, created_at, updated_at
    ) VALUES (
      v_super_admin_id,
      'admin',
  '{"properties": -1, "images_per_property": -1, "storage_mb": -1}'::jsonb,
      true,
      true,
      true,
      now(),
      v_super_admin_id,
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

    RAISE NOTICE '✅ Super admin permissions ensured for % (id: %)', v_super_admin_email, v_super_admin_id;
  END IF;
END $$;

-- 2) Harden the protect_super_admin trigger so it only blocks actual changes
--    to role / is_active / can_publish (and not harmless updates like counters)
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_super_admin_id UUID;
BEGIN
  SELECT id INTO v_super_admin_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_super_admin_id IS NULL THEN
    RETURN NEW; -- nothing to protect
  END IF;

  -- Only guard actual modifications to the protected account
  IF TG_OP = 'UPDATE' AND NEW.user_id = v_super_admin_id THEN
    -- Block attempts to change the role away from admin
    IF (NEW.role IS DISTINCT FROM OLD.role) AND (NEW.role != 'admin') THEN
      RAISE EXCEPTION '🚫 لا يمكن تغيير دور المدير العام! هذا الحساب محمي.';
    END IF;

    -- Block attempts to ban/deactivate the super admin
    IF (NEW.can_publish IS DISTINCT FROM OLD.can_publish) AND (NEW.can_publish = false) THEN
      RAISE EXCEPTION '🚫 لا يمكن حظر المدير العام! هذا الحساب محمي.';
    END IF;

    IF (NEW.is_active IS DISTINCT FROM OLD.is_active) AND (NEW.is_active = false) THEN
      RAISE EXCEPTION '🚫 لا يمكن تعطيل المدير العام! هذا الحساب محمي.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to use the hardened function
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.user_permissions;
CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin();

-- 3) Provide an RPC the super-admin client can call to self-heal their permissions
--    This RPC is SECURITY DEFINER and only allows the authenticated user that
--    matches the configured super-admin email to upsert the admin record.
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
  -- Determine the expected super-admin id
  SELECT id INTO v_owner_id FROM auth.users WHERE email = v_super_admin_email;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Super admin user not found.';
  END IF;

  -- Only allow the actual super-admin account to call this RPC
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

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_super_admin TO authenticated;

-- Final notice
DO $$ BEGIN
  RAISE NOTICE '✅ ensure_super_admin() and hardened protect_super_admin_trigger created successfully.';
END $$;
