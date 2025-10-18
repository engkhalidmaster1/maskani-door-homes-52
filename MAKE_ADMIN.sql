-- ========================================
-- حل سريع: تعيين eng.khalid.work@gmail.com كمدير
-- ========================================

-- الخطوة 1: التشخيص (نفذ هذا أولاً)
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

-- 1.2 التحقق من دوره الحالي
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  'Current Role ✅' as note
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';

-- ========================================
-- الخطوة 2: الإصلاح (نفذ هذا بعد التشخيص)
-- ========================================

-- حل شامل: إضافة أو تحديث الدور إلى admin
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'eng.khalid.work@gmail.com';
BEGIN
  -- البحث عن المستخدم
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- التحقق من وجود المستخدم
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم % غير موجود! يجب التسجيل في التطبيق أولاً.', v_email;
  END IF;

  -- حذف الدور القديم إن وجد
  DELETE FROM user_roles WHERE user_id = v_user_id;
  
  -- إضافة الدور الجديد
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin');

  RAISE NOTICE '✅ تم تعيين % كمدير بنجاح!', v_email;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- ========================================
-- الخطوة 3: التحقق النهائي
-- ========================================

-- التحقق من التحديث
SELECT 
  au.id as user_id,
  au.email,
  ur.role,
  p.full_name,
  p.phone,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ مدير'
    WHEN ur.role = 'user' THEN '❌ مستخدم عادي'
    ELSE '⚠️ غير محدد'
  END as status,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'eng.khalid.work@gmail.com';

-- ========================================
-- يجب أن ترى:
-- email: eng.khalid.work@gmail.com
-- role: admin
-- status: ✅ مدير
-- ========================================

-- ========================================
-- (اختياري) عرض جميع المدراء الحاليين
-- ========================================

SELECT 
  au.email,
  p.full_name,
  ur.role,
  au.created_at,
  au.last_sign_in_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE ur.role = 'admin'
ORDER BY au.created_at DESC;

-- ========================================
-- بعد تنفيذ هذه الأوامر:
-- 1. سجل خروج من التطبيق
-- 2. سجل دخول مرة أخرى
-- 3. افتح Console (F12) وابحث عن: "Auth state:"
-- 4. يجب أن ترى: isAdmin: true
-- 5. جرب الأزرار في Dashboard → المستخدمون
-- ========================================
