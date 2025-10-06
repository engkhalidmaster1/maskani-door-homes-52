-- ==================================================
-- الحل النهائي الشامل لمشكلة المكاتب العقارية
-- نفذ هذا الكود بالكامل في Supabase SQL Editor
-- ==================================================

-- ========================================
-- الجزء 1: تعطيل RLS مؤقتاً للتنظيف
-- ========================================
ALTER TABLE real_estate_offices DISABLE ROW LEVEL SECURITY;

-- ========================================
-- الجزء 2: حذف جميع السياسات القديمة يدوياً
-- ========================================
DROP POLICY IF EXISTS "view_active_offices" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "View offices based on role" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "update_own_office" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Update offices policy" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "insert_own_office" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "insert_own_office_policy" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Users can view active offices or their own" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Users can insert their own office" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Users can update their own office" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Anyone can view active offices" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "Users can view verified offices or their own" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "view_offices_policy" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "update_offices_policy" ON real_estate_offices CASCADE;
DROP POLICY IF EXISTS "delete_offices_policy" ON real_estate_offices CASCADE;

-- ========================================
-- الجزء 3: إنشاء سياسات بسيطة وواضحة
-- ========================================

-- سياسة 1: السماح بعرض جميع المكاتب (مؤقتاً للاختبار)
CREATE POLICY "public_read_all" ON real_estate_offices
    FOR SELECT 
    USING (true);

-- سياسة 2: السماح للمستخدمين المسجلين بإضافة مكاتب
CREATE POLICY "authenticated_insert" ON real_estate_offices
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- سياسة 3: السماح بتحديث المكتب لمالكه فقط
CREATE POLICY "owner_update" ON real_estate_offices
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- سياسة 4: السماح بحذف المكتب لمالكه فقط
CREATE POLICY "owner_delete" ON real_estate_offices
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ========================================
-- الجزء 4: إعادة تفعيل RLS
-- ========================================
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- ========================================
-- الجزء 5: التحقق من وجود بيانات وإضافة بيانات تجريبية
-- ========================================

-- التحقق من عدد المكاتب الموجودة
DO $$
DECLARE
    office_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO office_count FROM real_estate_offices;
    
    -- إذا لم توجد مكاتب، أضف مكتب تجريبي
    IF office_count = 0 THEN
        INSERT INTO real_estate_offices (
            name, 
            license_number, 
            description, 
            phone, 
            address, 
            status,
            verified
        ) VALUES (
            'مكتب العقارات التجريبي',
            'TEST-001',
            'مكتب عقاري تجريبي للاختبار',
            '0501234567',
            'الرياض، المملكة العربية السعودية',
            'active',
            true
        );
        
        RAISE NOTICE 'تم إضافة مكتب تجريبي';
    ELSE
        RAISE NOTICE 'يوجد % مكتب في قاعدة البيانات', office_count;
    END IF;
END $$;

-- ========================================
-- الجزء 6: عرض معلومات التشخيص
-- ========================================

-- عرض عدد المكاتب حسب الحالة
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE verified = true) as verified_count
FROM real_estate_offices
GROUP BY status;

-- عرض السياسات الحالية
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'real_estate_offices'
ORDER BY policyname;

-- ==================================================
-- ✅ انتهى! الآن جرب الصفحة
-- ==================================================

-- للتحقق من نجاح العملية:
-- 1. يجب أن ترى 4 سياسات جديدة في الجدول أعلاه
-- 2. يجب أن ترى على الأقل مكتب واحد في قاعدة البيانات
-- 3. أعد تحميل صفحة المكاتب العقارية
