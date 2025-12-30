-- ========================================
-- 2025-10-18 - Sync missing profiles from auth.users
-- Inserts a profile row for any auth.user that does not yet have one
-- ========================================

DO $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone, created_at, updated_at)
  SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email) as full_name,
    COALESCE(au.raw_user_meta_data ->> 'phone', NULL) as phone,
    au.created_at,
    now()
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE p.user_id IS NULL;
END $$;

DO $$ BEGIN
  RAISE NOTICE '✅ Synced missing profiles from auth.users';
END $$;
