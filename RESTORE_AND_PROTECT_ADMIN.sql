-- ========================================
-- 🚨 استرجاع صلاحيات المدير + حماية دائمة
-- Restore Admin + Permanent Protection
-- ========================================

-- ✅ الخطوة 1: استرجاع صلاحيات المدير فوراً
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- الحصول على user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eng.khalid.work@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ المستخدم غير موجود!';
  END IF;
  
  -- استرجاع صلاحيات المدير
  UPDATE public.user_permissions
  SET 
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
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم استرجاع صلاحيات المدير!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'المستخدم: eng.khalid.work@gmail.com';
  RAISE NOTICE 'الدور: 👑 مدير النظام (Admin)';
  RAISE NOTICE 'الحماية: مفعّلة (لن يمكن تغيير الدور)';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 🛡️ الخطوة 2: حماية دائمة لمنع تغيير الدور
-- ========================================

-- إنشاء دالة للحماية
CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
  v_super_admin_id UUID;
BEGIN
  -- الحصول على ID المدير المحمي
  SELECT id INTO v_super_admin_id
  FROM auth.users
  WHERE email = v_super_admin_email;
  
  -- منع تغيير دور المدير المحمي
  IF NEW.user_id = v_super_admin_id AND NEW.role != 'admin' THEN
    RAISE EXCEPTION '🚫 لا يمكن تغيير دور المدير العام! هذا الحساب محمي.';
  END IF;
  
  -- منع حظر المدير المحمي
  IF NEW.user_id = v_super_admin_id AND (NEW.is_active = false OR NEW.can_publish = false) THEN
    RAISE EXCEPTION '🚫 لا يمكن حظر المدير العام! هذا الحساب محمي.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء Trigger للحماية
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON user_permissions;
CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION protect_super_admin();

-- ========================================
-- 🔒 الخطوة 3: حماية إضافية على مستوى RLS
-- ========================================

-- منع المستخدمين الآخرين من تعديل المدير العام
DROP POLICY IF EXISTS "Protect super admin from modifications" ON public.user_permissions;
CREATE POLICY "Protect super admin from modifications"
  ON public.user_permissions
  FOR UPDATE
  USING (
    user_id != (SELECT id FROM auth.users WHERE email = 'eng.khalid.work@gmail.com')
    OR public.is_admin()
  );

-- ========================================
-- ✅ الخطوة 4: التحقق من النتيجة
-- ========================================

SELECT 
  '✅ الحماية مفعّلة!' as status,
  email,
  role,
  CASE role
    WHEN 'admin' THEN '👑 مدير النظام المحمي'
    ELSE role::TEXT
  END as role_display,
  can_publish,
  is_active
FROM users_with_permissions
WHERE email = 'eng.khalid.work@gmail.com';

-- ========================================
-- 🧪 الخطوة 5: اختبار الحماية
-- ========================================

-- محاولة تغيير الدور (يجب أن تفشل)
DO $$
BEGIN
  UPDATE user_permissions
  SET role = 'agent'::user_role_type
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'eng.khalid.work@gmail.com');
  
  RAISE NOTICE '❌ فشل الاختبار - تم تغيير الدور!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✅ نجح الاختبار - الحماية تعمل!';
    RAISE NOTICE 'رسالة الخطأ: %', SQLERRM;
END $$;

-- ========================================
-- 📝 ملخص الحماية
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🛡️  ملخص الحماية';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ الحساب المحمي: eng.khalid.work@gmail.com';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 الحمايات المفعّلة:';
  RAISE NOTICE '   1. منع تغيير الدور';
  RAISE NOTICE '   2. منع الحظر';
  RAISE NOTICE '   3. منع التعطيل';
  RAISE NOTICE '   4. حماية على مستوى Database Trigger';
  RAISE NOTICE '   5. حماية على مستوى RLS Policy';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  لتعطيل الحماية (للطوارئ):';
  RAISE NOTICE '   DROP TRIGGER protect_super_admin_trigger ON user_permissions;';
  RAISE NOTICE '';
  RAISE NOTICE '✅ الآن سجل خروج ودخول لتفعيل التغييرات!';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 💡 ملاحظات مهمة
-- ========================================

-- ✅ بعد تنفيذ هذا الملف:
-- 1. الحساب eng.khalid.work@gmail.com سيكون مدير دائماً
-- 2. لا يمكن لأي شخص (حتى المدراء الآخرين) تغيير دورك
-- 3. لا يمكن حظر هذا الحساب
-- 4. الحماية على مستوى Database (أقوى حماية)

-- 🔧 لإضافة مدير محمي آخر:
-- 1. عدّل v_super_admin_email في دالة protect_super_admin()
-- 2. أو أضف array من الإيميلات المحمية

-- ⚠️  لإزالة الحماية (للطوارئ فقط):
-- DROP TRIGGER protect_super_admin_trigger ON user_permissions;
-- DROP FUNCTION protect_super_admin();
