-- ========================================
-- دالة لإضافة مستخدم جديد من لوحة التحكم
-- Admin Function to Create New User
-- ========================================

-- ملاحظة: هذه الدالة تتطلب Service Role Key
-- لا يمكن استخدامها من المتصفح مباشرة
-- يجب استخدام supabase.auth.admin.createUser() من Backend

-- ========================================
-- دالة مساعدة: التحقق من البريد الإلكتروني
-- ========================================

CREATE OR REPLACE FUNCTION public.is_email_taken(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
  );
$$;

-- ========================================
-- دالة: إنشاء ملف شخصي وصلاحيات للمستخدم الجديد
-- ========================================

CREATE OR REPLACE FUNCTION public.setup_new_user(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_role user_role_type DEFAULT 'publisher'
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_role_limits JSONB;
  v_result JSONB;
BEGIN
  -- تحديد الحدود بناءً على الدور
  v_role_limits := CASE p_role
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

  -- 1. إنشاء الملف الشخصي
  INSERT INTO public.profiles (user_id, full_name, phone, address)
  VALUES (p_user_id, p_full_name, p_phone, p_address)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    address = COALESCE(EXCLUDED.address, profiles.address),
    updated_at = now();

  -- 2. إنشاء الصلاحيات
  INSERT INTO public.user_permissions (user_id, role, limits, is_verified, is_active, can_publish)
  VALUES (
    p_user_id,
    p_role,
    v_role_limits,
    p_role != 'publisher', -- موثق إذا لم يكن ناشر عادي
    true,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    limits = EXCLUDED.limits,
    is_verified = EXCLUDED.is_verified,
    updated_at = now();

  -- 3. إنشاء نتيجة JSON
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', p_email,
    'role', p_role,
    'limits', v_role_limits,
    'message', 'User setup completed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to setup user'
    );
END;
$$;

-- ========================================
-- دالة: حصول على إحصائيات المستخدمين
-- ========================================

CREATE OR REPLACE FUNCTION public.get_users_statistics()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users', (SELECT COUNT(*) FROM user_permissions WHERE can_publish = true),
    'banned_users', (SELECT COUNT(*) FROM user_permissions WHERE can_publish = false),
    'verified_users', (SELECT COUNT(*) FROM user_permissions WHERE is_verified = true),
    'by_role', (
      SELECT jsonb_object_agg(role, count)
      FROM (
        SELECT 
          role,
          COUNT(*) as count
        FROM user_permissions
        GROUP BY role
      ) roles
    ),
    'total_properties', (SELECT COUNT(*) FROM properties WHERE is_published = true),
    'total_images', (
      SELECT COALESCE(SUM(array_length(images, 1)), 0)
      FROM properties
    )
  );
$$;

-- ========================================
-- صلاحيات التنفيذ
-- ========================================

GRANT EXECUTE ON FUNCTION public.is_email_taken TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_new_user TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_statistics TO authenticated;

-- ========================================
-- أمثلة استخدام
-- ========================================

-- مثال 1: التحقق من البريد الإلكتروني
-- SELECT is_email_taken('test@example.com');

-- مثال 2: إعداد مستخدم جديد (يتطلب Service Role)
-- SELECT setup_new_user(
--   'user-uuid-here',
--   'test@example.com',
--   'اسم المستخدم',
--   '+966501234567',
--   'الرياض',
--   'agent'
-- );

-- مثال 3: احصائيات المستخدمين
-- SELECT get_users_statistics();

-- ========================================
-- ملاحظات مهمة
-- ========================================

/*
1. إنشاء المستخدم في auth.users يتطلب Service Role Key:
   - لا يمكن إنشاؤه من المتصفح مباشرة
   - يجب استخدام Supabase Admin API
   - أو Edge Function
   - أو Backend Server

2. الطريقة الصحيحة:
   
   في Frontend (TypeScript):
   ```typescript
   const { data, error } = await supabase.auth.admin.createUser({
     email: 'user@example.com',
     password: 'password123',
     email_confirm: true,
   });
   
   if (data.user) {
     await supabase.rpc('setup_new_user', {
       p_user_id: data.user.id,
       p_email: data.user.email,
       p_full_name: 'اسم المستخدم',
       p_role: 'agent'
     });
   }
   ```

3. البدائل:
   - استخدام Edge Function
   - استخدام Server-side API
   - دعوة المستخدمين للتسجيل الذاتي ثم ترقيتهم

4. الأمان:
   - setup_new_user تستخدم SECURITY DEFINER
   - يمكن استدعاؤها بعد إنشاء المستخدم
   - لا تتطلب Service Role بعد الإنشاء
*/

-- ========================================
-- النهاية
-- ========================================
