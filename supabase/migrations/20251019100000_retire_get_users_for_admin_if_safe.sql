-- ========================================
-- 2025-10-19 - Retire old get_users_for_admin safely if no dependents remain
-- This migration will only DROP the old function and rename v2 when the
-- database reports zero dependent objects. Otherwise it raises a NOTICE.
-- ========================================

DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_depend d
  WHERE d.refobjid = (
    SELECT oid FROM pg_proc WHERE proname = 'get_users_for_admin' AND pronamespace = 'public'::regnamespace
  );

  IF v_count = 0 THEN
    -- Safe to drop and rename
    DROP FUNCTION IF EXISTS public.get_users_for_admin();
    ALTER FUNCTION public.get_users_for_admin_v2() RENAME TO get_users_for_admin;
    RAISE NOTICE '✅ get_users_for_admin retired and v2 renamed';
  ELSE
    RAISE NOTICE '⚠️ Not ready to retire get_users_for_admin: % dependent object(s) remain. Update dependents then re-run this migration.', v_count;
  END IF;
END $$;
