-- 🔧 إصلاح قاعدة البيانات - المستخدم الحالي
-- انسخ هذا السكريپت كاملاً والصقه في Supabase SQL Editor ثم اضغط Run

-- إضافة المستخدم إلى جدول user_roles
INSERT INTO user_roles (user_id, role, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'admin', 
    NOW(), 
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

-- إضافة المستخدم إلى جدول profiles  
INSERT INTO profiles (user_id, email, first_name, last_name, full_name, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'eng.khalid.work@gmail.com',
    'Khalid',
    'Engineer',
    'Khalid Engineer',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    email = 'eng.khalid.work@gmail.com',
    first_name = 'Khalid',
    last_name = 'Engineer',
    full_name = 'Khalid Engineer',
    updated_at = NOW();

-- إضافة المستخدم إلى جدول user_statuses
INSERT INTO user_statuses (user_id, status, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'active', 
    NOW(), 
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    status = 'active',
    updated_at = NOW();

-- التحقق من النجاح
SELECT 
    'تم الإصلاح بنجاح ✅' as status,
    ur.role as user_role,
    p.email as profile_email,
    p.full_name as full_name,
    us.status as user_status
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id  
JOIN user_statuses us ON ur.user_id = us.user_id
WHERE ur.user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';