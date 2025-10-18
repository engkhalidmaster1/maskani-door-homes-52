-- ========================================
-- 🔍 فحص سريع: هل نُفذ Migration؟
-- Quick Check: Is Migration Applied?
-- ========================================

-- نفذ هذا الملف قبل تشغيل TEST_UNIFIED_PERMISSIONS.sql

-- ========================================
-- 1️⃣ فحص وجود الجدول الجديد
-- ========================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_permissions'
    ) 
    THEN '✅ الجدول موجود - Migration نُفذ بنجاح!'
    ELSE '❌ الجدول غير موجود - يجب تنفيذ Migration أولاً'
  END as migration_status;

-- ========================================
-- 2️⃣ فحص النوع المخصص
-- ========================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_type 
      WHERE typname = 'user_role_type'
    )
    THEN '✅ النوع user_role_type موجود'
    ELSE '❌ النوع user_role_type غير موجود'
  END as type_status;

-- ========================================
-- 3️⃣ فحص الدوال
-- ========================================

SELECT 
  COUNT(*) as functions_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ جميع الدوال موجودة (6)'
    ELSE '❌ بعض الدوال مفقودة - المتوقع: 6، الموجود: ' || COUNT(*)
  END as functions_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_role',
    'is_admin',
    'get_user_limits',
    'can_add_property',
    'update_user_role',
    'toggle_user_ban'
  );

-- ========================================
-- 4️⃣ فحص View
-- ========================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name = 'users_with_permissions'
    )
    THEN '✅ View موجود'
    ELSE '❌ View غير موجود'
  END as view_status;

-- ========================================
-- 5️⃣ تقرير شامل
-- ========================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_type_exists BOOLEAN;
  v_functions_count INTEGER;
  v_view_exists BOOLEAN;
  v_data_migrated BOOLEAN;
BEGIN
  -- فحص الجدول
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_permissions'
  ) INTO v_table_exists;
  
  -- فحص النوع
  SELECT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'user_role_type'
  ) INTO v_type_exists;
  
  -- فحص الدوال
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'get_user_role',
      'is_admin',
      'get_user_limits',
      'can_add_property',
      'update_user_role',
      'toggle_user_ban'
    );
  
  -- فحص View
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'users_with_permissions'
  ) INTO v_view_exists;
  
  -- فحص نقل البيانات
  IF v_table_exists THEN
    EXECUTE 'SELECT COUNT(*) > 0 FROM user_permissions' INTO v_data_migrated;
  ELSE
    v_data_migrated := FALSE;
  END IF;
  
  -- طباعة التقرير
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 تقرير حالة Migration';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ الجدول user_permissions: موجود';
  ELSE
    RAISE NOTICE '❌ الجدول user_permissions: غير موجود';
  END IF;
  
  IF v_type_exists THEN
    RAISE NOTICE '✅ النوع user_role_type: موجود';
  ELSE
    RAISE NOTICE '❌ النوع user_role_type: غير موجود';
  END IF;
  
  IF v_functions_count = 6 THEN
    RAISE NOTICE '✅ الدوال: موجودة (6/6)';
  ELSE
    RAISE NOTICE '❌ الدوال: ناقصة (% /6)', v_functions_count;
  END IF;
  
  IF v_view_exists THEN
    RAISE NOTICE '✅ View users_with_permissions: موجود';
  ELSE
    RAISE NOTICE '❌ View users_with_permissions: غير موجود';
  END IF;
  
  IF v_data_migrated THEN
    RAISE NOTICE '✅ نقل البيانات: تم';
  ELSE
    RAISE NOTICE '⚠️  نقل البيانات: لم يتم (أو لا يوجد بيانات)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  -- النتيجة النهائية
  IF v_table_exists AND v_type_exists AND v_functions_count = 6 AND v_view_exists THEN
    RAISE NOTICE '🎉 Migration نُفذ بنجاح!';
    RAISE NOTICE '✅ يمكنك الآن تشغيل TEST_UNIFIED_PERMISSIONS.sql';
    RAISE NOTICE '✅ يمكنك تنفيذ MAKE_ADMIN_UNIFIED.sql';
  ELSE
    RAISE NOTICE '❌ Migration لم يُنفذ بعد!';
    RAISE NOTICE '📝 الخطوات المطلوبة:';
    RAISE NOTICE '   1. افتح supabase/migrations/20251017000000_unified_permissions_system.sql';
    RAISE NOTICE '   2. انسخ كامل المحتوى';
    RAISE NOTICE '   3. نفذه في Supabase SQL Editor';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- النهاية
-- ========================================
