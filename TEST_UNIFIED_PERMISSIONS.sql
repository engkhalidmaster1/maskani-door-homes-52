-- ========================================
-- اختبارات شاملة للنظام الموحد
-- Comprehensive Tests for Unified Permissions
-- ========================================

-- ========================================
-- 1️⃣ فحص البنية الأساسية
-- ========================================

-- 1.1 التحقق من وجود الجدول
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_permissions'
) as table_exists;

-- 1.2 التحقق من الأعمدة
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_permissions'
ORDER BY ordinal_position;

-- 1.3 التحقق من النوع المخصص
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'user_role_type'
ORDER BY enumsortorder;
-- يجب أن يعرض: admin, office, agent, publisher

-- ========================================
-- 2️⃣ فحص الدوال
-- ========================================

-- 2.1 قائمة جميع الدوال
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_role',
    'is_admin',
    'get_user_limits',
    'can_add_property',
    'update_user_role',
    'toggle_user_ban'
  )
ORDER BY proname;

-- 2.2 اختبار get_user_role
-- SELECT get_user_role(); -- يتطلب مستخدم مسجل

-- 2.3 اختبار is_admin
-- SELECT is_admin(); -- يتطلب مستخدم مسجل

-- ========================================
-- 3️⃣ فحص View
-- ========================================

-- 3.1 التحقق من وجود View
SELECT EXISTS (
  SELECT 1 FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'users_with_permissions'
) as view_exists;

-- 3.2 أعمدة View
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_with_permissions'
ORDER BY ordinal_position;

-- 3.3 عينة من View
SELECT 
  email,
  role,
  role_name_ar,
  properties_limit,
  images_limit,
  properties_count,
  status_indicator
FROM users_with_permissions
LIMIT 5;

-- ========================================
-- 4️⃣ فحص RLS Policies
-- ========================================

-- 4.1 عرض جميع Policies على user_permissions
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_permissions'
ORDER BY policyname;

-- ========================================
-- 5️⃣ فحص Triggers
-- ========================================

-- 5.1 Triggers على user_permissions
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'user_permissions'
ORDER BY trigger_name;

-- 5.2 Triggers على auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name LIKE '%permission%'
ORDER BY trigger_name;

-- 5.3 Triggers على properties
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'properties'
  AND trigger_name LIKE '%stat%'
ORDER BY trigger_name;

-- ========================================
-- 6️⃣ إحصائيات النظام
-- ========================================

-- 6.1 إجمالي المستخدمين
SELECT COUNT(*) as total_users
FROM user_permissions;

-- 6.2 توزيع الأدوار
SELECT 
  role,
  role_name_ar,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_permissions), 2) as percentage
FROM users_with_permissions
GROUP BY role, role_name_ar
ORDER BY count DESC;

-- 6.3 المستخدمون النشطون
SELECT 
  role_name_ar,
  COUNT(*) as total,
  COUNT(CASE WHEN can_publish THEN 1 END) as active,
  COUNT(CASE WHEN is_verified THEN 1 END) as verified,
  COUNT(CASE WHEN NOT can_publish THEN 1 END) as banned
FROM users_with_permissions
GROUP BY role, role_name_ar
ORDER BY role;

-- 6.4 استخدام الحدود
SELECT 
  role_name_ar,
  AVG(properties_count) as avg_properties,
  MAX(properties_count) as max_properties,
  AVG(CASE 
    WHEN properties_limit > 0 
    THEN (properties_count::NUMERIC / properties_limit) * 100 
    ELSE 0 
  END) as avg_usage_percent
FROM users_with_permissions
WHERE role NOT IN ('admin', 'office')
GROUP BY role, role_name_ar;

-- ========================================
-- 7️⃣ فحص النقل من النظام القديم
-- ========================================

-- 7.1 مقارنة العدد
SELECT 
  'user_roles' as source,
  COUNT(*) as count
FROM user_roles
UNION ALL
SELECT 
  'user_statuses' as source,
  COUNT(*) as count
FROM user_statuses
UNION ALL
SELECT 
  'user_permissions (NEW)' as source,
  COUNT(*) as count
FROM user_permissions;

-- 7.2 المستخدمون المفقودون
SELECT 
  au.id,
  au.email,
  'Missing in user_permissions' as issue
FROM auth.users au
LEFT JOIN user_permissions up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- 7.3 التحقق من تطابق الأدوار
SELECT 
  au.email,
  ur.role as old_role,
  us.status as old_status,
  up.role as new_role,
  CASE 
    WHEN ur.role = 'admin' AND up.role = 'admin' THEN '✅'
    WHEN us.status = 'office_agent' AND up.role = 'office' THEN '✅'
    WHEN us.status = 'trusted_owner' AND up.role = 'agent' THEN '✅'
    WHEN up.role = 'publisher' THEN '✅'
    ELSE '❌'
  END as migration_status
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_statuses us ON au.id = us.user_id
LEFT JOIN user_permissions up ON au.id = up.user_id
WHERE up.user_id IS NOT NULL
LIMIT 20;

-- ========================================
-- 8️⃣ اختبارات الأداء
-- ========================================

-- 8.1 سرعة الاستعلام - الطريقة القديمة
EXPLAIN ANALYZE
SELECT 
  au.email,
  ur.role,
  us.status,
  us.properties_limit
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_statuses us ON au.id = us.user_id
LIMIT 100;

-- 8.2 سرعة الاستعلام - الطريقة الجديدة
EXPLAIN ANALYZE
SELECT 
  email,
  role,
  properties_limit,
  images_limit
FROM users_with_permissions
LIMIT 100;

-- 8.3 فحص الفهارس
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_permissions'
ORDER BY indexname;

-- ========================================
-- 9️⃣ اختبارات وظيفية
-- ========================================

-- 9.1 اختبار الحدود لكل دور
SELECT 
  role,
  role_name_ar,
  jsonb_pretty(limits) as limits_json,
  (limits->>'properties')::INTEGER as properties,
  (limits->>'images_per_property')::INTEGER as images,
  (limits->>'featured_properties')::INTEGER as featured,
  (limits->>'storage_mb')::INTEGER as storage
FROM users_with_permissions
GROUP BY role, role_name_ar, limits
ORDER BY role;

-- 9.2 المستخدمون المحظورون
SELECT 
  email,
  full_name,
  role_name_ar,
  properties_count,
  can_publish,
  is_active,
  updated_at
FROM users_with_permissions
WHERE NOT can_publish
ORDER BY updated_at DESC;

-- 9.3 المستخدمون القريبون من الحد
SELECT 
  email,
  full_name,
  role_name_ar,
  properties_count,
  properties_limit,
  ROUND((properties_count::NUMERIC / NULLIF(properties_limit, 0)) * 100, 1) as usage_pct,
  status_indicator
FROM users_with_permissions
WHERE role NOT IN ('admin', 'office')
  AND properties_limit > 0
  AND properties_count >= properties_limit * 0.8
ORDER BY usage_pct DESC;

-- 9.4 المستخدمون الموثوقون
SELECT 
  email,
  full_name,
  role_name_ar,
  is_verified,
  verified_at,
  (SELECT email FROM auth.users WHERE id = up.verified_by) as verified_by_email
FROM users_with_permissions up
WHERE is_verified = true
ORDER BY verified_at DESC;

-- ========================================
-- 🔟 اختبارات التكامل
-- ========================================

-- 10.1 العقارات والصلاحيات
SELECT 
  up.email,
  up.role_name_ar,
  up.properties_limit,
  up.properties_count,
  COUNT(p.id) as actual_properties,
  CASE 
    WHEN up.properties_count = COUNT(p.id) THEN '✅ متطابق'
    ELSE '❌ غير متطابق'
  END as stats_accuracy
FROM users_with_permissions up
LEFT JOIN properties p ON up.id = p.user_id AND p.is_published = true
GROUP BY up.id, up.email, up.role_name_ar, up.properties_limit, up.properties_count
HAVING up.properties_count != COUNT(p.id)
LIMIT 10;

-- 10.2 الصور والصلاحيات
SELECT 
  up.email,
  up.role_name_ar,
  up.images_limit,
  p.title,
  array_length(p.images, 1) as image_count,
  CASE 
    WHEN array_length(p.images, 1) <= up.images_limit THEN '✅'
    ELSE '⚠️ تجاوز الحد'
  END as within_limit
FROM users_with_permissions up
JOIN properties p ON up.id = p.user_id
WHERE array_length(p.images, 1) > 0
ORDER BY array_length(p.images, 1) DESC
LIMIT 20;

-- ========================================
-- 1️⃣1️⃣ تقرير شامل
-- ========================================

-- تقرير النظام الكامل
SELECT 
  '=== نظام الصلاحيات الموحد ===' as report_section,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  '📊 الإحصائيات الأساسية',
  'إجمالي المستخدمين',
  COUNT(*)::TEXT
FROM user_permissions
UNION ALL
SELECT 
  '',
  '🔑 المدراء',
  COUNT(*)::TEXT
FROM user_permissions WHERE role = 'admin'
UNION ALL
SELECT 
  '',
  '🏢 المكاتب',
  COUNT(*)::TEXT
FROM user_permissions WHERE role = 'office'
UNION ALL
SELECT 
  '',
  '🏆 الوكلاء',
  COUNT(*)::TEXT
FROM user_permissions WHERE role = 'agent'
UNION ALL
SELECT 
  '',
  '👤 الناشرون',
  COUNT(*)::TEXT
FROM user_permissions WHERE role = 'publisher'
UNION ALL
SELECT 
  '📝 الحالة',
  '✅ نشطون',
  COUNT(*)::TEXT
FROM user_permissions WHERE can_publish = true
UNION ALL
SELECT 
  '',
  '🚫 محظورون',
  COUNT(*)::TEXT
FROM user_permissions WHERE can_publish = false
UNION ALL
SELECT 
  '',
  '⭐ موثوقون',
  COUNT(*)::TEXT
FROM user_permissions WHERE is_verified = true
UNION ALL
SELECT 
  '🏠 العقارات',
  'إجمالي العقارات',
  SUM(properties_count)::TEXT
FROM user_permissions
UNION ALL
SELECT 
  '',
  'متوسط العقارات/مستخدم',
  ROUND(AVG(properties_count), 2)::TEXT
FROM user_permissions
UNION ALL
SELECT 
  '🖼️ الصور',
  'إجمالي الصور',
  SUM(images_count)::TEXT
FROM user_permissions
UNION ALL
SELECT 
  '',
  'متوسط الصور/مستخدم',
  ROUND(AVG(images_count), 2)::TEXT
FROM user_permissions;

-- ========================================
-- 1️⃣2️⃣ اختبارات الأمان
-- ========================================

-- 12.1 التحقق من RLS
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN roles = '{authenticated}' THEN '✅ محمي'
    ELSE '⚠️ تحقق من الإعدادات'
  END as security_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_permissions', 'properties')
ORDER BY tablename, policyname;

-- 12.2 الدوال الحساسة
SELECT 
  proname,
  CASE prosecdef
    WHEN true THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ SECURITY INVOKER'
  END as security_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_user_role',
    'toggle_user_ban',
    'is_admin',
    'get_user_role'
  )
ORDER BY proname;

-- ========================================
-- النهاية - جميع الاختبارات
-- ========================================

-- ملاحظات:
-- 1. يمكنك تشغيل كل اختبار على حدة
-- 2. اختبارات المستخدم المسجل معلقة (تحتاج auth.uid())
-- 3. جميع النتائج يجب أن تكون إيجابية (✅)
-- 4. أي ❌ يحتاج فحص وإصلاح

-- ✅ اكتملت جميع الاختبارات!
