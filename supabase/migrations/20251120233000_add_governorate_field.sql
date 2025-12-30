-- إضافة حقل المحافظة (governorate) إلى جدول العقارات
-- Migration created: 2025-11-20

-- 1. إضافة العمود governorate
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS governorate TEXT;

-- 2. إضافة CHECK constraint للتأكد من القيم المسموحة
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_governorate_check;
  EXCEPTION WHEN OTHERS THEN NULL; 
  END;
  
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_governorate_check
    CHECK (governorate IN ('erbil', 'duhok', 'sulaymaniyah') OR governorate IS NULL) NOT VALID;
END $$;

-- 3. إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_properties_governorate 
ON public.properties(governorate);

-- 4. تحديث دالة التحقق لتشمل governorate
CREATE OR REPLACE FUNCTION public.property_validation_core(p_new jsonb, p_old jsonb DEFAULT NULL)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  errs TEXT[] := ARRAY[]::TEXT[];
  property_type TEXT := lower(trim(coalesce(p_new->>'property_type','')));
  listing_type TEXT := lower(trim(coalesce(p_new->>'listing_type','')));
  governorate TEXT := lower(trim(coalesce(p_new->>'governorate','')));
  price_text TEXT := coalesce(p_new->>'price','');
  area_text TEXT := coalesce(p_new->>'area','');
  bedrooms_text TEXT := coalesce(p_new->>'bedrooms','');
  floor_text TEXT := trim(coalesce(p_new->>'floor',''));
  furnished_text TEXT := lower(trim(coalesce(p_new->>'furnished','')));
  v_price NUMERIC;
  v_area NUMERIC;
  v_bedrooms INTEGER;
BEGIN
  -- governorate (إلزامي)
  IF governorate = '' THEN
    errs := array_append(errs, 'المحافظة مطلوبة (governorate)');
  ELSIF governorate NOT IN ('erbil','duhok','sulaymaniyah') THEN
    errs := array_append(errs, 'المحافظة غير صالحة. القيم المسموح بها: erbil, duhok, sulaymaniyah');
  END IF;

  -- property_type
  IF property_type = '' THEN
    errs := array_append(errs, 'نوع العقار مطلوب (property_type)');
  ELSIF property_type NOT IN ('apartment','house','commercial') THEN
    errs := array_append(errs, 'نوع العقار غير صالح');
  END IF;

  -- listing_type
  IF listing_type = '' THEN
    errs := array_append(errs, 'نوع العرض مطلوب (listing_type)');
  ELSIF listing_type NOT IN ('sale','rent') THEN
    errs := array_append(errs, 'نوع العرض غير صالح');
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
      errs := array_append(errs, 'السعر غير صالح');
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
      errs := array_append(errs, 'المساحة غير صالحة');
    END;
  END IF;

  -- bedrooms for apartment/house
  IF property_type IN ('apartment','house') THEN
    IF bedrooms_text IS NULL OR trim(bedrooms_text) = '' THEN
      errs := array_append(errs, 'عدد غرف النوم مطلوب');
    ELSE
      BEGIN
        v_bedrooms := (bedrooms_text)::integer;
        IF v_bedrooms < 0 THEN
          errs := array_append(errs, 'عدد غرف النوم يجب أن يكون غير سالب');
        END IF;
      EXCEPTION WHEN others THEN
        errs := array_append(errs, 'عدد غرف النوم غير صالح');
      END;
    END IF;
  END IF;

  -- فقط الطابق مطلوب للشقق
  IF property_type = 'apartment' THEN
    IF floor_text = '' THEN 
      errs := array_append(errs, 'الطابق مطلوب للشقق'); 
    END IF;
  END IF;

  -- furnished required for rent
  IF listing_type = 'rent' THEN
    IF furnished_text = '' THEN
      errs := array_append(errs, 'حالة الأثاث مطلوبة عند الإيجار');
    ELSIF furnished_text NOT IN ('yes','no') THEN
      errs := array_append(errs, 'قيمة الأثاث غير صالحة');
    END IF;
  END IF;

  RETURN errs;
END;
$$;

COMMENT ON COLUMN public.properties.governorate IS 'المحافظة: erbil, duhok, or sulaymaniyah';
