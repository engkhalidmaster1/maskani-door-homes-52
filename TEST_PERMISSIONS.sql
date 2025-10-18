-- ========================================
-- فحص شامل لنظام الصلاحيات في Maskani
-- ========================================
-- يمكنك تشغيل هذه الاستعلامات في Supabase SQL Editor

-- ========================================
-- 1️⃣ فحص جدول user_roles
-- ========================================

-- عرض جميع الأدوار المتاحة في النظام
SELECT 
  unnest(enum_range(NULL::app_role)) as available_roles;
-- النتيجة المتوقعة: admin, user

-- عرض جميع المستخدمين وأدوارهم
SELECT 
  ur.id,
  au.email,
  ur.role,
  ur.created_at,
  CASE 
    WHEN ur.role = 'admin' THEN '🔑 مدير - صلاحيات كاملة'
    WHEN ur.role = 'user' THEN '👤 مستخدم عادي'
    ELSE '⚠️ دور غير معروف'
  END as role_description,
  au.last_sign_in_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC;

-- إحصائيات الأدوار
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_roles) as percentage
FROM user_roles
GROUP BY role
ORDER BY total_users DESC;

-- ========================================
-- 2️⃣ فحص جدول user_statuses
-- ========================================

-- عرض جميع الحالات المتاحة
SELECT 
  unnest(enum_range(NULL::user_status)) as available_statuses;
-- النتيجة المتوقعة: publisher, trusted_owner, office_agent

-- عرض جميع المستخدمين وحالاتهم
SELECT 
  us.id,
  au.email,
  us.status,
  us.properties_limit,
  us.images_limit,
  us.can_publish,
  us.is_verified,
  CASE 
    WHEN us.status = 'publisher' THEN '👤 ناشر عادي'
    WHEN us.status = 'trusted_owner' THEN '🏆 مالك موثوق'
    WHEN us.status = 'office_agent' THEN '🏢 وكيل مكتب'
    ELSE '⚠️ حالة غير معروفة'
  END as status_description,
  CASE 
    WHEN us.can_publish = false THEN '🚫 محظور'
    WHEN us.can_publish = true THEN '✅ نشط'
  END as publish_status,
  us.created_at
FROM user_statuses us
JOIN auth.users au ON us.user_id = au.id
ORDER BY us.created_at DESC;

-- إحصائيات الحالات
SELECT 
  status,
  COUNT(*) as total_users,
  AVG(properties_limit)::INTEGER as avg_properties_limit,
  AVG(images_limit)::INTEGER as avg_images_limit,
  COUNT(CASE WHEN can_publish = true THEN 1 END) as active_users,
  COUNT(CASE WHEN can_publish = false THEN 1 END) as banned_users,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users
FROM user_statuses
GROUP BY status
ORDER BY total_users DESC;

-- ========================================
-- 3️⃣ عرض موحد: الأدوار + الحالات
-- ========================================

-- استعلام شامل يجمع كل معلومات المستخدم
SELECT 
  au.id as user_id,
  au.email,
  p.full_name,
  p.phone,
  
  -- من user_roles
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '🔑 مدير'
    ELSE '👤 مستخدم'
  END as role_badge,
  
  -- من user_statuses
  us.status,
  CASE 
    WHEN us.status = 'publisher' THEN '👤'
    WHEN us.status = 'trusted_owner' THEN '🏆'
    WHEN us.status = 'office_agent' THEN '🏢'
  END as status_emoji,
  
  us.properties_limit,
  us.images_limit,
  us.can_publish,
  CASE 
    WHEN us.can_publish = false THEN '🚫 محظور'
    ELSE '✅ نشط'
  END as publish_badge,
  
  us.is_verified,
  
  -- إحصائيات العقارات
  (SELECT COUNT(*) FROM properties WHERE user_id = au.id) as total_properties,
  (SELECT COUNT(*) FROM properties WHERE user_id = au.id AND is_published = true) as published_properties,
  
  au.created_at as account_created,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_statuses us ON au.id = us.user_id
ORDER BY au.created_at DESC
LIMIT 50;

-- ========================================
-- 4️⃣ فحص RLS Policies
-- ========================================

-- عرض جميع Policies على جدول user_roles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- عرض جميع Policies على جدول user_statuses
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_statuses'
ORDER BY policyname;

-- عرض جميع Policies على جدول properties
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- ========================================
-- 5️⃣ فحص الدوال المساعدة
-- ========================================

-- عرض جميع الدوال المتعلقة بالصلاحيات
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('has_role', 'get_current_user_role', 'update_user_status', 'get_user_status')
ORDER BY p.proname;

-- ========================================
-- 6️⃣ اختبار الدوال
-- ========================================

-- اختبار has_role (استبدل USER_ID_HERE بـ UUID حقيقي)
-- SELECT has_role('USER_ID_HERE'::UUID, 'admin'::app_role);

-- اختبار get_current_user_role (يحتاج auth.uid() - تشغيل من التطبيق)
-- SELECT get_current_user_role();

-- اختبار get_user_status (استبدل USER_ID_HERE بـ UUID حقيقي)
-- SELECT * FROM get_user_status('USER_ID_HERE'::UUID);

-- ========================================
-- 7️⃣ فحص المستخدمين المحظورين
-- ========================================

-- جميع المستخدمين المحظورين
SELECT 
  au.email,
  p.full_name,
  us.status,
  us.properties_limit,
  (SELECT COUNT(*) FROM properties WHERE user_id = au.id) as properties_count,
  us.created_at as banned_at
FROM user_statuses us
JOIN auth.users au ON us.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE us.can_publish = false
ORDER BY us.updated_at DESC;

-- ========================================
-- 8️⃣ فحص المدراء
-- ========================================

-- جميع المدراء في النظام
SELECT 
  au.id,
  au.email,
  p.full_name,
  p.phone,
  ur.created_at as admin_since,
  au.last_sign_in_at,
  CASE 
    WHEN au.last_sign_in_at > now() - interval '7 days' THEN '✅ نشط'
    WHEN au.last_sign_in_at > now() - interval '30 days' THEN '⚠️ غير نشط'
    ELSE '❌ غير نشط منذ فترة طويلة'
  END as activity_status
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE ur.role = 'admin'
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- ========================================
-- 9️⃣ فحص المستخدمين الموثوقين
-- ========================================

-- جميع المستخدمين الموثوقين
SELECT 
  au.email,
  p.full_name,
  us.status,
  us.is_verified,
  us.verified_at,
  (SELECT email FROM auth.users WHERE id = us.verified_by) as verified_by_email,
  (SELECT COUNT(*) FROM properties WHERE user_id = au.id AND is_published = true) as properties_count,
  us.properties_limit,
  us.images_limit
FROM user_statuses us
JOIN auth.users au ON us.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE us.is_verified = true
ORDER BY us.verified_at DESC;

-- ========================================
-- 🔟 إحصائيات شاملة
-- ========================================

-- ملخص شامل للنظام
SELECT 
  '👥 إجمالي المستخدمين' as metric,
  COUNT(*)::TEXT as value
FROM auth.users
UNION ALL
SELECT 
  '🔑 المدراء' as metric,
  COUNT(*)::TEXT as value
FROM user_roles
WHERE role = 'admin'
UNION ALL
SELECT 
  '👤 الناشرون العاديون' as metric,
  COUNT(*)::TEXT as value
FROM user_statuses
WHERE status = 'publisher'
UNION ALL
SELECT 
  '🏆 الملاك الموثوقون' as metric,
  COUNT(*)::TEXT as value
FROM user_statuses
WHERE status = 'trusted_owner'
UNION ALL
SELECT 
  '🏢 وكلاء المكاتب' as metric,
  COUNT(*)::TEXT as value
FROM user_statuses
WHERE status = 'office_agent'
UNION ALL
SELECT 
  '🚫 المحظورون' as metric,
  COUNT(*)::TEXT as value
FROM user_statuses
WHERE can_publish = false
UNION ALL
SELECT 
  '✅ الموثوقون' as metric,
  COUNT(*)::TEXT as value
FROM user_statuses
WHERE is_verified = true
UNION ALL
SELECT 
  '🏠 إجمالي العقارات' as metric,
  COUNT(*)::TEXT as value
FROM properties
UNION ALL
SELECT 
  '📝 العقارات المنشورة' as metric,
  COUNT(*)::TEXT as value
FROM properties
WHERE is_published = true;

-- ========================================
-- 1️⃣1️⃣ فحص المستخدمين المتجاوزين للحد
-- ========================================

-- المستخدمون الذين وصلوا أو تجاوزوا حد العقارات
SELECT 
  au.email,
  p.full_name,
  us.status,
  us.properties_limit,
  COUNT(pr.id) as current_properties,
  us.properties_limit - COUNT(pr.id) as remaining,
  CASE 
    WHEN COUNT(pr.id) >= us.properties_limit THEN '🔴 وصل للحد'
    WHEN COUNT(pr.id) >= us.properties_limit * 0.8 THEN '🟡 قريب من الحد'
    ELSE '🟢 ضمن الحد'
  END as status_indicator
FROM user_statuses us
JOIN auth.users au ON us.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN properties pr ON au.id = pr.user_id AND pr.is_published = true
WHERE us.can_publish = true
GROUP BY au.email, p.full_name, us.status, us.properties_limit
HAVING COUNT(pr.id) >= us.properties_limit * 0.8
ORDER BY current_properties DESC;

-- ========================================
-- 1️⃣2️⃣ فحص Triggers
-- ========================================

-- عرض جميع Triggers المتعلقة بالصلاحيات
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('user_roles', 'user_statuses', 'profiles')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 1️⃣3️⃣ اختبار صلاحية مستخدم معين
-- ========================================

-- استبدل YOUR_EMAIL_HERE بالبريد الإلكتروني للمستخدم
/*
SELECT 
  au.email,
  '=== معلومات الحساب ===' as section,
  p.full_name,
  p.phone,
  au.created_at as account_created,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT 
  au.email,
  '=== الدور الإداري ===' as section,
  ur.role::TEXT,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ مدير - صلاحيات كاملة'
    ELSE '👤 مستخدم عادي'
  END,
  ur.created_at::TEXT,
  NULL,
  NULL
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT 
  au.email,
  '=== حالة الحساب ===' as section,
  us.status::TEXT,
  CONCAT('حد العقارات: ', us.properties_limit),
  CONCAT('حد الصور: ', us.images_limit),
  CASE WHEN us.can_publish THEN '✅ يمكنه النشر' ELSE '🚫 محظور' END,
  CASE WHEN us.is_verified THEN '✅ موثوق' ELSE '❌ غير موثوق' END
FROM auth.users au
LEFT JOIN user_statuses us ON au.id = us.user_id
WHERE au.email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT 
  au.email,
  '=== إحصائيات العقارات ===' as section,
  COUNT(pr.id)::TEXT as total_properties,
  COUNT(CASE WHEN pr.is_published THEN 1 END)::TEXT as published,
  us.properties_limit::TEXT as limit_value,
  CONCAT(
    COUNT(pr.id)::TEXT, ' / ', us.properties_limit::TEXT,
    ' (', ROUND(COUNT(pr.id)::NUMERIC / us.properties_limit * 100, 1), '%)'
  ),
  NULL
FROM auth.users au
LEFT JOIN user_statuses us ON au.id = us.user_id
LEFT JOIN properties pr ON au.id = pr.user_id
WHERE au.email = 'YOUR_EMAIL_HERE'
GROUP BY au.email, us.properties_limit;
*/

-- ========================================
-- 1️⃣4️⃣ توصيات الأمان
-- ========================================

-- فحص المدراء الذين لم يسجلوا دخول منذ فترة طويلة
SELECT 
  au.email,
  p.full_name,
  ur.role,
  au.last_sign_in_at,
  CASE 
    WHEN au.last_sign_in_at IS NULL THEN 'لم يسجل دخول أبداً'
    WHEN au.last_sign_in_at < now() - interval '90 days' THEN '⚠️ خطر أمني - مدير غير نشط لأكثر من 90 يوم'
    WHEN au.last_sign_in_at < now() - interval '30 days' THEN '⚠️ تحذير - مدير غير نشط لأكثر من 30 يوم'
    ELSE 'نشط'
  END as security_status
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE ur.role = 'admin'
  AND (au.last_sign_in_at IS NULL OR au.last_sign_in_at < now() - interval '30 days')
ORDER BY au.last_sign_in_at NULLS FIRST;

-- ========================================
-- 1️⃣5️⃣ فحص البيانات المفقودة
-- ========================================

-- المستخدمون بدون دور في user_roles
SELECT 
  au.id,
  au.email,
  au.created_at,
  '⚠️ مستخدم بدون دور محدد' as issue
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;

-- المستخدمون بدون حالة في user_statuses
SELECT 
  au.id,
  au.email,
  au.created_at,
  '⚠️ مستخدم بدون حالة محددة' as issue
FROM auth.users au
LEFT JOIN user_statuses us ON au.id = us.user_id
WHERE us.user_id IS NULL;

-- المستخدمون بدون ملف شخصي
SELECT 
  au.id,
  au.email,
  au.created_at,
  '⚠️ مستخدم بدون ملف شخصي' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- ========================================
-- النهاية
-- ========================================

-- ملاحظات:
-- 1. استبدل YOUR_EMAIL_HERE بالبريد الإلكتروني الفعلي
-- 2. استبدل USER_ID_HERE بـ UUID المستخدم
-- 3. بعض الاستعلامات معلقة (/* */) لأنها تحتاج قيم محددة
-- 4. يمكنك تشغيل أي استعلام بشكل منفصل حسب الحاجة
