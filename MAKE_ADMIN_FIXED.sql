-- ========================================
-- حل سريع: تعيين eng.khalid.work@gmail.com كمدير
-- نسخة محدثة - تحل مشكلة ON CONFLICT
-- ========================================

-- ⚡ الحل السريع (نفذ هذا مباشرة)
-- ========================================

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
-- التحقق من النتيجة
-- ========================================

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
-- الخطوات التالية:
-- 1. ✅ نفذ الكود أعلاه في Supabase SQL Editor
-- 2. ✅ سجل خروج من التطبيق
-- 3. ✅ سجل دخول مرة أخرى بنفس الإيميل
-- 4. ✅ افتح Console (F12) وتحقق من: isAdmin: true
-- 5. ✅ جرب أزرار الحذف والحظر في Dashboard
-- ========================================
