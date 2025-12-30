-- Migration: create app_settings table and RPCs
-- Run with Supabase migrations or paste into SQL editor

-- Create table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Seed row if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings) THEN
    INSERT INTO public.app_settings (settings)
    VALUES ('{"theme":"auto","primary":"213 94% 50%","primary_light":"217 91% 45%","font_size":"normal","maintenance_mode":false,"system_visible":true}'::jsonb);
  END IF;
END $$;

-- Enable RLS and create a simple select policy (clients read via RPC or direct select)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY app_settings_select_public ON public.app_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grant SELECT to authenticated so clients may call simple select (subject to RLS)
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RPCs
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER AS $$
  SELECT settings FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_app_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_app_settings(p_settings jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin uuid := auth.uid();
  v_old jsonb;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  -- Update the singleton row in a way that works when a strict SQL policy requires a WHERE clause.
  -- Choose the most-recent row (ORDER BY updated_at) and update only that row.
  SELECT settings INTO v_old FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  UPDATE public.app_settings
    SET settings = p_settings, updated_at = now()
    WHERE id = (SELECT id FROM public.app_settings ORDER BY updated_at DESC LIMIT 1);
  IF NOT FOUND THEN
    INSERT INTO public.app_settings (settings) VALUES (p_settings);
  END IF;
  -- Audit the change
  -- Audit: record old and new values for transparency
  PERFORM public.log_audit_entry('update', 'app_settings', NULL, jsonb_build_object('old', v_old, 'new', p_settings), v_admin);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_app_settings(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_maintenance_mode(p_on boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin uuid := auth.uid();
  v_current jsonb;
  v_old jsonb;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  SELECT settings INTO v_current FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
  v_old := v_current;
  IF v_current IS NULL THEN
    INSERT INTO public.app_settings (settings) VALUES (jsonb_build_object('maintenance_mode', p_on));
  ELSE
    v_current := v_current || jsonb_build_object('maintenance_mode', p_on);
    UPDATE public.app_settings SET settings = v_current, updated_at = now()
      WHERE id = (SELECT id FROM public.app_settings ORDER BY updated_at DESC LIMIT 1);
  END IF;
  -- Audit maintenance toggle (record old and new for traceability)
  PERFORM public.log_audit_entry('update', 'app_settings', NULL, jsonb_build_object('old', COALESCE(v_old, '{}'::jsonb), 'new', jsonb_build_object('maintenance_mode', p_on)), v_admin);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_maintenance_mode(boolean) TO authenticated;
