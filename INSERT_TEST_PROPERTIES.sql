-- ============================================================================
-- ملف: إضافة بيانات اختبارية للعقارات
-- Test Properties Data - جميع أنواع العقارات (22 نوع)
-- التاريخ: 20 نوفمبر 2025
-- ============================================================================

-- ملاحظة: استبدل 'your-user-id-here' بـ UUID المستخدم الفعلي
-- يمكنك الحصول عليه من: SELECT id FROM auth.users LIMIT 1;

-- متغير لتخزين user_id (للتسهيل)
DO $$
DECLARE
  test_user_id UUID;
  test_location TEXT := 'الرياض، حي النخيل';
  test_market TEXT := 'شمال الرياض';
BEGIN
  -- الحصول على أول مستخدم أو إنشاء user_id افتراضي
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- إذا لم يوجد مستخدم، استخدم UUID افتراضي (يجب تغييره)
  IF test_user_id IS NULL THEN
    test_user_id := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; -- يجب تغييره
    RAISE NOTICE 'تحذير: لا يوجد مستخدمين! استخدم UUID افتراضي. يرجى تحديث user_id في الملف.';
  END IF;

  RAISE NOTICE 'استخدام User ID: %', test_user_id;

  -- ============================================================================
  -- 1. عقارات سكنية (Residential) - 7 أنواع
  -- ============================================================================

  -- 1.1. شقة (Apartment)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, building, apartment, floor, location, market,
    balcony, parking, elevator, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'شقة فاخرة 3 غرف في حي النخيل',
    'شقة واسعة ومجهزة بالكامل في موقع مميز قريب من جميع الخدمات مع مواقف خاصة',
    'apartment', 'sale', 450000, 150,
    3, 2, 'عمارة 5', 'شقة 201', 'الطابق الثاني',
    test_location, test_market,
    true, true, true, 'yes',
    ARRAY['تكييف مركزي', 'إنترنت عالي السرعة', 'أمن وحراسة 24 ساعة'],
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    true
  );

  -- 1.2. منزل (House)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, floors_count, location, market,
    garden, garage, parking, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'منزل عائلي مع حديقة واسعة',
    'منزل مستقل بطابقين مع حديقة أمامية وخلفية، مثالي للعائلات الكبيرة',
    'house', 'sale', 850000, 300,
    5, 3, 2, test_location, test_market,
    true, true, true, 'no',
    ARRAY['مطبخ حديث', 'غرفة معيشة واسعة', 'حديقة مزروعة'],
    ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    true
  );

  -- 1.3. فيلا (Villa)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, floors_count, land_area, building_area, location, market,
    garden, garage, swimming_pool, maid_room, driver_room, parking, furnished,
    amenities, images, is_published
  ) VALUES (
    test_user_id,
    'فيلا فاخرة مع مسبح خاص',
    'فيلا راقية بتصميم عصري مع مسبح خاص وحديقة كبيرة، موقع هادئ ومميز',
    'villa', 'sale', 2500000, 500,
    6, 5, 2, 800, 500, test_location, test_market,
    true, true, true, true, true, true, 'yes',
    ARRAY['مسبح خاص', 'غرفة سينما', 'صالة رياضية', 'جاكوزي'],
    ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811'],
    true
  );

  -- 1.4. استوديو (Studio)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bathrooms, building, apartment, floor, location, market,
    balcony, parking, elevator, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'استوديو مفروش بالكامل للإيجار',
    'استوديو حديث مفروش بالكامل مع جميع المرافق، مثالي للعزاب',
    'studio', 'rent', 2000, 45,
    1, 'برج المها', 'استوديو 105', 'الطابق الأول',
    test_location, test_market,
    true, true, true, 'yes',
    ARRAY['مفروش بالكامل', 'واي فاي مجاني', 'مطبخ أمريكي'],
    ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
    true
  );

  -- 1.5. دوبلكس (Duplex)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, floors_count, building, apartment, floor, location, market,
    balcony, parking, elevator, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'دوبلكس فخم بطابقين',
    'دوبلكس واسع بطابقين مع شرفات متعددة وإطلالة رائعة',
    'duplex', 'sale', 750000, 250,
    4, 3, 2, 'عمارة النخيل', 'دوبلكس 301-401', 'الطابقين 3 و 4',
    test_location, test_market,
    true, true, true, 'no',
    ARRAY['إطلالة بانورامية', 'تشطيب فاخر', 'شرفات واسعة'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'],
    true
  );

  -- 1.6. بنتهاوس (Penthouse)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, building, apartment, floor, location, market,
    balcony, parking, elevator, furnished, swimming_pool, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'بنتهاوس فاخر مع مسبح على السطح',
    'شقة فاخرة في الطابق العلوي مع مسبح خاص على السطح وإطلالة 360 درجة',
    'penthouse', 'sale', 3000000, 400,
    5, 4, 'برج الفيصلية', 'بنتهاوس', 'الطابق 25',
    test_location, test_market,
    true, true, true, 'yes', true,
    ARRAY['مسبح خاص على السطح', 'جاكوزي', 'مصعد خاص', 'خدمة كونسيرج'],
    ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'],
    true
  );

  -- 1.7. غرفة (Room)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, room_type, furnished, location, market,
    shared_bathroom, parking, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'غرفة مفردة مفروشة للإيجار',
    'غرفة نظيفة ومريحة مع حمام خاص في شقة مشتركة',
    'room', 'rent', 800, 20,
    'عمارة السلام', 'الطابق الثالث', 'single', 'yes',
    test_location, test_market,
    false, true,
    ARRAY['حمام خاص', 'مفروشة بالكامل', 'إنترنت مشترك'],
    ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457'],
    true
  );

  -- ============================================================================
  -- 2. عقارات تجارية (Commercial) - 6 أنواع
  -- ============================================================================

  -- 2.1. محل تجاري (Shop)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, shop_type, location, market,
    street_facing, parking, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'محل تجاري على شارع رئيسي',
    'محل بموقع ممتاز على شارع رئيسي مع واجهة زجاجية كبيرة',
    'shop', 'rent', 5000, 80,
    'مجمع الأعمال', 'الأرضي', 'متجر ملابس',
    test_location, test_market,
    true, true,
    ARRAY['واجهة زجاجية', 'موقع استراتيجي', 'إضاءة ممتازة'],
    ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8'],
    true
  );

  -- 2.2. مكتب (Office)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, office_number, rooms_count, location, market,
    furnished, parking, elevator, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'مكتب إداري مجهز بالكامل',
    'مكتب حديث مع 3 غرف اجتماعات ومساحة عمل مفتوحة',
    'office', 'rent', 8000, 120,
    'برج الأعمال', 'الطابق 5', 'مكتب 501', 3,
    test_location, test_market,
    'yes', true, true,
    ARRAY['أثاث مكتبي', 'إنترنت عالي السرعة', 'قاعة اجتماعات'],
    ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c'],
    true
  );

  -- 2.3. مستودع (Warehouse)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    height, location, market,
    loading_dock, cold_storage, parking, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'مستودع كبير مع مبرد',
    'مستودع واسع مع نظام تبريد ومنصة تحميل، مثالي للمواد الغذائية',
    'warehouse', 'rent', 15000, 500,
    6, test_location, test_market,
    true, true, true,
    ARRAY['نظام تبريد', 'منصة تحميل', 'أمن وحراسة', 'إضاءة LED'],
    ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'],
    true
  );

  -- 2.4. معرض (Showroom)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, location, market,
    street_facing, parking, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'معرض تجاري بواجهة زجاجية',
    'معرض واسع مع واجهة زجاجية كاملة وإضاءة احترافية',
    'showroom', 'rent', 12000, 200,
    'مجمع المعارض', 'الأرضي', test_location, test_market,
    true, true,
    ARRAY['واجهة زجاجية 360', 'إضاءة احترافية', 'موقع مميز جداً'],
    ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571'],
    true
  );

  -- 2.5. مطعم/كافيه (Restaurant/Cafe)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, location, market,
    street_facing, parking, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'مطعم مجهز بالكامل للإيجار',
    'مطعم جاهز بمطبخ كامل ومعدات، موقع حيوي مع موقف واسع',
    'restaurant_cafe', 'rent', 18000, 180,
    'مجمع المطاعم', 'الأرضي', test_location, test_market,
    true, true, 'yes',
    ARRAY['مطبخ صناعي كامل', 'طاولات وكراسي', 'ديكور جاهز', 'رخصة سارية'],
    ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'],
    true
  );

  -- 2.6. عيادة (Clinic)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    building, floor, office_number, rooms_count, location, market,
    parking, elevator, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'عيادة طبية مجهزة',
    'عيادة حديثة مع غرفتي فحص وغرفة انتظار، موقع طبي مميز',
    'clinic', 'rent', 10000, 100,
    'البرج الطبي', 'الطابق 3', 'عيادة 301', 2,
    test_location, test_market,
    true, true,
    ARRAY['غرفتي فحص', 'غرفة انتظار', 'حمامات نظيفة', 'مكيف مركزي'],
    ARRAY['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d'],
    true
  );

  -- ============================================================================
  -- 3. أراضي (Land) - 4 أنواع
  -- ============================================================================

  -- 3.1. أرض سكنية (Residential Land)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    land_area, street_width, land_type, location, market,
    street_facing, corner, licensed, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'أرض سكنية على زاويتين',
    'أرض مميزة على زاويتين في حي راقي، جاهزة للبناء مع رخصة بناء',
    'residential_land', 'sale', 1200000, 500,
    500, 15, 'residential', test_location, test_market,
    true, true, true,
    ARRAY['على شارعين', 'رخصة بناء جاهزة', 'حي راقي', 'جميع الخدمات متوفرة'],
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef'],
    true
  );

  -- 3.2. أرض تجارية (Commercial Land)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    land_area, street_width, land_type, location, market,
    street_facing, corner, licensed, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'أرض تجارية على شارع رئيسي',
    'أرض تجارية في موقع حيوي على شارع تجاري رئيسي، استثمار مضمون',
    'commercial_land', 'sale', 3000000, 800,
    800, 20, 'commercial', test_location, test_market,
    true, false, true,
    ARRAY['شارع رئيسي', 'كثافة مرورية عالية', 'رخصة تجارية', 'موقع استراتيجي'],
    ARRAY['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'],
    true
  );

  -- 3.3. أرض زراعية (Agricultural Land)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    land_area, street_width, land_type, location, market,
    licensed, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'أرض زراعية خصبة مع بئر',
    'أرض زراعية واسعة مع بئر ارتوازي وتربة خصبة',
    'agricultural_land', 'sale', 500000, 2000,
    2000, 8, 'agricultural', test_location, test_market,
    true,
    ARRAY['بئر ارتوازي', 'تربة خصبة', 'سياج كامل', 'كهرباء متوفرة'],
    ARRAY['https://images.unsplash.com/photo-1464226184884-fa280b87c399'],
    true
  );

  -- 3.4. أرض صناعية (Industrial Land)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    land_area, street_width, land_type, location, market,
    street_facing, corner, licensed, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'أرض صناعية في المنطقة الصناعية',
    'أرض صناعية مرخصة في المنطقة الصناعية الثانية',
    'industrial_land', 'sale', 2000000, 1500,
    1500, 12, 'industrial', test_location, test_market,
    true, true, true,
    ARRAY['منطقة صناعية مرخصة', 'كهرباء 3 فاز', 'ماء صناعي', 'صرف صحي'],
    ARRAY['https://images.unsplash.com/photo-1581093588401-fbb62a02f120'],
    true
  );

  -- ============================================================================
  -- 4. عقارات خاصة (Special) - 2 نوع
  -- ============================================================================

  -- 4.1. مزرعة (Farm)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    land_area, building_area, bedrooms, bathrooms, location, market,
    amenities, images, is_published
  ) VALUES (
    test_user_id,
    'مزرعة كبيرة مع بيت ومرافق',
    'مزرعة واسعة مع بيت مكون من 3 غرف ومرافق زراعية كاملة',
    'farm', 'sale', 1800000, 5000,
    5000, 200, 3, 2, test_location, test_market,
    ARRAY['بيت ريفي', 'بئر ارتوازي', 'أشجار مثمرة', 'حظيرة ماشية', 'مخزن أعلاف'],
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef'],
    true
  );

  -- 4.2. شاليه (Chalet)
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, market,
    garden, swimming_pool, parking, furnished, amenities, images, is_published
  ) VALUES (
    test_user_id,
    'شاليه ساحلي مع مسبح',
    'شاليه جميل على البحر مع حديقة ومسبح خاص، مفروش بالكامل',
    'chalet', 'rent', 3000, 150,
    3, 2, test_location, test_market,
    true, true, true, 'yes',
    ARRAY['إطلالة بحرية', 'مسبح خاص', 'شواية خارجية', 'ألعاب أطفال'],
    ARRAY['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2'],
    true
  );

  RAISE NOTICE 'تم إضافة 20 عقار اختباري بنجاح!';
  RAISE NOTICE 'الأنواع: 7 سكنية + 6 تجارية + 4 أراضي + 2 خاصة';

END $$;

-- ============================================================================
-- التحقق من البيانات
-- ============================================================================

-- عرض عدد العقارات لكل نوع
SELECT 
  property_type,
  COUNT(*) as count,
  AVG(price) as avg_price,
  AVG(area) as avg_area
FROM public.properties
WHERE title LIKE '%اختبار%' OR title LIKE '%فخم%' OR title LIKE '%مميز%'
GROUP BY property_type
ORDER BY property_type;

-- ============================================================================
-- ملاحظات مهمة
-- ============================================================================

/*
1. تأكد من تغيير test_user_id إلى UUID مستخدم فعلي من قاعدة البيانات
2. يمكنك تعديل القيم (الأسعار، المساحات، المواقع) حسب الحاجة
3. جميع العقارات منشورة (is_published = true) لسهولة الاختبار
4. تم إضافة صور من Unsplash كأمثلة (يمكن استبدالها)
5. جميع العقارات تحتوي على البيانات المطلوبة لكل نوع حسب التكوين
6. لإضافة المزيد من العقارات، يمكنك نسخ ولصق النماذج وتعديلها

لعرض جميع العقارات المضافة:
SELECT property_type, title, price, area, listing_type 
FROM public.properties 
ORDER BY property_type, created_at DESC;

لحذف جميع العقارات الاختبارية (إذا لزم الأمر):
-- DELETE FROM public.properties WHERE user_id = 'test-user-id-here';
*/
