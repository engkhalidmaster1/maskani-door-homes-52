-- حل مشكلة عدم ظهور المكاتب العقارية
-- يتم تشغيل هذا في Supabase SQL Editor

-- 1. إزالة السياسة الحالية
DROP POLICY IF EXISTS "Users can view verified offices or their own" ON real_estate_offices;

-- 2. إنشاء سياسة جديدة تعرض جميع المكاتب النشطة
CREATE POLICY "Users can view active offices or their own" ON real_estate_offices
    FOR SELECT USING (
        status = 'active' 
        OR status = 'pending' 
        OR user_id = auth.uid()
    );

-- 3. تحديث المكاتب الموجودة لتصبح نشطة
UPDATE real_estate_offices 
SET status = 'active' 
WHERE status = 'pending' AND verified = FALSE;

-- 4. عرض المكاتب الحالية للتحقق
SELECT id, name, status, verified, created_at 
FROM real_estate_offices 
ORDER BY created_at DESC;