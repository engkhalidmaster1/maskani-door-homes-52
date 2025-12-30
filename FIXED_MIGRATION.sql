-- ========================================
-- Unified Permissions System - FIXED VERSION
-- نظام صلاحيات موحد ومحسّن - نسخة معدلة
-- Date: 2025-10-17
-- ========================================

-- ========================================
-- 1. Clean Slate - Drop Everything First
-- ========================================

-- Drop the view first
DROP VIEW IF EXISTS public.users_with_permissions CASCADE;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_user_stats_on_property_change ON properties;
DROP TRIGGER IF EXISTS on_auth_user_created_permissions ON auth.users;

-- Drop all policies on user_permissions
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'user_permissions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_permissions', pol.policyname);
  END LOOP;
END $$;

-- Drop policies on properties that use our functions
DROP POLICY IF EXISTS "Users can add properties within limits" ON properties;

-- Now drop all functions with CASCADE
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_limits(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_add_property(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role(uuid, user_role_type, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.toggle_user_ban(uuid, boolean, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_statistics() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_permissions() CASCADE;

-- Drop the old table completely (we'll recreate with correct structure)
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- ========================================
-- 2. Create New User Role Type
-- ========================================

DO $$ BEGIN
  DROP TYPE IF EXISTS public.user_role_type CASCADE;
  CREATE TYPE public.user_role_type AS ENUM (
    'admin',              -- مدير النظام - صلاحيات كاملة
    'office',             -- مكتب عقارات - غير محدود
    'agent',              -- وكيل عقاري (موثق) - 10 عقارات
    'publisher'           -- ناشر عادي - 3 عقارات
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- 3. Create Unified Permissions Table (FORCE RECREATE)
-- ========================================

-- Force drop if exists to ensure clean structure
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- Now create with correct structure
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- الدور الأساسي
  role user_role_type NOT NULL DEFAULT 'publisher',
  
  -- الحدود (JSONB for flexibility)
  limits JSONB NOT NULL DEFAULT '{
    "properties": 3,
    "images_per_property": 10,
    "featured_properties": 0,
    "storage_mb": 100
  }'::jsonb,
  
  -- الحالة
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_publish BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- التحقق
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- الإحصائيات
  properties_count INTEGER NOT NULL DEFAULT 0,
  images_count INTEGER NOT NULL DEFAULT 0,
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- فهرس فريد
  UNIQUE(user_id)
);

-- ========================================
-- 4. Enable RLS
-- ========================================

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. Create Helper Functions
-- ========================================

-- دالة للحصول على دور المستخدم
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID DEFAULT auth.uid())
RETURNS user_role_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_permissions WHERE user_id = uid;
$$;

-- دالة للتحقق من صلاحية المستخدم
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = uid AND role = 'admin'
  );
$$;

-- دالة للحصول على الحدود
CREATE OR REPLACE FUNCTION public.get_user_limits(uid UUID DEFAULT auth.uid())
RETURNS TABLE (
  role user_role_type,
  properties_limit INTEGER,
  images_limit INTEGER,
  featured_limit INTEGER,
  storage_mb INTEGER,
  current_properties INTEGER,
  current_images INTEGER,
  can_publish BOOLEAN,
  is_verified BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    up.role,
    (up.limits->>'properties')::INTEGER as properties_limit,
    (up.limits->>'images_per_property')::INTEGER as images_limit,
    (up.limits->>'featured_properties')::INTEGER as featured_limit,
    (up.limits->>'storage_mb')::INTEGER as storage_mb,
    up.properties_count as current_properties,
    up.images_count as current_images,
    up.can_publish,
    up.is_verified,
    up.is_active
  FROM public.user_permissions up
  WHERE up.user_id = uid;
$$;

-- دالة للتحقق من إمكانية إضافة عقار
CREATE OR REPLACE FUNCTION public.can_add_property(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role user_role_type;
  v_limit INTEGER;
  v_current INTEGER;
  v_can_publish BOOLEAN;
BEGIN
  SELECT 
    role,
    (limits->>'properties')::INTEGER,
    properties_count,
    can_publish
  INTO v_role, v_limit, v_current, v_can_publish
  FROM public.user_permissions
  WHERE user_id = uid;
  
  -- التحقق من إمكانية النشر
  IF NOT v_can_publish THEN
    RETURN false;
  END IF;
  
  -- Admin و Office لديهم صلاحيات غير محدودة
  IF v_role IN ('admin', 'office') THEN
    RETURN true;
  END IF;
  
  -- التحقق من الحد
  RETURN v_current < v_limit;
END;
$$;

-- دالة لتحديث إحصائيات المستخدم
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- تحديث عدد العقارات والصور
  UPDATE public.user_permissions
  SET 
    properties_count = (
      SELECT COUNT(*) FROM properties 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
      AND is_published = true
    ),
    images_count = (
      SELECT COALESCE(SUM(array_length(images, 1)), 0)
      FROM properties 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ========================================
-- 6. Create Triggers
-- ========================================

-- Trigger لتحديث الإحصائيات عند تغيير العقارات
DROP TRIGGER IF EXISTS update_user_stats_on_property_change ON properties;
CREATE TRIGGER update_user_stats_on_property_change
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics();

-- Trigger لإنشاء صلاحيات افتراضية للمستخدمين الجدد
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_permissions (user_id, role, limits)
  VALUES (
    NEW.id,
    'publisher',
    '{
      "properties": 3,
      "images_per_property": 10,
      "featured_properties": 0,
      "storage_mb": 100
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_permissions ON auth.users;
CREATE TRIGGER on_auth_user_created_permissions
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_permissions();

-- ========================================
-- 7. RLS Policies
-- ========================================

-- المستخدمون يرون صلاحياتهم
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- المدراء يرون جميع الصلاحيات
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_permissions;
CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions
  FOR SELECT
  USING (public.is_admin());

-- المدراء يحدثون الصلاحيات
DROP POLICY IF EXISTS "Admins can update permissions" ON public.user_permissions;
CREATE POLICY "Admins can update permissions"
  ON public.user_permissions
  FOR UPDATE
  USING (public.is_admin());

-- المدراء يضيفون صلاحيات
DROP POLICY IF EXISTS "Admins can insert permissions" ON public.user_permissions;
CREATE POLICY "Admins can insert permissions"
  ON public.user_permissions
  FOR INSERT
  WITH CHECK (public.is_admin());

-- ========================================
-- 8. Update Properties Policies
-- ========================================

-- تحديث policy إضافة العقارات
DROP POLICY IF EXISTS "Users can add properties within limits" ON properties;
CREATE POLICY "Users can add properties within limits"
  ON properties
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.can_add_property(auth.uid())
  );

-- ========================================
-- 9. Admin Management Functions
-- ========================================

-- دالة لتحديث دور مستخدم (للمدراء فقط)
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
BEGIN
  -- التحقق من صلاحيات المدير
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
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

-- دالة لحظر/إلغاء حظر مستخدم
CREATE OR REPLACE FUNCTION public.toggle_user_ban(
  target_user_id UUID,
  should_ban BOOLEAN,
  admin_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من صلاحيات المدير
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
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
-- 10. Data Migration from Old Tables
-- ========================================

-- نقل البيانات من user_roles و user_statuses
INSERT INTO public.user_permissions (
  user_id,
  role,
  limits,
  can_publish,
  is_verified,
  verified_by,
  verified_at,
  created_at
)
SELECT 
  au.id,
  CASE 
    WHEN ur.role = 'admin' THEN 'admin'::user_role_type
    WHEN us.status = 'office_agent' THEN 'office'::user_role_type
    WHEN us.status = 'trusted_owner' THEN 'agent'::user_role_type
    ELSE 'publisher'::user_role_type
  END,
  CASE 
    WHEN ur.role = 'admin' THEN '{
      "properties": -1,
      "images_per_property": -1,
      "featured_properties": -1,
      "storage_mb": -1
    }'::jsonb
    WHEN us.status = 'office_agent' THEN '{
      "properties": -1,
      "images_per_property": 10,
      "featured_properties": 50,
      "storage_mb": 5000
    }'::jsonb
    WHEN us.status = 'trusted_owner' THEN '{
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
  END,
  COALESCE(us.can_publish, true),
  COALESCE(us.is_verified, false),
  us.verified_by,
  us.verified_at,
  COALESCE(us.created_at, au.created_at)
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_statuses us ON au.id = us.user_id
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  limits = EXCLUDED.limits,
  can_publish = EXCLUDED.can_publish,
  is_verified = EXCLUDED.is_verified,
  verified_by = EXCLUDED.verified_by,
  verified_at = EXCLUDED.verified_at;

-- تحديث الإحصائيات لجميع المستخدمين
UPDATE public.user_permissions up
SET 
  properties_count = (
    SELECT COUNT(*) FROM properties p
    WHERE p.user_id = up.user_id AND p.is_published = true
  ),
  images_count = (
    SELECT COALESCE(SUM(array_length(images, 1)), 0)
    FROM properties p
    WHERE p.user_id = up.user_id
  );

-- ========================================
-- 11. Create Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role ON public.user_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_can_publish ON public.user_permissions(can_publish);
CREATE INDEX IF NOT EXISTS idx_user_permissions_is_verified ON public.user_permissions(is_verified);

-- ========================================
-- 12. Grant Permissions
-- ========================================

GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_add_property TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_user_ban TO authenticated;

-- ========================================
-- 13. Create View for Easy Querying
-- ========================================

CREATE OR REPLACE VIEW public.users_with_permissions AS
SELECT 
  au.id,
  au.email,
  au.created_at as account_created,
  au.last_sign_in_at,
  au.email_confirmed_at,
  p.full_name,
  p.phone,
  p.address,
  up.role,
  up.limits,
  (up.limits->>'properties')::INTEGER as properties_limit,
  (up.limits->>'images_per_property')::INTEGER as images_limit,
  (up.limits->>'featured_properties')::INTEGER as featured_limit,
  (up.limits->>'storage_mb')::INTEGER as storage_mb,
  up.properties_count,
  up.images_count,
  up.can_publish,
  up.is_verified,
  up.is_active,
  up.verified_by,
  up.verified_at,
  up.created_at as permissions_created,
  up.updated_at as permissions_updated,
  CASE up.role
    WHEN 'admin' THEN '🔑 مدير النظام'
    WHEN 'office' THEN '🏢 مكتب عقارات'
    WHEN 'agent' THEN '🏆 وكيل عقاري'
    WHEN 'publisher' THEN '👤 ناشر عادي'
  END as role_name_ar,
  CASE 
    WHEN NOT up.can_publish THEN '🚫 محظور'
    WHEN up.role = 'admin' THEN '🔑 غير محدود'
    WHEN up.role = 'office' THEN '🏢 غير محدود'
    WHEN up.properties_count >= (up.limits->>'properties')::INTEGER THEN '🔴 وصل للحد'
    WHEN up.properties_count >= (up.limits->>'properties')::INTEGER * 0.8 THEN '🟡 قريب من الحد'
    ELSE '🟢 ضمن الحد'
  END as status_indicator
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN user_permissions up ON au.id = up.user_id;

-- ========================================
-- Success Message
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Unified Permissions System Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Roles Available:';
  RAISE NOTICE '   - admin: مدير النظام (غير محدود)';
  RAISE NOTICE '   - office: مكتب عقارات (غير محدود عقارات، 10 صور)';
  RAISE NOTICE '   - agent: وكيل عقاري (10 عقارات، 10 صور)';
  RAISE NOTICE '   - publisher: ناشر عادي (3 عقارات، 10 صور)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Available:';
  RAISE NOTICE '   - get_user_role()';
  RAISE NOTICE '   - is_admin()';
  RAISE NOTICE '   - get_user_limits()';
  RAISE NOTICE '   - can_add_property()';
  RAISE NOTICE '   - update_user_role()';
  RAISE NOTICE '   - toggle_user_ban()';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Components Created:';
  RAISE NOTICE '   ✅ Table: user_permissions';
  RAISE NOTICE '   ✅ Type: user_role_type';
  RAISE NOTICE '   ✅ Functions: 6';
  RAISE NOTICE '   ✅ Triggers: 3';
  RAISE NOTICE '   ✅ Policies: 4';
  RAISE NOTICE '   ✅ View: users_with_permissions';
  RAISE NOTICE '   ✅ Data Migration: Complete';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Run MAKE_ADMIN_UNIFIED.sql to assign admin role';
  RAISE NOTICE '   2. Test with CHECK_MIGRATION_STATUS.sql';
  RAISE NOTICE '   3. Update frontend to use new system';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration completed successfully!';
  RAISE NOTICE '========================================';
END $$;
