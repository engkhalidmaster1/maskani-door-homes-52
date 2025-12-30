-- ======================================================================
-- Migration: Property Types Comprehensive System
-- Date: 2025-11-15 12:00:00
-- Purpose: Implement a complete logical property type system with 
--          conditional field requirements
-- ======================================================================

-- ============================================================
-- PART 1: Extend property_type enum with all supported types
-- ============================================================

-- Drop and recreate the property_type enum to include all types
-- Note: This requires migration if existing data uses old values
DO $$
BEGIN
  -- Create new enum with all property types
  CREATE TYPE public.property_type_new AS ENUM (
    -- Residential
    'apartment',           -- شقة
    'house',              -- بيت/منزل
    'villa',              -- فيلا
    'studio',             -- استوديو
    'duplex',             -- دوبلكس
    'penthouse',          -- بنتهاوس
    'room',               -- غرفة
    
    -- Commercial
    'shop',               -- محل تجاري
    'office',             -- مكتب
    'warehouse',          -- مستودع
    'showroom',           -- معرض
    'restaurant_cafe',    -- مطعم/كافيه
    'clinic',             -- عيادة
    
    -- Land
    'residential_land',   -- أرض سكنية
    'commercial_land',    -- أرض تجارية
    'agricultural_land',  -- أرض زراعية
    'industrial_land',    -- أرض صناعية
    
    -- Special
    'farm',               -- مزرعة
    'chalet',             -- شاليه
    
    -- Legacy (keep for backwards compatibility)
    'commercial'          -- محل تجاري (قديم)
  );

  -- Migrate existing data: map 'commercial' to 'shop' for clarity
  -- But keep 'commercial' in enum for now
  ALTER TABLE public.properties 
    ALTER COLUMN property_type TYPE public.property_type_new 
    USING (property_type::text::public.property_type_new);

  -- Drop old enum
  DROP TYPE IF EXISTS public.property_type CASCADE;

  -- Rename new enum
  ALTER TYPE public.property_type_new RENAME TO property_type;

EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Type already exists
  WHEN undefined_column THEN
    NULL; -- Column doesn't exist in old schema
END $$;

-- ============================================================
-- PART 2: Add new fields to properties table
-- ============================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER CHECK (bathrooms >= 0),
  ADD COLUMN IF NOT EXISTS floors_count INTEGER CHECK (floors_count >= 1),
  ADD COLUMN IF NOT EXISTS land_area NUMERIC(10,2) CHECK (land_area > 0),
  ADD COLUMN IF NOT EXISTS building_area NUMERIC(10,2) CHECK (building_area > 0),
  ADD COLUMN IF NOT EXISTS street_width NUMERIC(6,2) CHECK (street_width > 0),
  ADD COLUMN IF NOT EXISTS balcony BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS elevator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS garden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS garage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS swimming_pool BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maid_room BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_room BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS street_facing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS corner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS licensed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cold_storage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS loading_dock BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS height NUMERIC(6,2) CHECK (height > 0),
  ADD COLUMN IF NOT EXISTS shop_type TEXT,
  ADD COLUMN IF NOT EXISTS office_number TEXT,
  ADD COLUMN IF NOT EXISTS rooms_count INTEGER CHECK (rooms_count >= 0),
  ADD COLUMN IF NOT EXISTS land_type TEXT CHECK (land_type IN ('residential', 'commercial', 'agricultural', 'industrial')),
  ADD COLUMN IF NOT EXISTS room_type TEXT CHECK (room_type IN ('single', 'shared')),
  ADD COLUMN IF NOT EXISTS shared_bathroom BOOLEAN DEFAULT false;

-- ============================================================
-- PART 3: Create property_type_fields_config table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.property_type_fields_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_type TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'land', 'special')),
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  optional_fields TEXT[] NOT NULL DEFAULT '{}',
  excluded_fields TEXT[] NOT NULL DEFAULT '{}',
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.property_type_fields_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for UI)
CREATE POLICY "Anyone can view active property type configs"
  ON public.property_type_fields_config
  FOR SELECT
  USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage property type configs"
  ON public.property_type_fields_config
  FOR ALL
  USING (public.is_admin());

-- ============================================================
-- PART 4: Insert configuration for each property type
-- ============================================================

INSERT INTO public.property_type_fields_config (
  property_type, category, required_fields, optional_fields, excluded_fields,
  display_name_ar, display_name_en, description_ar, sort_order
) VALUES
-- Residential
('apartment', 'residential',
  ARRAY['building', 'apartment', 'floor', 'bedrooms'],
  ARRAY['bathrooms', 'balcony', 'parking', 'elevator', 'furnished'],
  ARRAY['floors_count', 'garden', 'garage', 'swimming_pool', 'land_area', 'land_type', 'shop_type', 'height'],
  'شقة', 'Apartment', 'وحدة سكنية داخل عمارة', 1),

('house', 'residential',
  ARRAY['bedrooms'],
  ARRAY['bathrooms', 'floors_count', 'garden', 'garage', 'parking', 'furnished'],
  ARRAY['building', 'apartment', 'floor', 'elevator', 'land_type', 'shop_type', 'height'],
  'بيت / منزل', 'House', 'بناء سكني مستقل', 2),

('villa', 'residential',
  ARRAY['bedrooms', 'bathrooms', 'floors_count'],
  ARRAY['land_area', 'building_area', 'garden', 'garage', 'swimming_pool', 'maid_room', 'driver_room', 'parking', 'furnished'],
  ARRAY['building', 'apartment', 'floor', 'elevator', 'land_type', 'shop_type', 'height'],
  'فيلا', 'Villa', 'منزل فاخر مع حديقة', 3),

('studio', 'residential',
  ARRAY['building', 'apartment', 'floor'],
  ARRAY['bathrooms', 'balcony', 'parking', 'elevator', 'furnished'],
  ARRAY['bedrooms', 'floors_count', 'garden', 'land_area', 'land_type', 'shop_type'],
  'استوديو', 'Studio', 'وحدة صغيرة مفتوحة', 4),

('duplex', 'residential',
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'floors_count'],
  ARRAY['balcony', 'parking', 'elevator', 'furnished'],
  ARRAY['garden', 'garage', 'land_area', 'land_type', 'shop_type', 'height'],
  'دوبلكس', 'Duplex', 'وحدة سكنية بطابقين', 5),

('penthouse', 'residential',
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms'],
  ARRAY['balcony', 'parking', 'elevator', 'furnished', 'swimming_pool'],
  ARRAY['land_area', 'land_type', 'shop_type', 'height'],
  'بنتهاوس', 'Penthouse', 'شقة فاخرة في الطابق العلوي', 6),

('room', 'residential',
  ARRAY['building', 'floor', 'room_type', 'furnished'],
  ARRAY['apartment', 'shared_bathroom', 'parking'],
  ARRAY['bedrooms', 'bathrooms', 'land_area', 'land_type', 'shop_type'],
  'غرفة', 'Room', 'غرفة مفردة للإيجار', 7),

-- Commercial
('shop', 'commercial',
  ARRAY[],
  ARRAY['building', 'floor', 'shop_type', 'street_facing', 'parking'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'furnished', 'floors_count', 'garden', 'land_type'],
  'محل تجاري', 'Shop', 'محل للبيع بالتجزئة', 10),

('office', 'commercial',
  ARRAY['building', 'floor'],
  ARRAY['office_number', 'rooms_count', 'furnished', 'parking', 'elevator'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'garden', 'land_type', 'shop_type'],
  'مكتب', 'Office', 'مساحة عمل إدارية', 11),

('warehouse', 'commercial',
  ARRAY[],
  ARRAY['height', 'loading_dock', 'cold_storage', 'parking'],
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'furnished', 'land_type'],
  'مستودع', 'Warehouse', 'مساحة تخزين', 12),

('showroom', 'commercial',
  ARRAY[],
  ARRAY['building', 'floor', 'street_facing', 'parking'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'furnished', 'land_type'],
  'معرض', 'Showroom', 'مساحة عرض تجاري', 13),

('restaurant_cafe', 'commercial',
  ARRAY[],
  ARRAY['building', 'floor', 'street_facing', 'parking', 'furnished'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'land_type'],
  'مطعم / كافيه', 'Restaurant/Cafe', 'مساحة مطاعم', 14),

('clinic', 'commercial',
  ARRAY['building', 'floor'],
  ARRAY['office_number', 'rooms_count', 'parking', 'elevator'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'furnished', 'land_type'],
  'عيادة', 'Clinic', 'مساحة طبية', 15),

-- Land
('residential_land', 'land',
  ARRAY['land_type'],
  ARRAY['street_width', 'street_facing', 'corner', 'licensed'],
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'furnished', 'floors_count'],
  'أرض سكنية', 'Residential Land', 'أرض للبناء السكني', 20),

('commercial_land', 'land',
  ARRAY['land_type'],
  ARRAY['street_width', 'street_facing', 'corner', 'licensed'],
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'furnished', 'floors_count'],
  'أرض تجارية', 'Commercial Land', 'أرض للبناء التجاري', 21),

('agricultural_land', 'land',
  ARRAY['land_type'],
  ARRAY['street_width', 'licensed'],
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'furnished', 'floors_count'],
  'أرض زراعية', 'Agricultural Land', 'أرض للزراعة', 22),

('industrial_land', 'land',
  ARRAY['land_type'],
  ARRAY['street_width', 'street_facing', 'corner', 'licensed'],
  ARRAY['building', 'apartment', 'floor', 'bedrooms', 'bathrooms', 'furnished', 'floors_count'],
  'أرض صناعية', 'Industrial Land', 'أرض للمصانع', 23),

-- Special
('farm', 'special',
  ARRAY[],
  ARRAY['land_area', 'building_area', 'bedrooms', 'bathrooms'],
  ARRAY['building', 'apartment', 'floor', 'elevator', 'land_type'],
  'مزرعة', 'Farm', 'أرض زراعية مع مباني', 30),

('chalet', 'special',
  ARRAY['bedrooms'],
  ARRAY['bathrooms', 'garden', 'swimming_pool', 'parking', 'furnished'],
  ARRAY['building', 'apartment', 'floor', 'elevator', 'land_type'],
  'شاليه', 'Chalet', 'بيت ريفي أو ساحلي', 31),

-- Legacy
('commercial', 'commercial',
  ARRAY[],
  ARRAY['building', 'floor', 'shop_type', 'street_facing', 'parking'],
  ARRAY['apartment', 'bedrooms', 'bathrooms', 'furnished', 'land_type'],
  'تجاري (قديم)', 'Commercial (Legacy)', 'نوع تجاري قديم', 99)

ON CONFLICT (property_type) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  optional_fields = EXCLUDED.optional_fields,
  excluded_fields = EXCLUDED.excluded_fields,
  display_name_ar = EXCLUDED.display_name_ar,
  display_name_en = EXCLUDED.display_name_en,
  description_ar = EXCLUDED.description_ar,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================================
-- PART 5: Enhanced validation function
-- ============================================================

CREATE OR REPLACE FUNCTION public.property_validation_core_v2(p_new jsonb, p_old jsonb DEFAULT NULL)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  errs TEXT[] := ARRAY[]::TEXT[];
  property_type TEXT := lower(trim(coalesce(p_new->>'property_type','')));
  listing_type TEXT := lower(trim(coalesce(p_new->>'listing_type','')));
  config RECORD;
  field TEXT;
  field_value TEXT;
BEGIN
  -- Basic validations (same as before)
  IF property_type = '' THEN
    errs := array_append(errs, 'نوع العقار مطلوب');
    RETURN errs; -- Can't proceed without property type
  END IF;

  IF listing_type = '' THEN
    errs := array_append(errs, 'نوع العرض مطلوب');
  ELSIF listing_type NOT IN ('sale','rent') THEN
    errs := array_append(errs, 'نوع العرض غير صالح');
  END IF;

  -- Price validation
  BEGIN
    IF (p_new->>'price')::numeric <= 0 THEN
      errs := array_append(errs, 'السعر يجب أن يكون أكبر من صفر');
    END IF;
  EXCEPTION WHEN others THEN
    errs := array_append(errs, 'السعر غير صالح');
  END;

  -- Area validation
  BEGIN
    IF (p_new->>'area')::numeric <= 0 THEN
      errs := array_append(errs, 'المساحة يجب أن تكون أكبر من صفر');
    END IF;
  EXCEPTION WHEN others THEN
    errs := array_append(errs, 'المساحة غير صالحة');
  END;

  -- Get config for this property type
  SELECT * INTO config
  FROM public.property_type_fields_config
  WHERE property_type_fields_config.property_type = property_validation_core_v2.property_type
    AND is_active = true;

  IF NOT FOUND THEN
    errs := array_append(errs, format('نوع العقار "%s" غير مدعوم', property_type));
    RETURN errs;
  END IF;

  -- Check required fields
  FOREACH field IN ARRAY config.required_fields
  LOOP
    field_value := trim(coalesce(p_new->>field, ''));
    IF field_value = '' OR field_value = 'null' THEN
      errs := array_append(errs, format('الحقل "%s" مطلوب لنوع العقار "%s"', field, config.display_name_ar));
    END IF;
  END LOOP;

  -- Special case: furnished required for rent on residential types
  IF listing_type = 'rent' AND config.category = 'residential' THEN
    field_value := lower(trim(coalesce(p_new->>'furnished', '')));
    IF field_value = '' THEN
      errs := array_append(errs, 'حالة الأثاث مطلوبة عند الإيجار');
    ELSIF field_value NOT IN ('yes', 'no') THEN
      errs := array_append(errs, 'قيمة الأثاث غير صالحة (yes/no)');
    END IF;
  END IF;

  -- Special case: land_type for land categories
  IF config.category = 'land' AND 'land_type' = ANY(config.required_fields) THEN
    field_value := lower(trim(coalesce(p_new->>'land_type', '')));
    IF field_value NOT IN ('residential', 'commercial', 'agricultural', 'industrial') THEN
      errs := array_append(errs, 'نوع الأرض غير صالح');
    END IF;
  END IF;

  RETURN errs;
END;
$$;

-- Update trigger to use new validation
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

  validation_errors := public.property_validation_core_v2(to_jsonb(NEW), CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END);

  IF array_length(validation_errors, 1) IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE = format('Property validation failed: %s', array_to_string(validation_errors, '; ')), ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 6: RPC to get field configuration for a property type
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_property_type_config(p_property_type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  config_row RECORD;
BEGIN
  SELECT * INTO config_row
  FROM public.property_type_fields_config
  WHERE property_type = p_property_type AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Property type not found');
  END IF;

  RETURN to_jsonb(config_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_type_config(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_type_config(TEXT) TO anon;

-- ============================================================
-- PART 7: RPC to list all active property types
-- ============================================================

CREATE OR REPLACE FUNCTION public.list_property_types(p_category TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_category IS NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'value', property_type,
        'label_ar', display_name_ar,
        'label_en', display_name_en,
        'category', category,
        'description', description_ar,
        'icon', icon
      ) ORDER BY sort_order
    ) INTO result
    FROM public.property_type_fields_config
    WHERE is_active = true;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        'value', property_type,
        'label_ar', display_name_ar,
        'label_en', display_name_en,
        'category', category,
        'description', description_ar,
        'icon', icon
      ) ORDER BY sort_order
    ) INTO result
    FROM public.property_type_fields_config
    WHERE is_active = true AND category = p_category;
  END IF;

  RETURN coalesce(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_property_types(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_property_types(TEXT) TO anon;

-- ============================================================
-- PART 8: Update validation RPC to use new version
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_property_payload(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  errs TEXT[];
BEGIN
  errs := public.property_validation_core_v2(p_payload, NULL);
  RETURN jsonb_build_object(
    'valid', CASE WHEN array_length(errs,1) IS NULL THEN true ELSE false END,
    'errors', errs
  );
END;
$$;

-- ============================================================
-- Migration complete
-- ============================================================

COMMENT ON TABLE public.property_type_fields_config IS 'Configuration table defining required/optional/excluded fields for each property type';
COMMENT ON FUNCTION public.property_validation_core_v2(jsonb, jsonb) IS 'Enhanced validation function that uses property_type_fields_config';
COMMENT ON FUNCTION public.get_property_type_config(TEXT) IS 'Returns field configuration for a specific property type';
COMMENT ON FUNCTION public.list_property_types(TEXT) IS 'Lists all active property types, optionally filtered by category';
