-- Clean Supabase Setup: Notifications + Properties Validation + App Settings
-- Idempotent and safe to run multiple times.
-- Usage:
--   - Paste this file into the Supabase SQL Editor and run
--   - Or run locally with psql (see scripts/run-supabase-sql.ps1)

-- ============================================================================
-- 1) Helpers
-- ============================================================================

-- is_admin helper (checks legacy admin_users and user_roles tables if present)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    v_is_admin := v_is_admin OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND active IS DISTINCT FROM false
    );
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    v_is_admin := v_is_admin OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin'
    );
  END IF;

  RETURN v_is_admin;
END;
$$;

-- Grant helper to authenticated so it can be used inside policies/functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;


-- ============================================================================
-- 2) Notifications: table, RLS, policies, RPCs, indexes
-- ============================================================================

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  type text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Ensure type constraint allows broadcasts and typical categories
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('system', 'broadcast', 'personal', 'alert', 'info', 'announcement', 'warning'));
END $$;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: select/update/delete for own notifications; admins may delete any
DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS notifications_select_own ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS notifications_update_own ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS notifications_delete_own ON public.notifications
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPCs for notifications
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(p_title text, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  SELECT gen_random_uuid(), u.id, p_title, p_message, false, 'broadcast', now()
  FROM auth.users u;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read IS DISTINCT FROM true;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_personal_notification_for_user(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'personal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_new_id uuid := gen_random_uuid();
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  VALUES (v_new_id, p_user_id, p_title, p_message, false, p_type, now());

  RETURN v_new_id;
END;
$$;

-- Safe delete helper for notifications (deletes only if owned or caller is admin)
CREATE OR REPLACE FUNCTION public.delete_user_notification(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.notifications n
    WHERE n.id = p_id
      AND (n.user_id = v_user OR public.is_admin(v_user))
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  DELETE FROM public.notifications WHERE id = p_id;
  RETURN true;
END;
$$;

-- Grants for RPCs and table access
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_personal_notification_for_user(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_notification(uuid) TO authenticated;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Helpful indexes (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_user_id_read') THEN
    CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_type') THEN
    CREATE INDEX idx_notifications_type ON public.notifications(type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
  END IF;
END $$;

-- Enable Realtime for notifications table (if supabase_realtime publication exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications;
  END IF;
END $$;


-- ============================================================================
-- 3) Properties: structured address, constraints, validation core, trigger, RPC
-- ============================================================================

-- 3.1 Add structured address columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS apartment TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS furnished TEXT;

-- 3.2 Lightweight CHECK constraints (NOT VALID to avoid breaking legacy rows)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_property_type_check
    CHECK (property_type IN ('apartment', 'house', 'commercial')) NOT VALID;

  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_listing_type_check
    CHECK (listing_type IN ('sale', 'rent')) NOT VALID;

  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_price_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_price_positive
    CHECK (price IS NOT NULL AND price > 0) NOT VALID;

  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_area_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_area_positive
    CHECK (area IS NOT NULL AND area > 0) NOT VALID;

  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_bedrooms_nonnegative;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_bedrooms_nonnegative
    CHECK (bedrooms IS NULL OR bedrooms >= 0) NOT VALID;

  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_furnished_for_rent;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_furnished_for_rent
    CHECK (listing_type <> 'rent' OR (furnished IS NOT NULL AND lower(furnished) IN ('yes','no'))) NOT VALID;
END $$;

-- 3.3 Validation core: returns text[] of friendly error messages (Arabic)
CREATE OR REPLACE FUNCTION public.property_validation_core(p_new jsonb, p_old jsonb DEFAULT NULL)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  errs TEXT[] := ARRAY[]::TEXT[];
  property_type TEXT := lower(trim(coalesce(p_new->>'property_type','')));
  listing_type TEXT := lower(trim(coalesce(p_new->>'listing_type','')));
  price_text TEXT := coalesce(p_new->>'price','');
  area_text TEXT := coalesce(p_new->>'area','');
  bedrooms_text TEXT := coalesce(p_new->>'bedrooms','');
  building_text TEXT := trim(coalesce(p_new->>'building',''));
  apartment_text TEXT := trim(coalesce(p_new->>'apartment',''));
  floor_text TEXT := trim(coalesce(p_new->>'floor',''));
  furnished_text TEXT := lower(trim(coalesce(p_new->>'furnished','')));
  v_price NUMERIC;
  v_area NUMERIC;
  v_bedrooms INTEGER;
BEGIN
  -- property_type
  IF property_type = '' THEN
    errs := array_append(errs, 'نوع العقار مطلوب (property_type)');
  ELSIF property_type NOT IN ('apartment','house','commercial') THEN
    errs := array_append(errs, 'نوع العقار غير صالح. القيم المسموح بها: apartment, house, commercial');
  END IF;

  -- listing_type
  IF listing_type = '' THEN
    errs := array_append(errs, 'نوع العرض مطلوب (listing_type)');
  ELSIF listing_type NOT IN ('sale','rent') THEN
    errs := array_append(errs, 'نوع العرض غير صالح. القيم المسموح بها: sale, rent');
  END IF;

  -- price
  IF price_text IS NULL OR trim(price_text) = '' THEN
    errs := array_append(errs, 'السعر مطلوب');
  ELSE
    BEGIN
      v_price := (price_text)::numeric;
      IF v_price <= 0 THEN
        errs := array_append(errs, 'السعر يجب أن يكون أكبر من صفر');
      END IF;
    EXCEPTION WHEN others THEN
      errs := array_append(errs, 'السعر غير صالح (يُتوقع قيمة رقمية)');
    END;
  END IF;

  -- area
  IF area_text IS NULL OR trim(area_text) = '' THEN
    errs := array_append(errs, 'المساحة مطلوبة');
  ELSE
    BEGIN
      v_area := (area_text)::numeric;
      IF v_area <= 0 THEN
        errs := array_append(errs, 'المساحة يجب أن تكون أكبر من صفر');
      END IF;
    EXCEPTION WHEN others THEN
      errs := array_append(errs, 'المساحة غير صالحة (يُتوقع قيمة رقمية)');
    END;
  END IF;

  -- bedrooms for apartment/house
  IF property_type IN ('apartment','house') THEN
    IF bedrooms_text IS NULL OR trim(bedrooms_text) = '' THEN
      errs := array_append(errs, 'عدد غرف النوم مطلوب للعقار من نوع ' || property_type);
    ELSE
      BEGIN
        v_bedrooms := (bedrooms_text)::integer;
        IF v_bedrooms < 0 THEN
          errs := array_append(errs, 'عدد غرف النوم يجب أن يكون عدد صحيح غير سالب');
        END IF;
      EXCEPTION WHEN others THEN
        errs := array_append(errs, 'عدد غرف النوم غير صالح (يُتوقع عدد صحيح)');
      END;
    END IF;
  END IF;

  -- apartment specific: building / apartment / floor required
  IF property_type = 'apartment' THEN
    IF building_text = '' THEN errs := array_append(errs, 'رقم العمارة مطلوب للشقق'); END IF;
    IF apartment_text = '' THEN errs := array_append(errs, 'رقم الشقة مطلوب للشقق'); END IF;
    IF floor_text = '' THEN errs := array_append(errs, 'الطابق مطلوب للشقق'); END IF;
  END IF;

  -- furnished required for rent
  IF listing_type = 'rent' THEN
    IF furnished_text = '' THEN
      errs := array_append(errs, 'حالة الأثاث مطلوبة عند الإيجار (furnished: yes|no)');
    ELSIF furnished_text NOT IN ('yes','no') THEN
      errs := array_append(errs, 'قيمة الأثاث غير صالحة. القيم المسموح بها: yes, no');
    END IF;
  END IF;

  RETURN errs;
END;
$$;

-- 3.4 Trigger wrapper: call validation core and raise descriptive exception on errors
CREATE OR REPLACE FUNCTION public.validate_property_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  validation_errors TEXT[];
  need_validate BOOLEAN := TRUE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    need_validate := (OLD.property_type IS DISTINCT FROM NEW.property_type)
                     OR (OLD.listing_type IS DISTINCT FROM NEW.listing_type)
                     OR (OLD.price IS DISTINCT FROM NEW.price)
                     OR (OLD.area IS DISTINCT FROM NEW.area)
                     OR (OLD.bedrooms IS DISTINCT FROM NEW.bedrooms)
                     OR (OLD.building IS DISTINCT FROM NEW.building)
                     OR (OLD.apartment IS DISTINCT FROM NEW.apartment)
                     OR (OLD.floor IS DISTINCT FROM NEW.floor)
                     OR (OLD.furnished IS DISTINCT FROM NEW.furnished);
    IF NOT need_validate THEN
      RETURN NEW;
    END IF;
  END IF;

  validation_errors := public.property_validation_core(to_jsonb(NEW), CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END);

  IF array_length(validation_errors, 1) IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE = format('Property validation failed: %s', array_to_string(validation_errors, '; ')), ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger only when table exists; drop existing trigger and recreate to pick up changes
DO $$
BEGIN
  IF to_regclass('public.properties') IS NOT NULL THEN
    BEGIN
      DROP TRIGGER IF EXISTS trg_validate_properties ON public.properties;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    CREATE TRIGGER trg_validate_properties
      BEFORE INSERT OR UPDATE ON public.properties
      FOR EACH ROW EXECUTE FUNCTION public.validate_property_trigger();
  END IF;
END;
$$;

-- 3.5 RPC for client-side pre-validation
CREATE OR REPLACE FUNCTION public.validate_property_payload(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  errs TEXT[];
BEGIN
  errs := public.property_validation_core(p_payload, NULL);
  RETURN jsonb_build_object(
    'valid', CASE WHEN array_length(errs,1) IS NULL THEN true ELSE false END,
    'errors', errs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_property_payload(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.property_validation_core(jsonb, jsonb) TO authenticated;

-- Optional index to support searching by building/apartment
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_properties_building_apartment'
  ) THEN
    CREATE INDEX idx_properties_building_apartment ON public.properties (building, apartment);
  END IF;
END $$;


-- ============================================================================
-- 4) App Settings: singleton settings table + RPCs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings) THEN
    INSERT INTO public.app_settings (settings)
    VALUES (
      ('{"theme":"auto","primary":"213 94% 50%","primary_light":"217 91% 45%","font_size":"normal","maintenance_mode":false,"system_visible":true}'::jsonb)
    );
  END IF;
END $$;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS app_settings_select_public ON public.app_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT settings FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_app_settings(p_settings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.app_settings SET settings = p_settings, updated_at = now();
  IF NOT FOUND THEN
    INSERT INTO public.app_settings (settings) VALUES (p_settings);
  END IF;
  PERFORM public.log_audit_entry('update', 'app_settings', NULL, p_settings, v_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_app_settings(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_maintenance_mode(p_on boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_current jsonb;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT settings INTO v_current FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;

  IF v_current IS NULL THEN
    INSERT INTO public.app_settings (settings) VALUES (jsonb_build_object('maintenance_mode', p_on));
  ELSE
    v_current = v_current || jsonb_build_object('maintenance_mode', p_on);
    UPDATE public.app_settings SET settings = v_current, updated_at = now();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_maintenance_mode(boolean) TO authenticated;

-- Final notices
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications, properties validation, and app settings setup applied (idempotent).';
  RAISE NOTICE '📱 Use the Supabase SQL editor or psql to run this script.';
END $$;
