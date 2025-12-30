-- =====================================================
-- إصلاح صلاحيات RLS للمديرين على جدول properties
-- Fix RLS Policies for Admins on properties table
-- =====================================================

-- التحقق من الصلاحيات الحالية
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'properties';

-- =====================================================
-- حذف السياسات القديمة إن وجدت
-- Drop old policies if they exist
-- =====================================================

DROP POLICY IF EXISTS "admin_all_properties" ON properties;
DROP POLICY IF EXISTS "admin_full_control_properties" ON properties;
DROP POLICY IF EXISTS "users_insert_own_properties" ON properties;
DROP POLICY IF EXISTS "users_update_own_properties" ON properties;
DROP POLICY IF EXISTS "users_delete_own_properties" ON properties;

-- =====================================================
-- سياسة القراءة - الجميع يمكنهم قراءة العقارات المنشورة
-- Read policy - Everyone can read published properties
-- =====================================================

CREATE POLICY "public_read_published_properties"
ON properties
FOR SELECT
USING (
  is_published = true
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- سياسة الإضافة - المستخدمون يمكنهم إضافة عقاراتهم
-- Insert policy - Users can insert their own properties
-- =====================================================

CREATE POLICY "users_insert_properties"
ON properties
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- سياسة التحديث - المستخدمون يمكنهم تحديث عقاراتهم + المديرون كل العقارات
-- Update policy - Users can update their properties + Admins can update all
-- =====================================================

CREATE POLICY "users_and_admins_update_properties"
ON properties
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- سياسة الحذف - المستخدمون يمكنهم حذف عقاراتهم + المديرون كل العقارات
-- Delete policy - Users can delete their properties + Admins can delete all
-- =====================================================

CREATE POLICY "users_and_admins_delete_properties"
ON properties
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- =====================================================
-- التحقق من تطبيق السياسات
-- Verify policies applied
-- =====================================================

SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- =====================================================
-- اختبار الصلاحيات
-- Test the permissions
-- =====================================================

-- اختبر كمدير: حاول تحديث عقار لمستخدم آخر
-- Test as admin: Try to update another user's property
-- 
-- UPDATE properties 
-- SET is_published = false 
-- WHERE user_id = 'any-user-id';
-- 
-- يجب أن يعمل بنجاح إذا كنت مدير

-- =====================================================
-- ملاحظات هامة
-- Important Notes
-- =====================================================

/*
1. المدير الآن يمكنه:
   - قراءة جميع العقارات (منشورة أو غير منشورة)
   - تحديث جميع العقارات (بما في ذلك is_published)
   - حذف جميع العقارات
   - إضافة عقارات نيابة عن أي مستخدم

2. المستخدم العادي يمكنه:
   - قراءة العقارات المنشورة فقط + عقاراته الخاصة
   - إضافة عقاراته الخاصة فقط
   - تحديث عقاراته الخاصة فقط
   - حذف عقاراته الخاصة فقط

3. الزوار (غير مسجلي الدخول):
   - قراءة العقارات المنشورة فقط
   - لا يمكنهم الإضافة أو التحديث أو الحذف
*/

-- =====================================================
-- التحقق من أن RLS مفعل
-- Verify RLS is enabled
-- =====================================================

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'properties';

-- إذا كانت rowsecurity = false، قم بتفعيلها:
-- If rowsecurity = false, enable it:
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- تأكيد النجاح
-- Success Confirmation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم تطبيق سياسات RLS بنجاح على جدول properties';
  RAISE NOTICE '✅ RLS policies successfully applied to properties table';
  RAISE NOTICE '';
  RAISE NOTICE 'الآن المديرون يمكنهم:';
  RAISE NOTICE 'Admins can now:';
  RAISE NOTICE '  - حظر المستخدمين من النشر (تحديث is_published)';
  RAISE NOTICE '  - Ban users from publishing (update is_published)';
  RAISE NOTICE '  - حذف عقارات المستخدمين';
  RAISE NOTICE '  - Delete users properties';
  RAISE NOTICE '  - تحديث جميع بيانات العقارات';
  RAISE NOTICE '  - Update all property data';
END $$;
