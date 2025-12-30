-- ========================================
-- 🔒 تحديث دالة update_user_role لحماية المدير
-- Update function to protect super admin
-- ========================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role user_role_type,
  admin_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_new_limits JSONB;
  v_target_email TEXT;
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
BEGIN
  -- التحقق من صلاحيات المدير
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- الحصول على بريد المستخدم المستهدف
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = target_user_id;
  
  -- 🛡️ حماية المدير العام من التغيير
  IF v_target_email = v_super_admin_email AND new_role != 'admin' THEN
    RAISE EXCEPTION '🚫 لا يمكن تغيير دور المدير العام! هذا الحساب محمي بشكل دائم.';
  END IF;
  
  -- تحديد الحدود بناءً على الدور
  v_new_limits := CASE new_role
    WHEN 'admin' THEN '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb
    WHEN 'office' THEN '{
      "properties": -1,
      "images_per_property": 10,
      "featured_properties": 50,
      "storage_mb": 5000
    }'::jsonb
    WHEN 'agent' THEN '{
      "properties": 10,
      "images_per_property": 10,
      "featured_properties": 3,
      "storage_mb": 500
    }'::jsonb
    ELSE '{
      "properties": 3,
      "images_per_property": 10,
      "featured_properties": 0,
      "storage_mb": 100
    }'::jsonb
  END;
  
  -- تحديث الدور والحدود
  UPDATE public.user_permissions
  SET 
    role = new_role,
    limits = v_new_limits,
    is_verified = CASE 
      WHEN new_role IN ('agent', 'office', 'admin') THEN true
      ELSE is_verified
    END,
    verified_by = CASE 
      WHEN new_role IN ('agent', 'office', 'admin') THEN admin_id
      ELSE verified_by
    END,
    verified_at = CASE 
      WHEN new_role IN ('agent', 'office', 'admin') THEN now()
      ELSE verified_at
    END,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- ========================================
-- 🔒 تحديث دالة toggle_user_ban لحماية المدير
-- Update function to protect super admin from banning
-- ========================================

CREATE OR REPLACE FUNCTION public.toggle_user_ban(
  target_user_id UUID,
  should_ban BOOLEAN,
  admin_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_target_email TEXT;
  v_super_admin_email TEXT := 'eng.khalid.work@gmail.com';
BEGIN
  -- التحقق من صلاحيات المدير
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
  END IF;
  
  -- الحصول على بريد المستخدم المستهدف
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = target_user_id;
  
  -- 🛡️ حماية المدير العام من الحظر
  IF v_target_email = v_super_admin_email AND should_ban = true THEN
    RAISE EXCEPTION '🚫 لا يمكن حظر المدير العام! هذا الحساب محمي بشكل دائم.';
  END IF;
  
  UPDATE public.user_permissions
  SET 
    can_publish = NOT should_ban,
    is_active = NOT should_ban,
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;

-- ========================================
-- ✅ رسالة تأكيد
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم تحديث الدوال بنجاح!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 الحمايات المضافة:';
  RAISE NOTICE '   ✅ update_user_role: حماية من تغيير الدور';
  RAISE NOTICE '   ✅ toggle_user_ban: حماية من الحظر';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  الحساب المحمي: eng.khalid.work@gmail.com';
  RAISE NOTICE '';
  RAISE NOTICE '📝 الآن يمكنك:';
  RAISE NOTICE '   1. محاولة تغيير دورك → ستفشل';
  RAISE NOTICE '   2. محاولة حظر نفسك → ستفشل';
  RAISE NOTICE '   3. تعديل أي مستخدم آخر → ستنجح';
  RAISE NOTICE '========================================';
END $$;
