-- ========================================
-- 2025-10-18 - RPC: get_users_for_admin()
-- Returns a full list of users (auth.users) joined with profiles and permissions
-- Accessible only to admins (checks public.is_admin())
-- ========================================

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
  (up.limits->>'images_per_property')::int as images_limit,
  (up.limits->>'properties')::int as properties_limit,
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
      WHEN up.properties_count >= (up.limits->>'properties')::INT THEN '🔴 وصل للحد'
      WHEN up.properties_count >= (up.limits->>'properties')::INT * 0.8 THEN '🟡 قريب من الحد'
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

GRANT EXECUTE ON FUNCTION public.get_users_for_admin TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ get_users_for_admin RPC created';
END $$;
