-- سكريبت لإضافة جميع المستخدمين المفقودين من auth.users إلى profiles تلقائياً
-- يشمل فقط من ليس لهم سجل في profiles

INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
SELECT 
    au.id, 
    au.email, 
    'مستخدم جديد', 
    NOW(), 
    NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- بعد التشغيل، أعد تحميل صفحة المستخدمين وستظهر جميع المستخدمين في النظام.