-- ========================================
-- 🚀 تعيين سريع لصلاحيات المدير
-- Quick Admin Setup
-- ========================================

-- ✅ الخطوة 1: تعيين eng.khalid.work@gmail.com كمدير
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- الحصول على user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eng.khalid.work@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ المستخدم غير موجود! يجب التسجيل أولاً في التطبيق.';
  END IF;
  
  -- تحديث/إضافة صلاحيات المدير
  INSERT INTO public.user_permissions (
    user_id,
    role,
    limits,
    is_active,
    can_publish,
    is_verified,
    verified_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'admin'::user_role_type,
    '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb,
    true,
    true,
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = 'admin'::user_role_type,
    limits = '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb,
    is_active = true,
    can_publish = true,
    is_verified = true,
    verified_at = now(),
    updated_at = now();
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم بنجاح!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'المستخدم: eng.khalid.work@gmail.com';
  RAISE NOTICE 'الدور: 👑 مدير النظام (Admin)';
  RAISE NOTICE 'الصلاحيات: غير محدودة في كل شيء';
  RAISE NOTICE '';
  RAISE NOTICE '📝 الخطوات التالية:';
  RAISE NOTICE '   1. سجل خروج من التطبيق';
  RAISE NOTICE '   2. سجل دخول مرة أخرى';
  RAISE NOTICE '   3. افتح http://localhost:8080/admin/users';
  RAISE NOTICE '   4. ستجد صلاحيات كاملة!';
  RAISE NOTICE '========================================';
END $$;

-- ✅ الخطوة 2: التحقق من النتيجة
SELECT 
  email,
  role,
  CASE role
    WHEN 'admin' THEN '👑 مدير النظام'
    WHEN 'office' THEN '🏢 مكتب عقارات'
    WHEN 'agent' THEN '🏆 وكيل عقاري'
    WHEN 'publisher' THEN '👤 ناشر عادي'
  END as role_arabic,
  properties_count,
  CASE 
    WHEN (limits->>'properties')::INTEGER = -1 THEN '∞ غير محدود'
    ELSE (limits->>'properties')::TEXT || ' عقار'
  END as properties_limit,
  can_publish,
  is_verified,
  is_active,
  CASE 
    WHEN NOT can_publish THEN '🚫 محظور'
    WHEN role = 'admin' THEN '👑 صلاحيات كاملة'
    WHEN role = 'office' THEN '🏢 غير محدود'
    ELSE '✅ نشط'
  END as status
FROM users_with_permissions
WHERE email = 'eng.khalid.work@gmail.com';

-- ========================================
-- 💡 ملاحظات مهمة
-- ========================================

-- ✅ بعد تنفيذ هذا الملف:
-- 1. يجب عليك تسجيل الخروج ثم تسجيل الدخول مرة أخرى
-- 2. سيتم تحديث الصلاحيات تلقائياً
-- 3. ستتمكن من الوصول لجميع صفحات الإدارة

-- ❌ إذا ظهرت رسالة "المستخدم غير موجود":
-- 1. تأكد من أنك سجلت في التطبيق على http://localhost:8080
-- 2. تأكد من كتابة البريد بشكل صحيح
-- 3. تحقق من جدول auth.users في Supabase

-- 🔧 لإضافة مدير إضافي:
-- استبدل 'eng.khalid.work@gmail.com' بالبريد الجديد
-- وأعد تشغيل هذا الملف
