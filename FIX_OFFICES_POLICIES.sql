-- ==================================================
-- إصلاح سياسات المكاتب العقارية فقط
-- نفذ هذا الكود في Supabase SQL Editor
-- ==================================================

-- 1. حذف جميع السياسات القديمة للمكاتب العقارية
-- ==================================================
DROP POLICY IF EXISTS "view_active_offices" ON real_estate_offices;
DROP POLICY IF EXISTS "View offices based on role" ON real_estate_offices;
DROP POLICY IF EXISTS "update_own_office" ON real_estate_offices;
DROP POLICY IF EXISTS "Update offices policy" ON real_estate_offices;
DROP POLICY IF EXISTS "insert_own_office" ON real_estate_offices;
DROP POLICY IF EXISTS "Users can view active offices or their own" ON real_estate_offices;
DROP POLICY IF EXISTS "Users can insert their own office" ON real_estate_offices;
DROP POLICY IF EXISTS "Users can update their own office" ON real_estate_offices;
DROP POLICY IF EXISTS "Anyone can view active offices" ON real_estate_offices;
DROP POLICY IF EXISTS "Users can view verified offices or their own" ON real_estate_offices;

-- 2. إنشاء سياسات جديدة محسّنة
-- ==================================================

-- سياسة العرض: الجميع يرى المكاتب النشطة، المالكون يرون مكاتبهم، المديرون يرون كل شيء
CREATE POLICY "view_offices_policy" ON real_estate_offices
    FOR SELECT USING (
        status = 'active' 
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.active = TRUE
        )
    );

-- سياسة الإدراج: المستخدمون المسجلون يمكنهم إضافة مكاتبهم
CREATE POLICY "insert_own_office_policy" ON real_estate_offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- سياسة التحديث: المالكون والمديرون فقط
CREATE POLICY "update_offices_policy" ON real_estate_offices
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.active = TRUE
        )
    );

-- سياسة الحذف: المالكون والمديرون فقط
CREATE POLICY "delete_offices_policy" ON real_estate_offices
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.active = TRUE
        )
    );

-- 3. التأكد من تفعيل RLS
-- ==================================================
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- 4. إضافتك كمدير إذا لم تكن مضافاً
-- ==================================================
INSERT INTO admin_users (user_id, role, created_by)
SELECT id, 'super_admin', id 
FROM auth.users 
WHERE email = 'eng.khalid.work@gmail.com'
AND id NOT IN (SELECT user_id FROM admin_users)
LIMIT 1;

-- ==================================================
-- ✅ تم! الآن أعد تحميل صفحة المكاتب
-- ==================================================
