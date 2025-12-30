-- ==================================================
-- حل مبسط - إصلاح سياسات المكاتب العقارية
-- ==================================================

-- الخطوة 1: تعطيل RLS مؤقتاً لحذف السياسات
ALTER TABLE real_estate_offices DISABLE ROW LEVEL SECURITY;

-- الخطوة 2: حذف جميع السياسات
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'real_estate_offices') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON real_estate_offices';
    END LOOP;
END $$;

-- الخطوة 3: إعادة تفعيل RLS
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- الخطوة 4: إنشاء سياسة واحدة بسيطة للعرض
CREATE POLICY "allow_all_select" ON real_estate_offices
    FOR SELECT USING (true);

-- الخطوة 5: سياسة الإدراج
CREATE POLICY "allow_authenticated_insert" ON real_estate_offices
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- الخطوة 6: سياسة التحديث
CREATE POLICY "allow_own_update" ON real_estate_offices
    FOR UPDATE USING (user_id = auth.uid());

-- الخطوة 7: سياسة الحذف
CREATE POLICY "allow_own_delete" ON real_estate_offices
    FOR DELETE USING (user_id = auth.uid());

-- ==================================================
-- ✅ تم! الآن جرب صفحة المكاتب
-- ==================================================
