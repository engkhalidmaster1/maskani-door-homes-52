-- إزالة متطلبات رقم العمارة ورقم الشقة للشقق
-- Migration created: 2025-11-20

-- تحديث دالة التحقق لجعل building و apartment اختيارية
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

  -- ✅ تم إزالة المتطلبات: building / apartment أصبحا اختياريين
  -- apartment specific: only floor required for apartments (building and apartment are now optional)
  IF property_type = 'apartment' THEN
    IF floor_text = '' THEN 
      errs := array_append(errs, 'الطابق مطلوب للشقق'); 
    END IF;
    -- building و apartment أصبحا اختياريين - تم حذف التحققات
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

-- تعليق على التحديث
COMMENT ON FUNCTION public.property_validation_core IS 'Updated: building and apartment fields are now optional for apartments (2025-11-20)';
