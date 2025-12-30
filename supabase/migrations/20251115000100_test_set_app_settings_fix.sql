-- Test migration: validate set_app_settings and set_maintenance_mode behavior
-- This migration is safe to run in local/dev and will print notices for verification.

DO $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  RAISE NOTICE '== Test: set_app_settings / Upsert behavior START ==';

  SELECT settings INTO v_old FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  RAISE NOTICE 'Current settings (before test): %', v_old;

  -- Try update using RPC
  PERFORM public.set_app_settings(jsonb_build_object('test_marker', 'rpc_update'));
  SELECT settings INTO v_new FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  RAISE NOTICE 'After RPC set_app_settings: %', v_new;

  -- Try maintenance toggle
  PERFORM public.set_maintenance_mode(true);
  SELECT settings INTO v_new FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  RAISE NOTICE 'After set_maintenance_mode(true): %', v_new;

  -- Revert maintenance toggle
  PERFORM public.set_maintenance_mode(false);
  SELECT settings INTO v_new FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  RAISE NOTICE 'After set_maintenance_mode(false): %', v_new;

  -- Clear test key
  PERFORM public.set_app_settings(jsonb_build_object('test_marker', null));
  SELECT settings INTO v_new FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  RAISE NOTICE 'After clearing test key: %', v_new;

  RAISE NOTICE '== Test: set_app_settings / Upsert behavior END ==';
END $$;
