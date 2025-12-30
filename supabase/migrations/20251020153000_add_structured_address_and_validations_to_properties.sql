-- Migration: Add structured address columns and server-side validations for properties
-- Timestamp: 2025-10-20 15:30 (local)

-- Purpose:
-- 1) Add structured address columns (building, apartment, floor) and a 'furnished' column
-- 2) Add lightweight CHECK constraints (added NOT VALID so existing rows are not revalidated) for common invariants
-- 3) Add a reusable JSON-based validation core and a trigger that runs it BEFORE INSERT/UPDATE
-- 4) Add a small RPC so clients can pre-validate payloads before attempting to insert

-- 1) Add columns (idempotent)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS apartment TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS furnished TEXT;

-- 2) Add CHECK constraints as NOT VALID so they don't fail for historical rows, but they will be enforced for new inserts/updates
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

  -- price must be present and positive
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_price_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_price_positive
    CHECK (price IS NOT NULL AND price > 0) NOT VALID;

  -- area must be present and positive
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_area_positive;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_area_positive
    CHECK (area IS NOT NULL AND area > 0) NOT VALID;

  -- bedrooms must be non-negative when provided (specific per-type logic is handled by trigger)
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_bedrooms_nonnegative;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_bedrooms_nonnegative
    CHECK (bedrooms IS NULL OR bedrooms >= 0) NOT VALID;

  -- furnished must be 'yes' or 'no' when listing_type = 'rent'
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_furnished_for_rent;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_furnished_for_rent
    CHECK (listing_type <> 'rent' OR (furnished IS NOT NULL AND lower(furnished) IN ('yes','no'))) NOT VALID;
END $$;

-- 3) Validation core (returns array of error messages); this is used by the trigger and by the RPC below
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
    -- Only validate when relevant fields changed (avoid blocking legacy rows on unrelated updates)
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

-- Migration complete
