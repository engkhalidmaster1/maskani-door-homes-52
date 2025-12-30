-- ============================================================================
-- ملف: إضافة بيانات اختبارية للعقارات (نسخة مبسطة)
-- Test Properties Data - للحقول الأساسية فقط
-- التاريخ: 20 نوفمبر 2025
-- ملاحظة: هذه النسخة تعمل مع الحقول الأساسية الموجودة قبل migration
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  test_location TEXT := 'الرياض، حي النخيل';
BEGIN
  -- الحصول على أول مستخدم
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'لا يوجد مستخدمين في النظام! يرجى إنشاء مستخدم أولاً.';
  END IF;

  RAISE NOTICE 'استخدام User ID: %', test_user_id;

  -- ============================================================================
  -- عقارات سكنية
  -- ============================================================================

  -- شقة للبيع
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    building, apartment, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'شقة فاخرة 3 غرف في حي النخيل',
    'شقة واسعة ومجهزة بالكامل في موقع مميز قريب من جميع الخدمات',
    'apartment', 'sale', 450000, 150,
    3, 2, test_location, 'شارع الملك فهد',
    'عمارة 5', 'شقة 201', 'الطابق الثاني', 'yes',
    ARRAY['تكييف مركزي', 'مصعد', 'موقف سيارات', 'أمن وحراسة'],
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    true,
    public.generate_property_code(3, NOW())
  );

  -- شقة للإيجار
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    building, apartment, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'شقة مفروشة للإيجار 2 غرفة',
    'شقة مفروشة بالكامل جاهزة للسكن',
    'apartment', 'rent', 2500, 120,
    2, 1, test_location, 'شارع العليا',
    'برج السلام', 'شقة 15', 'الطابق الأول', 'yes',
    ARRAY['مفروشة بالكامل', 'إنترنت', 'تكييف'],
    ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
    true,
    public.generate_property_code(2, NOW())
  );

  -- منزل للبيع
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'منزل عائلي واسع',
    'منزل مستقل مع حديقة، مثالي للعائلات',
    'house', 'sale', 850000, 300,
    5, 3, test_location, 'حي الورود',
    ARRAY['حديقة', 'موقف سيارات', 'مطبخ حديث'],
    ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
    true,
    public.generate_property_code(5, NOW())
  );

  -- فيلا فاخرة
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'فيلا فاخرة مع مسبح',
    'فيلا راقية بتصميم عصري مع مسبح وحديقة كبيرة',
    'house', 'sale', 2500000, 500,
    6, 5, test_location, 'حي الربيع',
    ARRAY['مسبح خاص', 'حديقة واسعة', 'غرفة خادمة', 'مجلس رجال'],
    ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811'],
    true,
    public.generate_property_code(6, NOW())
  );

  -- استوديو للإيجار
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    building, apartment, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'استوديو مفروش بالكامل',
    'استوديو حديث مفروش مع جميع المرافق',
    'apartment', 'rent', 1800, 45,
    1, 1, test_location, 'شارع التحلية',
    'برج المها', 'استوديو 105', 'الطابق الأول', 'yes',
    ARRAY['مفروش بالكامل', 'واي فاي', 'مطبخ أمريكي'],
    ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457'],
    true,
    public.generate_property_code(1, NOW())
  );

  -- ============================================================================
  -- عقارات تجارية
  -- ============================================================================

  -- محل تجاري
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    location, address,
    building, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'محل تجاري على شارع رئيسي',
    'محل بموقع ممتاز مع واجهة زجاجية كبيرة',
    'commercial', 'rent', 5000, 80,
    test_location, 'شارع الملك عبدالله',
    'مجمع الأعمال', 'الأرضي', 'no',
    ARRAY['واجهة زجاجية', 'موقع استراتيجي', 'موقف سيارات'],
    ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8'],
    true,
    public.generate_property_code(0, NOW())
  );

  -- مكتب إداري
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    location, address,
    building, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'مكتب إداري مجهز',
    'مكتب حديث مع غرف اجتماعات ومساحة عمل',
    'commercial', 'rent', 8000, 120,
    test_location, 'طريق الملك فهد',
    'برج الأعمال', 'الطابق 5', 'yes',
    ARRAY['أثاث مكتبي', 'إنترنت عالي السرعة', 'قاعة اجتماعات', 'مصعد'],
    ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c'],
    true,
    public.generate_property_code(0, NOW())
  );

  -- معرض تجاري
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    location, address,
    building, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'معرض تجاري واسع',
    'معرض بواجهة زجاجية وإضاءة احترافية',
    'commercial', 'rent', 12000, 200,
    test_location, 'طريق الخرج',
    'مجمع المعارض', 'الأرضي', 'no',
    ARRAY['واجهة زجاجية', 'إضاءة LED', 'موقف واسع'],
    ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571'],
    true,
    public.generate_property_code(0, NOW())
  );

  -- مستودع
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    location, address, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'مستودع كبير للإيجار',
    'مستودع واسع مع منصة تحميل ونظام أمني',
    'commercial', 'rent', 15000, 500,
    test_location, 'المنطقة الصناعية الثانية', 'no',
    ARRAY['منصة تحميل', 'أمن وحراسة', 'إضاءة كاملة', 'ارتفاع 6 متر'],
    ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'],
    true,
    public.generate_property_code(0, NOW())
  );

  -- مطعم جاهز
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    location, address,
    building, floor, furnished,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'مطعم جاهز بمعدات كاملة',
    'مطعم مجهز بمطبخ صناعي وديكور حديث',
    'commercial', 'rent', 18000, 180,
    test_location, 'شارع التخصصي',
    'مجمع المطاعم', 'الأرضي', 'yes',
    ARRAY['مطبخ صناعي', 'ديكور جاهز', 'موقف سيارات', 'رخصة سارية'],
    ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'],
    true,
    public.generate_property_code(0, NOW())
  );

  -- ============================================================================
  -- عقارات للبيع بأسعار متنوعة
  -- ============================================================================

  -- شقة صغيرة اقتصادية
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    building, apartment, floor,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'شقة اقتصادية غرفة واحدة',
    'شقة مناسبة للعزاب أو المبتدئين',
    'apartment', 'sale', 250000, 80,
    1, 1, test_location, 'حي النسيم',
    'عمارة 12', 'شقة 3', 'الأول',
    ARRAY['مطبخ', 'حمام', 'تكييف'],
    ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'],
    true,
    public.generate_property_code(1, NOW())
  );

  -- شقة متوسطة
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    building, apartment, floor,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'شقة عائلية 4 غرف',
    'شقة واسعة مناسبة للعائلات الكبيرة',
    'apartment', 'sale', 550000, 180,
    4, 2, test_location, 'حي الملقا',
    'عمارة الفردوس', 'شقة 8', 'الثالث',
    ARRAY['صالة كبيرة', 'مطبخ واسع', 'شرفة', 'مصعد'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'],
    true,
    public.generate_property_code(4, NOW())
  );

  -- منزل متوسط
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'منزل 4 غرف مع حديقة صغيرة',
    'منزل عائلي في حي هادئ',
    'house', 'sale', 700000, 250,
    4, 2, test_location, 'حي اليرموك',
    ARRAY['حديقة أمامية', 'موقف مظلل', 'مجلس', 'ملحق خارجي'],
    ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'],
    true,
    public.generate_property_code(4, NOW())
  );

  -- فيلا صغيرة
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'فيلا صغيرة 3 غرف',
    'فيلا مريحة في مجمع سكني آمن',
    'house', 'sale', 1200000, 350,
    3, 3, test_location, 'مجمع الياسمين',
    ARRAY['حديقة خلفية', 'موقف مزدوج', 'غرفة خادمة'],
    ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c'],
    true,
    public.generate_property_code(3, NOW())
  );

  -- فيلا كبيرة فاخرة
  INSERT INTO public.properties (
    user_id, title, description, property_type, listing_type, price, area,
    bedrooms, bathrooms, location, address,
    amenities, images, is_published, property_code
  ) VALUES (
    test_user_id,
    'فيلا فخمة 7 غرف مع مسبح ومصعد',
    'فيلا راقية جداً في أرقى الأحياء',
    'house', 'sale', 4500000, 800,
    7, 6, test_location, 'حي الملك فهد',
    ARRAY['مسبح أولمبي', 'مصعد', 'صالة سينما', 'صالة رياضية', 'حديقة واسعة'],
    ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'],
    true,
    public.generate_property_code(7, NOW())
  );

  RAISE NOTICE '✅ تم إضافة 15 عقار اختباري بنجاح!';
  RAISE NOTICE 'الأنواع: شقق، منازل، فلل، عقارات تجارية';

END $$;

-- التحقق من البيانات
SELECT 
  property_type,
  listing_type,
  COUNT(*) as count,
  ROUND(AVG(price)) as avg_price,
  ROUND(AVG(area)) as avg_area
FROM public.properties
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY property_type, listing_type
ORDER BY property_type, listing_type;

-- عرض آخر العقارات المضافة
SELECT 
  property_type,
  listing_type,
  title,
  price,
  area,
  bedrooms
FROM public.properties
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
