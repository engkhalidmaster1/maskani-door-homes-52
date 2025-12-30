-- Migration: retire get_users_for_admin() safely and replace with wrapper to v2
-- Timestamp: 2025-10-21 13:30
-- This migration will DROP the old get_users_for_admin() only if there are NO
-- dependent objects that reference it. If dependents are found it will LIST
-- them and abort so you can update dependents first.
--
-- Usage: run *after* creating get_users_for_admin_v2(). If you intend to force
-- replace the function even when dependents exist, review the listed dependents
-- carefully and only then run a manual DROP FUNCTION ... CASCADE, or modify this
-- migration to permit forced retire (not recommended without review).

-- ---------------------------------------------------------------------------
-- 1) Ensure v2 exists
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v2_exists int;
BEGIN
  SELECT count(*) INTO v2_exists
  FROM pg_proc
  WHERE proname = 'get_users_for_admin_v2' AND pronamespace = 'public'::regnamespace;

  IF v2_exists = 0 THEN
    RAISE EXCEPTION 'Prerequisite missing: public.get_users_for_admin_v2() not found. Run the migration that creates v2 first.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Detect dependents that reference the old function (textual and dependency checks)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ref_oids oid[];
  dep_count int := 0;
  rec record;
BEGIN
  -- Find the OIDs for public.get_users_for_admin (could be overloaded in rare cases)
  SELECT array_agg(oid) INTO ref_oids FROM pg_proc WHERE proname = 'get_users_for_admin' AND pronamespace = 'public'::regnamespace;

  IF ref_oids IS NULL THEN
    RAISE NOTICE 'No existing public.get_users_for_admin() function found. Nothing to retire.';
    RETURN;
  END IF;

  -- Count explicit pg_depend entries (objects that depend on the function)
  SELECT COUNT(*) INTO dep_count FROM pg_depend d WHERE d.refobjid = ANY(ref_oids);

  IF dep_count > 0 THEN
    RAISE NOTICE 'Found % direct dependency(ies) referencing public.get_users_for_admin(). Aborting automatic DROP. Listing likely dependents below:', dep_count;

    -- List functions whose bodies call get_users_for_admin(...) (textual search)
    FOR rec IN
      SELECT n.nspname AS schema_name, p.proname AS function_name, left(pg_get_functiondef(p.oid), 4000) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE pg_get_functiondef(p.oid) ILIKE '%get_users_for_admin(%'
    LOOP
      RAISE NOTICE 'Dependent function: %.% -> %', rec.schema_name, rec.function_name, rec.def;
    END LOOP;

    -- List views referencing the name (best-effort textual search)
    FOR rec IN
      SELECT table_schema, table_name, left(view_definition, 4000) AS def
      FROM information_schema.views
      WHERE view_definition ILIKE '%get_users_for_admin(%'
    LOOP
      RAISE NOTICE 'Dependent view: %.% -> %', rec.table_schema, rec.table_name, rec.def;
    END LOOP;

    RAISE NOTICE 'Automatic retirement aborted. Review and update the above dependents, then re-run this migration.';
    RETURN;
  END IF;

  -- No dependents: safe to drop and replace
  RAISE NOTICE 'No dependents found for public.get_users_for_admin(), proceeding to DROP and replace with wrapper to v2.';

  -- Drop the old function (no CASCADE used because we validated there are no dependents)
  EXECUTE 'DROP FUNCTION IF EXISTS public.get_users_for_admin()';

  -- Create wrapper that simply forwards to v2 (wrapper has same OUT signature as v2)
  EXECUTE $exec$
    CREATE FUNCTION public.get_users_for_admin()
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
    AS $fn$
      SELECT * FROM public.get_users_for_admin_v2();
    $fn$;
  $exec$;

  -- Ensure authenticated callers can execute (matches common project conventions)
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated';

  RAISE NOTICE 'public.get_users_for_admin() retired and replaced by wrapper to get_users_for_admin_v2()';
END $$;

-- ---------------------------------------------------------------------------
-- End of migration
-- ---------------------------------------------------------------------------
