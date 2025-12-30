-- Migration: create get_users_for_admin_v2() and compatibility wrapper
-- Timestamp: 2025-10-21 12:30
-- Purpose: provide a secure, idempotent RPC that returns auth.users joined with
-- profiles and unified permissions. Grants EXECUTE to the "authenticated" role.

SET search_path TO public, pg_catalog;

-- NOTE: This migration assumes a unified permissions table `public.user_permissions`
-- and an `is_admin()` helper function that determines whether the caller is an admin.
-- If you do not have `public.is_admin(uid)` in your DB, create it first (see other migrations).

-- 1) Create the v2 RPC (secure, runs as definer)
CREATE OR REPLACE FUNCTION public.get_users_for_admin_v2()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.user_role_type,
  properties_count int,
  images_limit int,
  properties_limit int,
  can_publish boolean,
  is_verified boolean,
  is_active boolean,
  role_name_ar text,
  status_indicator text,
  account_created timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Authorisation check (caller must be an admin). The call uses the
  -- default auth.uid() inside public.is_admin().
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text AS email,
    COALESCE(p.full_name, au.raw_user_meta_data ->> 'full_name', '') AS full_name,
    COALESCE(p.phone, au.raw_user_meta_data ->> 'phone', '') AS phone,
    COALESCE(up.role::text, 'publisher')::public.user_role_type AS role,
    COALESCE(up.properties_count, 0) AS properties_count,
    COALESCE((up.limits->>'images_per_property')::int, 10) AS images_limit,
    COALESCE((up.limits->>'properties')::int, 3) AS properties_limit,
    COALESCE(up.can_publish, true) AS can_publish,
    COALESCE(up.is_verified, false) AS is_verified,
    COALESCE(up.is_active, true) AS is_active,
    CASE COALESCE(up.role, 'publisher')
      WHEN 'admin' THEN '👑 مدير (بدون حدود)'
      WHEN 'office' THEN '🏢 مكتب'
      WHEN 'agent' THEN '🧑‍💼 وسيط'
      ELSE '👤 ناشر عادي'
    END AS role_name_ar,
    CASE
      WHEN NOT COALESCE(up.can_publish, true) THEN '🚫 محظور'
      WHEN COALESCE(up.role,'publisher') = 'admin' THEN '🔑 غير محدود'
      WHEN COALESCE(up.properties_count,0) >= COALESCE((up.limits->>'properties')::int, 3) THEN '🔴 وصل للحد'
      WHEN COALESCE(up.properties_count,0) >= COALESCE((up.limits->>'properties')::int, 3) * 0.8 THEN '🟡 قريب من الحد'
      ELSE '🟢 ضمن الحد'
    END AS status_indicator,
    au.created_at AS account_created,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_permissions up ON up.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Ensure authenticated callers can execute the RPC (function is SECURITY DEFINER).
GRANT EXECUTE ON FUNCTION public.get_users_for_admin_v2() TO authenticated;

-- 2) Backwards-compatible wrapper: keep the old name pointing to v2
--    (this replaces the old implementation with a thin wrapper that calls v2)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  role public.user_role_type,
  properties_count int,
  images_limit int,
  properties_limit int,
  can_publish boolean,
  is_verified boolean,
  is_active boolean,
  role_name_ar text,
  status_indicator text,
  account_created timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.get_users_for_admin_v2();
$$;

GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated;

-- 3) Notice for operators
DO $$ BEGIN
  RAISE NOTICE '✅ get_users_for_admin_v2() created — call GET /rpc/get_users_for_admin_v2';
END $$;

-- End of migration
