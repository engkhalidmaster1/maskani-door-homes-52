-- 🔧 إصلاح شامل لمشاكل قاعدة البيانات
-- هذا السكريبت يحل جميع مشاكل 406, 403, 409 والـ foreign key constraints

-- 1. إنشاء أو تحديث جدول profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. إنشاء أو تحديث جدول user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. إنشاء أو تحديث جدول user_statuses
CREATE TABLE IF NOT EXISTS user_statuses (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. إضافة البيانات المفقودة للمستخدم الحالي
DO $$
DECLARE
    current_user_id UUID := '85c5601e-d99e-4daa-90c6-515f5accff06';
    user_email TEXT := 'eng.khalid.work@gmail.com';
BEGIN
    -- إضافة المستخدم إلى user_roles إذا لم يكن موجوداً
    INSERT INTO user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- إضافة المستخدم إلى profiles إذا لم يكن موجوداً
    INSERT INTO profiles (user_id, email, first_name, last_name)
    VALUES (current_user_id, user_email, 'Khalid', 'Engineer')
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- إضافة المستخدم إلى user_statuses إذا لم يكن موجوداً
    INSERT INTO user_statuses (user_id, status)
    VALUES (current_user_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'تم إنشاء البيانات للمستخدم: %', user_email;
END $$;

-- 5. إنشاء function لإضافة المستخدمين الجدد تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إضافة المستخدم إلى user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- إضافة المستخدم إلى profiles
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- إضافة المستخدم إلى user_statuses
  INSERT INTO public.user_statuses (user_id, status)
  VALUES (NEW.id, 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. إنشاء trigger لتشغيل الfunction تلقائياً
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. تحديث RLS policies للجداول

-- RLS policies لجدول profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies لجدول user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- RLS policies لجدول user_statuses
ALTER TABLE user_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own status" ON user_statuses;
CREATE POLICY "Users can view own status" ON user_statuses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own status" ON user_statuses;
CREATE POLICY "Users can update own status" ON user_statuses
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. إضافة جميع المستخدمين الموجودين في Auth لكن المفقودين من الجداول
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_roles ur ON au.id = ur.user_id
        WHERE ur.user_id IS NULL
    LOOP
        -- إضافة إلى user_roles
        INSERT INTO user_roles (user_id, role)
        VALUES (auth_user.id, 'user')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- إضافة إلى profiles
        INSERT INTO profiles (user_id, email, first_name, last_name)
        VALUES (
            auth_user.id, 
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', '')
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- إضافة إلى user_statuses
        INSERT INTO user_statuses (user_id, status)
        VALUES (auth_user.id, 'active')
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم المفقود: %', auth_user.email;
    END LOOP;
END $$;

-- 9. التحقق من النتائج
SELECT 
    'user_roles' as table_name,
    COUNT(*) as count
FROM user_roles
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'user_statuses' as table_name,
    COUNT(*) as count
FROM user_statuses;

-- 10. عرض المستخدم الحالي للتحقق
SELECT 
    ur.user_id,
    p.email,
    ur.role,
    us.status,
    'Success' as result
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id
JOIN user_statuses us ON ur.user_id = us.user_id
WHERE ur.user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';

-- تم الانتهاء من إصلاح قاعدة البيانات ✅