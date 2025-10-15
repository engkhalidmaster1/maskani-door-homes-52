-- تحديث حالة الصفقات للعقارات
-- نسخ والصق في Supabase SQL Editor

-- ========================================
-- الطريقة 1: تحديث أول 3 عقارات للاختبار
-- ========================================

-- تحديث أول عقار كمباع
UPDATE properties 
SET status = 'sold' 
WHERE id = (
  SELECT id FROM properties 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- تحديث ثاني عقار كمؤجر
UPDATE properties 
SET status = 'rented' 
WHERE id = (
  SELECT id FROM properties 
  ORDER BY created_at DESC 
  LIMIT 1 OFFSET 1
);

-- تحقق من النتائج
SELECT id, title, status, created_at 
FROM properties 
WHERE status IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 5;

-- ========================================
-- الطريقة 2: تحديث عقارات في المفضلة
-- ========================================

-- تحديث أول عقار في المفضلة كمباع
UPDATE properties 
SET status = 'sold' 
WHERE id IN (
  SELECT property_id FROM favorites 
  LIMIT 1
);

-- تحديث ثاني عقار في المفضلة كمؤجر
UPDATE properties 
SET status = 'rented' 
WHERE id IN (
  SELECT property_id FROM favorites 
  LIMIT 1 OFFSET 1
);

-- ========================================
-- الطريقة 3: تحديث عقار محدد (استبدل ID)
-- ========================================

-- استبدل 'YOUR_PROPERTY_ID' برقم العقار الحقيقي
-- UPDATE properties SET status = 'sold' WHERE id = 'YOUR_PROPERTY_ID';
-- UPDATE properties SET status = 'rented' WHERE id = 'YOUR_PROPERTY_ID';

-- ========================================
-- إعادة تعيين الكل كمتاح
-- ========================================

-- احذف -- من السطر التالي لتفعيل الأمر
-- UPDATE properties SET status = 'available';