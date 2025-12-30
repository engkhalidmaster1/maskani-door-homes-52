-- اختبار بسيط لتحديث status
-- يمكن تشغيل هذه الأوامر في Supabase SQL Editor

-- 1. عرض العقارات الحالية
SELECT id, title, type, status FROM properties LIMIT 5;

-- 2. تحديث عقار واحد للاختبار (غيّر الرقم 1 برقم عقار موجود)
-- UPDATE properties SET status = 'sold' WHERE id = 1;

-- 3. تحديث عقار آخر للاختبار  
-- UPDATE properties SET status = 'rented' WHERE id = 2;

-- 4. عرض النتائج
-- SELECT id, title, type, status FROM properties WHERE status IS NOT NULL;