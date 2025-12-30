-- 🚀 إصلاح سريع للمستخدم الحالي
-- تشغيل هذا السكريبت في Supabase SQL Editor

-- إضافة المستخدم الحالي إلى جميع الجداول المطلوبة
INSERT INTO user_roles (user_id, role)
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO profiles (user_id, email, first_name, last_name, full_name)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'eng.khalid.work@gmail.com',
    'Khalid',
    'Engineer',
    'Khalid Engineer'
)
ON CONFLICT (user_id) DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW();

INSERT INTO user_statuses (user_id, status)
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- التحقق من النتيجة
SELECT 
    'إصلاح مكتمل ✅' as status,
    ur.role,
    p.email,
    us.status
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id  
JOIN user_statuses us ON ur.user_id = us.user_id
WHERE ur.user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';