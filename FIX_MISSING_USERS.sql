-- إصلاح المستخدمين المفقودين
-- هذا السكريبت سيضيف المستخدمين المفقودين إلى الجداول اللازمة

-- ملاحظة: شغل سكريبت CHECK_MISSING_USERS.sql أولاً لترى المستخدمين المفقودين
-- ثم استبدل 'USER_ID_HERE' و 'USER_EMAIL_HERE' بالقيم الصحيحة

-- الخطوة 1: إضافة المستخدم إلى جدول profiles (إذا كان مفقوداً)
-- استبدل القيم التالية بالقيم الصحيحة من نتائج الفحص:
/*
INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
VALUES (
    'USER_ID_HERE',  -- ضع ID المستخدم المفقود هنا
    'USER_EMAIL_HERE',  -- ضع بريد المستخدم هنا
    'مستخدم جديد',  -- يمكن تغييره لاحقاً
    NOW(),
    NOW()
);
*/

-- الخطوة 2: إضافة المستخدم إلى جدول user_permissions (إذا كان مفقوداً)
/*
INSERT INTO user_permissions (
    user_id, 
    role, 
    properties_count, 
    can_publish, 
    is_verified, 
    is_active,
    limits
)
VALUES (
    'USER_ID_HERE',  -- ضع ID المستخدم المفقود هنا
    'publisher',  -- دور المستخدم (publisher, agent, office, admin)
    0,  -- عدد العقارات الحالي
    true,  -- هل يمكنه النشر
    false,  -- هل تم التحقق منه
    true,  -- هل الحساب نشط
    '{"properties": 3}'  -- حد العقارات المسموح
);
*/

-- مثال كامل لإضافة مستخدم (احذف التعليق وضع القيم الصحيحة):
-- لإضافة مستخدم با ID معين وبريد إلكتروني معين:

-- INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
-- VALUES ('المستخدم_ID_هنا', 'البريد_الإلكتروني_هنا', 'الاسم_الكامل', NOW(), NOW());

-- INSERT INTO user_permissions (user_id, role, properties_count, can_publish, is_verified, is_active, limits)
-- VALUES ('المستخدم_ID_هنا', 'publisher', 0, true, false, true, '{"properties": 3}');

-- للتحقق من النتيجة بعد الإضافة:
SELECT 
    'بعد الإصلاح - المستخدمين في التطبيق:' as status,
    p.user_id,
    p.email,
    p.full_name,
    up.role,
    up.can_publish,
    up.is_verified
FROM profiles p
JOIN user_permissions up ON p.user_id = up.user_id
ORDER BY p.created_at DESC;