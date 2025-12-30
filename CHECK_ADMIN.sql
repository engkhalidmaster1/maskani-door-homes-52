-- ==================================================
-- التحقق من حالة المدير وإضافة مدير جديد
-- ==================================================

-- 1. عرض جميع المستخدمين المسجلين
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. عرض جميع المديرين الحاليين
SELECT 
    au.user_id,
    au.role,
    au.active,
    au.permissions,
    u.email,
    au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;

-- 3. تحديث/إضافة مدير (استبدل البريد الإلكتروني)
-- ==================================================
-- 🔥 نفذ هذا الأمر لتحديث أو إضافة صلاحيات المدير:
INSERT INTO admin_users (user_id, role, created_by, permissions, active)
SELECT 
    id, 
    'super_admin', 
    id,
    '{"approve_offices": true, "manage_users": true, "view_reports": true, "delete_users": true}'::jsonb,
    true
FROM auth.users 
WHERE email = 'eng.khalid.work@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET 
    role = 'super_admin', 
    active = true,
    permissions = '{"approve_offices": true, "manage_users": true, "view_reports": true, "delete_users": true}'::jsonb;

-- 4. تحديث مدير موجود بـ user_id مباشرة
-- إذا كنت تعرف الـ user_id مباشرة:
UPDATE admin_users 
SET 
    role = 'super_admin',
    active = true,
    permissions = '{"approve_offices": true, "manage_users": true, "view_reports": true, "delete_users": true}'::jsonb
WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';

-- 5. حذف صلاحيات مدير
-- DELETE FROM admin_users 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'بريد_المستخدم@example.com');
