-- ========================================
-- تعيين مدير النظام - Unified System
-- Make Admin - New Unified Permissions
-- ========================================

-- ========================================
-- الخطوة 1: التشخيص
-- ========================================

-- 1.1 البحث عن المستخدم
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'eng.khalid.work@gmail.com';

-- 1.2 التحقق من صلاحياته الحالية
SELECT 
  up.user_id,
  up.role,
  up.limits,
  up.can_publish,
  up.is_verified,
  au.email,
  CASE up.role
    WHEN 'admin' THEN '✅ مدير النظام'
    WHEN 'office' THEN '🏢 مكتب عقارات'
    WHEN 'agent' THEN '🏆 وكيل عقاري'
    WHEN 'publisher' THEN '👤 ناشر عادي'
  END as current_role
FROM user_permissions up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';

-- ========================================
-- الخطوة 2: الترقية لمدير النظام
-- ========================================

-- طريقة 1: باستخدام الدالة المخصصة (موصى بها)
DO $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
BEGIN
  -- الحصول على UUID المستخدم
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eng.khalid.work@gmail.com';
  
  -- التحقق من وجود المستخدم
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود! يجب التسجيل أولاً.';
  END IF;
  
  -- تحديث الدور مباشرة (لأول مدير)
  UPDATE user_permissions
  SET 
    role = 'admin',
    limits = '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb,
    can_publish = true,
    is_active = true,
    is_verified = true,
    verified_by = v_user_id,
    verified_at = now(),
    updated_at = now()
  WHERE user_id = v_user_id;
  
  -- إضافة سجل إذا لم يكن موجوداً
  INSERT INTO user_permissions (user_id, role, limits)
  VALUES (
    v_user_id,
    'admin',
    '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    limits = EXCLUDED.limits,
    can_publish = true,
    is_active = true,
    is_verified = true,
    verified_by = v_user_id,
    verified_at = now();
  
  RAISE NOTICE '✅ تم تعيين % كمدير النظام!', 'eng.khalid.work@gmail.com';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '🔑 الصلاحيات: غير محدودة في كل شيء';
END $$;

-- طريقة 2: تحديث مباشر (للحالات الطارئة)
/*
UPDATE user_permissions
SET 
  role = 'admin',
  limits = '{
    "properties": -1,
    "images_per_property": -1,
    "featured_properties": -1,
    "storage_mb": -1
  }'::jsonb,
  can_publish = true,
  is_active = true,
  is_verified = true,
  updated_at = now()
FROM auth.users au
WHERE user_permissions.user_id = au.id
  AND au.email = 'eng.khalid.work@gmail.com';
*/

-- ========================================
-- الخطوة 3: التحقق النهائي
-- ========================================

-- استخدام View الجاهز
SELECT 
  email,
  full_name,
  role,
  role_name_ar,
  properties_limit,
  images_limit,
  properties_count,
  can_publish,
  is_verified,
  status_indicator,
  last_sign_in_at
FROM users_with_permissions
WHERE email = 'eng.khalid.work@gmail.com';

-- التحقق من الدالة
SELECT 
  public.is_admin(id) as is_admin,
  public.get_user_role(id) as role
FROM auth.users
WHERE email = 'eng.khalid.work@gmail.com';

-- التحقق من الحدود
SELECT * FROM public.get_user_limits(
  (SELECT id FROM auth.users WHERE email = 'eng.khalid.work@gmail.com')
);

-- ========================================
-- يجب أن ترى:
-- role: admin
-- role_name_ar: 🔑 مدير النظام
-- properties_limit: -1 (غير محدود)
-- images_limit: -1 (غير محدود)
-- status_indicator: 🔑 غير محدود
-- ========================================

-- ========================================
-- (اختياري) عرض جميع المدراء
-- ========================================

SELECT 
  email,
  full_name,
  role_name_ar,
  properties_limit,
  images_limit,
  properties_count,
  images_count,
  is_verified,
  account_created,
  last_sign_in_at
FROM users_with_permissions
WHERE role = 'admin'
ORDER BY account_created DESC;

-- ========================================
-- (اختياري) إضافة مدير إضافي
-- ========================================

-- استخدام الدالة (يتطلب مدير موجود)
/*
SELECT public.update_user_role(
  target_user_id := (SELECT id FROM auth.users WHERE email = 'new.admin@example.com'),
  new_role := 'admin',
  admin_id := (SELECT id FROM auth.users WHERE email = 'eng.khalid.work@gmail.com')
);
*/

-- ========================================
-- بعد التنفيذ:
-- ========================================
-- 1. سجل خروج من التطبيق
-- 2. سجل دخول مرة أخرى
-- 3. افتح Console (F12)
-- 4. يجب أن ترى: isAdmin: true, userRole: "admin"
-- 5. ستكون لديك صلاحيات كاملة في Dashboard
-- ========================================
