-- 🔧 حل مشكلة Foreign Key - خطوة بخطوة
-- تشغيل هذه الاستعلامات بالترتيب

-- 1. أولاً: التحقق من وجود المستخدم في auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '85c5601e-d99e-4daa-90c6-515f5accff06';

-- إذا لم تظهر نتائج، شغل هذا للبحث بالإيميل:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'eng.khalid.work@gmail.com';

-- 2. إذا وُجد المستخدم بـ ID مختلف، استخدم الـ ID الصحيح في الاستعلامات التالية
-- (استبدل NEW_USER_ID بالـ ID الصحيح)

-- 3. إضافة المستخدم للجداول (استخدم الـ ID الصحيح)
INSERT INTO user_roles (user_id, role) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'admin');

INSERT INTO profiles (user_id, email, first_name, last_name, full_name) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'eng.khalid.work@gmail.com', 'Khalid', 'Engineer', 'Khalid Engineer');

INSERT INTO user_statuses (user_id, status) 
VALUES ('85c5601e-d99e-4daa-90c6-515f5accff06', 'active');