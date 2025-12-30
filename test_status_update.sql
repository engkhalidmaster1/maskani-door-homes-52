-- اختبار تحديث status للعقارات - Supabase/PostgreSQL
-- تحديث بعض العقارات لاختبار النظام

-- تحديد عقار واحد كمباع
UPDATE properties 
SET status = 'sold' 
WHERE id IN (SELECT id FROM properties WHERE type = 'للبيع' OR listing_type = 'sale' LIMIT 1);

-- تحديد عقار واحد كمؤجر  
UPDATE properties 
SET status = 'rented'
WHERE id IN (SELECT id FROM properties WHERE type = 'للإيجار' OR listing_type = 'rent' LIMIT 1);

-- تحديد عقار واحد كقيد التفاوض
UPDATE properties 
SET status = 'under_negotiation'
WHERE id IN (SELECT id FROM properties ORDER BY id LIMIT 1 OFFSET 2);

-- عرض حالة العقارات المحدثة
SELECT id, title, type, listing_type, status, created_at 
FROM properties 
WHERE status IS NOT NULL AND status != 'available'
ORDER BY updated_at DESC 
LIMIT 10;