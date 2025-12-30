-- ========================================
-- 2025-10-19 - Create get_users_for_admin_v2 (safe path) and list dependents
-- Purpose:
--  1) Avoid dropping/replacing the existing get_users_for_admin() when other DB objects
--     depend on it (causes 42P13 errors).
--  2) Create a V2 function with the extended return shape (includes images_limit)
--     so application code can migrate to the new function gradually.
--  3) Provide queries to list and extract definitions of dependent objects so you
--     can update them to call the V2 function when ready.
-- ========================================

-- 0) Safety: report the current count of dependent objects (will not abort)
SELECT COUNT(*) AS dependent_count
FROM pg_depend d
WHERE d.refobjid = (
  SELECT oid FROM pg_proc WHERE proname = 'get_users_for_admin' AND pronamespace = 'public'::regnamespace
);

-- 1) List dependent objects (functions, views, relations, types) that reference the
--    compiled function object (this shows true database-level dependents):
SELECT
  d.deptype AS dependency_type,
  CASE
    WHEN d.classid = 'pg_proc'::regclass THEN 'function'::text
    WHEN d.classid = 'pg_class'::regclass THEN 'relation'::text
    WHEN d.classid = 'pg_type'::regclass THEN 'type'::text
    ELSE d.classid::regclass::text
  END AS object_kind,
  COALESCE(p.proname, c.relname, t.typname, d.objid::text) AS object_name,
  COALESCE(ns.nspname, 'public') AS schema_name
FROM pg_depend d
LEFT JOIN pg_proc p ON p.oid = d.objid
LEFT JOIN pg_class c ON c.oid = d.objid
LEFT JOIN pg_type t ON t.oid = d.objid
LEFT JOIN pg_namespace ns ON ns.oid = COALESCE(p.pronamespace, c.relnamespace, t.typnamespace)
WHERE d.refobjid = (
  SELECT oid FROM pg_proc WHERE proname = 'get_users_for_admin' AND pronamespace = 'public'::regnamespace
)
ORDER BY object_kind, schema_name, object_name;

-- 2) Find objects whose DEFINITIONS contain textual references to the function name
--    (useful for functions/views that call it inline instead of using the DB dependency system)
-- Functions that mention the string 'get_users_for_admin'
SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%get_users_for_admin%'
ORDER BY schema_name, function_name;

-- Views that mention the string 'get_users_for_admin'
SELECT table_schema, table_name, view_definition
FROM information_schema.views
WHERE view_definition ILIKE '%get_users_for_admin%'
ORDER BY table_schema, table_name;

-- 3) Helper: produce the DDL for each dependent function so you can edit it (manual step)
--    Example usage: run the SELECT, copy the output, replace calls to get_users_for_admin(
--    with get_users_for_admin_v2( and then `CREATE OR REPLACE FUNCTION ...` the edited DDL.
SELECT
  n.nspname || '.' || p.proname AS function_qualname,
  pg_get_functiondef(p.oid) AS current_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%get_users_for_admin%'
ORDER BY n.nspname, p.proname;

-- 4) Safe: create the NEW function (V2) that includes the extended return shape.
--    This does NOT touch the existing `get_users_for_admin()` and therefore will not
--    break dependents. After you migrate callers and dependent DB objects to V2 you
--    can decide to retire the old function.
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
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email,
    COALESCE(p.full_name, au.raw_user_meta_data ->> 'full_name', '') as full_name,
    COALESCE(p.phone, au.raw_user_meta_data ->> 'phone', '') as phone,
    up.role,
    up.properties_count,
    (COALESCE(up.limits->>'images_per_property', '0'))::int as images_limit,
    (COALESCE(up.limits->>'properties', '0'))::int as properties_limit,
    up.can_publish,
    up.is_verified,
    up.is_active,
    CASE up.role
      WHEN 'admin' THEN '👑 مدير (بدون حدود)'
      WHEN 'office' THEN '🏢 مكتب'
      WHEN 'agent' THEN '🧑‍💼 وسيط'
      ELSE '👤 ناشر عادي'
    END as role_name_ar,
    CASE 
      WHEN NOT up.can_publish THEN '🚫 محظور'
      WHEN up.role = 'admin' THEN '🔑 غير محدود'
      WHEN up.properties_count >= (COALESCE(up.limits->>'properties','0'))::INT THEN '🔴 وصل للحد'
      WHEN up.properties_count >= (COALESCE(up.limits->>'properties','0'))::INT * 0.8 THEN '🟡 قريب من الحد'
      ELSE '🟢 ضمن الحد'
    END as status_indicator,
    au.created_at as account_created,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_permissions up ON up.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_for_admin_v2 TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ get_users_for_admin_v2() created. Use the helper queries above to find and update dependents that must be migrated to V2.';
END $$;

-- 5) Guidance:
-- - Run the "List dependent objects" query above and inspect each dependent object.
-- - For each dependent function: copy the output of pg_get_functiondef(oid),
--   replace calls of `get_users_for_admin(` with `get_users_for_admin_v2(`,
--   adjust any handling for the extra column `images_limit`, then run the edited DDL
--   as `CREATE OR REPLACE FUNCTION ...`.
-- - For each dependent view: edit the view definition to use `get_users_for_admin_v2()`
--   or to select the new `images_limit` from user_permissions directly.
-- - After all dependents are migrated and tested, you can safely DROP the old
--   `get_users_for_admin()` and optionally rename V2 to the original name.
--   Example (DO NOT RUN until dependents updated):
--     DROP FUNCTION public.get_users_for_admin();
--     ALTER FUNCTION public.get_users_for_admin_v2() RENAME TO get_users_for_admin;
