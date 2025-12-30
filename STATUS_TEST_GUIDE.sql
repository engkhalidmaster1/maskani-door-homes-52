-- خطوات اختبار نظام حالة الصفقات
-- نسخ والصق هذه الأوامر في Supabase SQL Editor

-- 1. أولاً: عرض أول 5 عقارات للحصول على الأرقام الحقيقية
SELECT id, title, type, listing_type, status 
FROM properties 
ORDER BY id 
LIMIT 5;

-- 2. بعد رؤية الأرقام، استخدم الأوامر التالية (غيّر الأرقام حسب النتائج من الخطوة 1):

-- تحديث عقار رقم 1 كمباع (غيّر الرقم 1 برقم حقيقي من النتائج أعلاه)
-- UPDATE properties SET status = 'sold' WHERE id = 1;

-- تحديث عقار رقم 2 كمؤجر (غيّر الرقم 2 برقم حقيقي من النتائج أعلاه)  
-- UPDATE properties SET status = 'rented' WHERE id = 2;

-- تحديث عقار رقم 3 كقيد التفاوض (غيّر الرقم 3 برقم حقيقي من النتائج أعلاه)
-- UPDATE properties SET status = 'under_negotiation' WHERE id = 3;

-- 3. أخيراً: تحقق من النتائج
-- SELECT id, title, type, listing_type, status FROM properties WHERE status IS NOT NULL AND status != 'available';