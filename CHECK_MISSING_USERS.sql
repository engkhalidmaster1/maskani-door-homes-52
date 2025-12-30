-- فحص المستخدمين المفقودين في جدول profiles
-- هذا السكريبت سيظهر المستخدمين الموجودين في auth.users لكن غير موجودين في profiles

-- 1. عرض جميع المستخدمين في auth.users
SELECT 
    'المستخدمين في auth.users:' as category,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- فاصل
SELECT '==========================================' as separator;

-- 2. عرض المستخدمين في profiles
SELECT 
    'المستخدمين في profiles:' as category,
    user_id as id,
    email,
    full_name,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- فاصل
SELECT '==========================================' as separator;

-- 3. إيجاد المستخدمين المفقودين (موجودين في auth.users لكن غير موجودين في profiles)
SELECT 
    'المستخدمين المفقودين في profiles:' as category,
    au.id,
    au.email,
    au.created_at,
    'مفقود من profiles' as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY au.created_at DESC;

-- فاصل
SELECT '==========================================' as separator;

-- 4. إيجاد المستخدمين المفقودين (موجودين في auth.users لكن غير موجودين في user_permissions)
SELECT 
    'المستخدمين المفقودين في user_permissions:' as category,
    au.id,
    au.email,
    au.created_at,
    'مفقود من user_permissions' as status
FROM auth.users au
LEFT JOIN user_permissions up ON au.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY au.created_at DESC;