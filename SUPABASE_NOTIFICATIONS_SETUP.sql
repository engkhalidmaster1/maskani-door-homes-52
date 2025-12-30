
-- Supabase Notifications Setup - Complete Script
-- Copy and paste this entire script into Supabase SQL Editor

-- =============================================================================
-- STEP 1: Ensure Required Functions Exist (Dynamic Roles System)
-- =============================================================================

-- Create is_admin function if it doesn't exist
-- NOTE: Some Postgres versions don't allow changing the *names* of
-- input parameters via CREATE OR REPLACE. If a prior version of
-- is_admin exists with a different parameter name you'll get 42P13.
-- To ensure idempotent runs in SQL Editor we DROP the old signature
-- (safe to recreate immediately after). If you prefer not to DROP,
-- inspect the existing function first (see instructions below).
DROP FUNCTION IF EXISTS public.is_admin(uuid);
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- If legacy admin_users table exists, check it first
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    v_is_admin := v_is_admin OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = uid AND active IS DISTINCT FROM false
    );
  END IF;

  -- If user_roles table exists, check for app_role 'admin'
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    v_is_admin := v_is_admin OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'
    );
  END IF;

  RETURN v_is_admin;
END;
$$;

-- =============================================================================
-- STEP 2: Create/Fix Notifications Table and Policies
-- =============================================================================

-- Create notifications table with proper structure (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  type text DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now()
);

-- CRITICAL FIX: Drop existing type constraint and recreate with correct values
DO $$
BEGIN
  -- Drop existing constraint (all variations)
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_check;  
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS check_type;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  -- Add the correct constraint that allows 'broadcast'
  ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('system', 'broadcast', 'personal', 'alert', 'info', 'announcement', 'warning'));
    
  RAISE NOTICE 'Type constraint updated to allow broadcast notifications';
END $$;

-- Ensure RLS is enabled on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can select their own notifications
DO $$
BEGIN
  CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policy: users can update 'read' status of their notifications
DO $$
BEGIN
  CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policy: users can delete their own notifications; admins can delete any
DO $$
BEGIN
  CREATE POLICY notifications_delete_own ON public.notifications
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- By default, disallow inserts from clients; inserts happen via RPC

-- Broadcast RPC: create a notification for each existing user
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title text,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  -- Authorization: only admins
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Insert one notification per user (from auth.users to cover all accounts)
  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  SELECT gen_random_uuid(), u.id, p_title, p_message, false, 'broadcast', now()
  FROM auth.users u;
END;
$$;

-- Optional: mark all as read RPC for current user
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

-- Grants
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- Helpful server-side helpers
-- -----------------------------------------------------------------------------

-- Create a personal notification for a single user (admins only)
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
  -- Only admins (or service processes) may call this to create notifications for another user
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.notifications (id, user_id, title, message, read, type, created_at)
  VALUES (v_new_id, p_user_id, p_title, p_message, false, p_type, now());

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_personal_notification_for_user(uuid, text, text, text) TO authenticated;

-- Safe server-side delete helper for notifications
CREATE OR REPLACE FUNCTION public.delete_user_notification(
  p_id uuid
)
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

GRANT EXECUTE ON FUNCTION public.delete_user_notification(uuid) TO authenticated;

-- Table privileges: allow authenticated users to SELECT/UPDATE/DELETE rows
-- subject to the RLS policies above. This grants the permission but RLS
-- controls which rows a session can actually affect.
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Optional helpful indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_user_id_read'
  ) THEN
    CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
  END IF;
END $$;

-- Enable Realtime for notifications table
DO $$
BEGIN
  -- Ensure the publication exists and that the notifications table is included
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  ELSE
    -- If the publication doesn't exist, create it for notifications (safe default)
    CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications;
  END IF;
END $$;

-- Additional helpful indexes to speed common notification queries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_type') THEN
    CREATE INDEX idx_notifications_type ON public.notifications(type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
  END IF;
END $$;

-- =============================================================================
-- PROPERTIES: Structured address columns + server-side validations
-- (Idempotent: safe to run multiple times; functions created with CREATE OR REPLACE)
-- =============================================================================

-- 1) Add structured address and furnished columns (if not exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS apartment TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS furnished TEXT;

-- 2) Add lightweight CHECK constraints as NOT VALID so historical rows are not rejected
DO $$
BEGIN
  -- property_type allowed values
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_property_type_check
    CHECK (property_type IN ('apartment', 'house', 'commercial')) NOT VALID;

  -- listing_type allowed values
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_listing_type_check
    CHECK (listing_type IN ('sale', 'rent')) NOT VALID;

  -- price positive
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_price_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_price_positive
    CHECK (price IS NOT NULL AND price > 0) NOT VALID;

  -- area positive
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_area_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_area_positive
    CHECK (area IS NOT NULL AND area > 0) NOT VALID;

  -- bedrooms must be non-negative when present
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_bedrooms_nonnegative;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_bedrooms_nonnegative
    CHECK (bedrooms IS NULL OR bedrooms >= 0) NOT VALID;

  -- furnished must be 'yes'/'no' when listing_type = 'rent'
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_furnished_for_rent;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_furnished_for_rent
    CHECK (listing_type <> 'rent' OR (furnished IS NOT NULL AND lower(furnished) IN ('yes','no'))) NOT VALID;
END $$;

-- 3) Validation core (returns text[] of errors). Trigger will call this.
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
      -- Reject values that exceed the storage precision of NUMERIC(15,2)
      IF v_price IS NOT NULL AND v_price > 9999999999999.99 THEN
        errs := array_append(errs, 'السعر أكبر من الحد المسموح به');
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
      -- Reject values that exceed the storage precision of NUMERIC(10,2)
      IF v_area IS NOT NULL AND v_area > 99999999.99 THEN
        errs := array_append(errs, 'المساحة أكبر من الحد المسموح به');
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

-- 4) Trigger wrapper that calls the core and raises a descriptive exception when validation fails
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
    -- Only validate when relevant fields changed
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

-- Create the trigger (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_properties') THEN
    CREATE TRIGGER trg_validate_properties
      BEFORE INSERT OR UPDATE ON public.properties
      FOR EACH ROW EXECUTE FUNCTION public.validate_property_trigger();
  END IF;
END;
$$;

-- 5) Lightweight RPC to pre-validate client payloads
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

-- (دُوّن هنا ملاحظة: دالة فحص الأدوار أُزيلت كما طُلب - تبقى بقية الإعدادات والـ RPCs)

-- =============================================================================
-- APP SETTINGS: table + RPCs for application-level configuration
-- =============================================================================

-- Create a simple singleton-style settings table (stores JSONB blob)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Seed a default settings row if none exists (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings) THEN
    INSERT INTO public.app_settings (settings)
    VALUES (
      ('{"theme":"auto","primary":"213 94% 50%","primary_light":"217 91% 45%","font_size":"normal","maintenance_mode":false,"system_visible":true}'::jsonb)
    );
  END IF;
END $$;

-- Enable RLS and allow public SELECT via a simple policy (updates only via RPCs below)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY app_settings_select_public ON public.app_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Read helper: returns the current settings JSONB
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT settings FROM public.app_settings ORDER BY updated_at DESC LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_settings() TO authenticated;

-- Update helper: sets the whole settings JSONB (admin-only logic inside)
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

  -- Try to update the existing row; insert if none present
  UPDATE public.app_settings SET settings = p_settings, updated_at = now();
  IF NOT FOUND THEN
    INSERT INTO public.app_settings (settings) VALUES (p_settings);
  END IF;
  -- Audit the change
  PERFORM public.log_audit_entry('update', 'app_settings', NULL, p_settings, v_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_app_settings(jsonb) TO authenticated;

-- Convenience RPC to toggle maintenance mode only
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system setup complete!';
  RAISE NOTICE '📱 Users should now see notification bell in header';
  RAISE NOTICE '🔔 Admins can broadcast via Dashboard > Admin Controls';
  RAISE NOTICE '🗑️ Users (and admins via RPC) can delete notifications safely';
  RAISE NOTICE '⚡ Real-time updates are enabled';
END $$;

-- =============================================================================
-- PROPERTIES: CLEANUP REPORT & OPTIONAL SAFE NORMALIZATIONS
-- =============================================================================

-- Create a view showing properties that currently fail server-side validation.
-- Use this view to review problematic rows before applying fixes.
CREATE OR REPLACE VIEW public.properties_validation_issues AS
SELECT p.id, v.errs AS errors, p.property_type, p.listing_type, p.price, p.area, p.bedrooms, p.building, p.apartment, p.floor, p.furnished
FROM public.properties p
CROSS JOIN LATERAL (
  SELECT public.property_validation_core(to_jsonb(p), NULL) AS errs
) v
WHERE array_length(v.errs, 1) IS NOT NULL;

-- Report how many rows currently fail validation
DO $$
DECLARE
  cnt integer := 0;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.properties_validation_issues;
  RAISE NOTICE 'Found % problematic properties (inspect public.properties_validation_issues)', cnt;
END $$;

-- Create an audit table to store original rows before automated fixes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'properties_fix_audit'
  ) THEN
    CREATE TABLE public.properties_fix_audit (
      audit_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      property_id uuid NOT NULL,
      original_row jsonb NOT NULL,
      fixed_at timestamptz DEFAULT now(),
      note text
    );
    RAISE NOTICE 'Created table public.properties_fix_audit to store backups of rows before mass-fixes';
  END IF;
END $$;

-- SAFE NORMALIZATIONS (non-destructive). These operations are intended
-- to normalize text fields and clear fields that are inapplicable.
-- They do NOT attempt to invent numeric values; numeric issues are left
-- for manual review (see view above) or handled by the optional block below.
DO $$
DECLARE
  r record;
BEGIN
  -- Back up rows that will be modified by the normalization
  FOR r IN
    SELECT p.id AS pid, to_jsonb(p) AS original
    FROM public.properties p
    WHERE
      (building IS NOT NULL AND trim(building) <> '')
      OR (apartment IS NOT NULL AND trim(apartment) <> '')
      OR (floor IS NOT NULL AND trim(floor) <> '')
      OR (furnished IS NOT NULL AND trim(furnished) <> '')
      OR (property_type IS NOT NULL AND property_type <> lower(trim(property_type)))
      OR (listing_type IS NOT NULL AND listing_type <> lower(trim(listing_type)))
  LOOP
    -- Only insert audit once per property and note
    INSERT INTO public.properties_fix_audit (property_id, original_row, note)
    SELECT r.pid, r.original, 'normalize text fields'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.properties_fix_audit fa WHERE fa.property_id = r.pid AND fa.note = 'normalize text fields'
    );
  END LOOP;

  -- Perform normalization; updates are restricted to rows that were backed up above.
  -- The update uses CASE expressions so that for non-apartment properties we set
  -- apartment/building/floor to NULL (they are only required for apartments).
  UPDATE public.properties
  SET
    property_type = lower(trim(property_type)),
    listing_type = lower(trim(listing_type)),
    building = CASE WHEN lower(trim(coalesce(property_type,''))) <> 'apartment' THEN NULL ELSE NULLIF(trim(building),'') END,
    apartment = CASE WHEN lower(trim(coalesce(property_type,''))) <> 'apartment' THEN NULL ELSE NULLIF(trim(apartment),'') END,
    floor = CASE WHEN lower(trim(coalesce(property_type,''))) <> 'apartment' THEN NULL ELSE NULLIF(trim(floor),'') END,
    furnished = CASE
                 WHEN lower(trim(coalesce(listing_type,''))) = 'rent'
                   THEN NULLIF(lower(trim(furnished)),'')
                 ELSE NULL
                 END
  WHERE id IN (SELECT property_id FROM public.properties_fix_audit WHERE note = 'normalize text fields');

  RAISE NOTICE 'Normalization attempt complete; please re-check public.properties_validation_issues';
END $$;

-- OPTIONAL: Attempt safe numeric fixes (commented out)
-- This block will set missing or non-positive price/area to 1. It is
-- destructive and should be used only after manual review and backup.
-- Uncomment to apply.

-- DO $$
-- BEGIN
--   INSERT INTO public.properties_fix_audit (property_id, original_row, note)
--   SELECT id, to_jsonb(p), 'auto-fix price/area' FROM public.properties p
--   WHERE (price IS NULL OR price <= 0) OR (area IS NULL OR area <= 0);
-- 
--   UPDATE public.properties
--   SET price = CASE WHEN price IS NULL OR price <= 0 THEN 1 ELSE price END,
--       area  = CASE WHEN area IS NULL OR area <= 0 THEN 1 ELSE area  END
--   WHERE (price IS NULL OR price <= 0) OR (area IS NULL OR area <= 0);
-- 
--   RAISE NOTICE 'Auto-fixed price/area to 1 for properties with missing or non-positive values (audit in properties_fix_audit)';
-- END $$;

-- Re-check remaining issues after normalization
DO $$
DECLARE
  remain integer := 0;
BEGIN
  SELECT COUNT(*) INTO remain FROM public.properties_validation_issues;
  RAISE NOTICE 'After normalization there remain % problematic properties. Inspect public.properties_validation_issues', remain;
END $$;

-- When the view is empty (no remaining problems) you can VALIDATE the NOT VALID
-- constraints that were created earlier. Run each of the following ALTER TABLE
-- VALIDATE CONSTRAINT statements (they will succeed only when all rows comply):

-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_property_type_check;
-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_listing_type_check;
-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_price_positive;
-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_area_positive;
-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_bedrooms_nonnegative;
-- ALTER TABLE public.properties VALIDATE CONSTRAINT properties_furnished_for_rent;

-- OPTIONAL: After validating constraints you may drop the view and/or keep the
-- audit table for history. Example (run only when you are sure):
-- DROP VIEW IF EXISTS public.properties_validation_issues;
-- -- Keep the audit table for traceability; drop only if you are sure:
-- DROP TABLE IF EXISTS public.properties_fix_audit;

DO $$
BEGIN
  RAISE NOTICE '✅ Properties validation/cleanup section appended. Review public.properties_validation_issues, run manual fixes or the optional auto-fix if appropriate, then VALIDATE constraints.';
END $$;