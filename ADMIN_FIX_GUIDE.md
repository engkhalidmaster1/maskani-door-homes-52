# 🔧 حل مشكلة صلاحيات المدير لـ eng.khalid.work@gmail.com

## 🚨 المشكلة
المستخدم `eng.khalid.work@gmail.com` لا يمكنه:
- ❌ استخدام أزرار الإجراءات (حذف، حظر، تعديل)
- ❌ تغيير صلاحيات المستخدمين
- ❌ الوصول لوظائف المدير

## 🔍 التشخيص

### السبب المحتمل:
المستخدم **غير موجود في جدول `user_roles`** أو دوره ليس `'admin'`

### كيف يعمل النظام:
```typescript
// في useAuth.tsx
const isAdmin = userRole === 'admin';  // ✅ يجب أن يكون 'admin'

// في useDashboardData.tsx
if (!isAdmin) return;  // ❌ إذا لم يكن admin، لا تنفذ العمليات
```

---

## ✅ الحل السريع (3 دقائق)

### الخطوة 1: افتح Supabase SQL Editor

```
1. اذهب إلى: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw
2. من القائمة الجانبية اختر: SQL Editor
3. اضغط: New Query
```

---

### الخطوة 2: تشخيص المشكلة

**الصق هذا الكود أولاً للتحقق**:

```sql
-- 1. البحث عن المستخدم في auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'eng.khalid.work@gmail.com';

-- 2. التحقق من وجوده في user_roles
SELECT 
  ur.user_id,
  ur.role,
  au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';

-- 3. التحقق من profiles
SELECT 
  p.user_id,
  p.full_name,
  p.phone,
  au.email
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';
```

**اضغط Run** وانظر للنتائج:

#### النتيجة المتوقعة:

##### السيناريو 1: المستخدم موجود في auth.users لكن ليس في user_roles ❌
```
Query 1: يعرض البيانات ✅
Query 2: No rows returned ❌ ← هنا المشكلة!
Query 3: يعرض البيانات ✅
```
**الحل**: انتقل للخطوة 3أ

##### السيناريو 2: المستخدم موجود لكن دوره 'user' بدلاً من 'admin' ❌
```
Query 1: يعرض البيانات ✅
Query 2: يعرض role = 'user' ❌ ← هنا المشكلة!
Query 3: يعرض البيانات ✅
```
**الحل**: انتقل للخطوة 3ب

##### السيناريو 3: المستخدم غير موجود في auth.users ❌
```
Query 1: No rows returned ❌ ← المستخدم غير مسجل!
Query 2: No rows returned ❌
Query 3: No rows returned ❌
```
**الحل**: المستخدم يحتاج التسجيل في التطبيق أولاً

---

### الخطوة 3أ: إضافة المستخدم كـ Admin (إذا لم يكن في user_roles)

```sql
-- 1. احصل على user_id
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- البحث عن المستخدم
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eng.khalid.work@gmail.com';

  -- التحقق من وجود المستخدم
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود! يجب التسجيل أولاً.';
  END IF;

  -- إضافة دور admin
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';

  RAISE NOTICE 'تم تعيين المستخدم كمدير بنجاح!';
END $$;
```

**اضغط Run** ✅

---

### الخطوة 3ب: تحديث دور المستخدم إلى Admin (إذا كان موجوداً لكن دوره 'user')

```sql
-- تحديث الدور إلى admin
UPDATE user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'eng.khalid.work@gmail.com'
);

-- التحقق من التحديث
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  'تم التحديث بنجاح ✅' as status
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';
```

**اضغط Run** ✅

---

### الخطوة 4: التحقق من النجاح

```sql
-- التحقق النهائي
SELECT 
  au.id as user_id,
  au.email,
  ur.role,
  p.full_name,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ مدير'
    WHEN ur.role = 'user' THEN '❌ مستخدم عادي'
    ELSE '⚠️ غير محدد'
  END as status
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'eng.khalid.work@gmail.com';
```

**يجب أن ترى**:
```
email: eng.khalid.work@gmail.com
role: admin
status: ✅ مدير
```

---

### الخطوة 5: تسجيل خروج ودخول

**في التطبيق**:
1. سجل خروج من الحساب
2. سجل دخول مرة أخرى
3. افتح Console (F12)
4. ابحث عن: `Auth state:`

**يجب أن ترى**:
```javascript
Auth state: {
  user: "eng.khalid.work@gmail.com",
  userRole: "admin",     // ✅ يجب أن يكون admin
  isAdmin: true,         // ✅ يجب أن يكون true
  isLoading: false
}
```

---

### الخطوة 6: اختبار الأزرار

1. اذهب إلى Dashboard → المستخدمون
2. جرب:
   - ✅ زر الحذف 🗑️ → يجب أن يعمل
   - ✅ زر الحظر 🚫 → يجب أن يعمل
   - ✅ زر إلغاء الحظر 🔓 → يجب أن يعمل
   - ✅ زر التعديل ✏️ → يجب أن يعمل

---

## 🔧 حل بديل: إضافة عدة مدراء

إذا أردت إضافة مدراء آخرين:

```sql
-- إضافة مدراء متعددين
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'eng.khalid.work@gmail.com',
    'admin2@example.com',
    'admin3@example.com'
  ];
  v_user_id UUID;
  v_email TEXT;
BEGIN
  FOREACH v_email IN ARRAY admin_emails
  LOOP
    -- البحث عن المستخدم
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    -- إذا وُجد، اجعله admin
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (v_user_id, 'admin')
      ON CONFLICT (user_id) 
      DO UPDATE SET role = 'admin';
      
      RAISE NOTICE 'تم تعيين % كمدير', v_email;
    ELSE
      RAISE NOTICE '⚠️ المستخدم % غير موجود', v_email;
    END IF;
  END LOOP;
END $$;
```

---

## 📊 فحص جميع المدراء الحاليين

```sql
-- عرض جميع المدراء
SELECT 
  au.email,
  p.full_name,
  ur.role,
  au.created_at,
  au.last_sign_in_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON au.id = p.user_id
WHERE ur.role = 'admin'
ORDER BY au.created_at DESC;
```

---

## ⚠️ استكشاف الأخطاء

### المشكلة 1: "المستخدم غير موجود"
**السبب**: المستخدم لم يسجل في التطبيق أبداً  
**الحل**: 
1. سجل دخول في التطبيق أولاً
2. ثم نفذ SQL لإضافته كـ admin

### المشكلة 2: "still isAdmin = false"
**السبب**: لم يتم تسجيل خروج/دخول بعد التغيير  
**الحل**: 
1. سجل خروج كامل
2. أغلق التطبيق
3. افتح التطبيق وسجل دخول من جديد

### المشكلة 3: "Console shows userRole: null"
**السبب**: مشكلة في جلب البيانات من user_roles  
**الحل**: 
```sql
-- تحقق من RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- يجب أن يكون هناك policy للقراءة
```

### المشكلة 4: "الأزرار ما زالت لا تعمل"
**السبب**: مشكلة أخرى غير الصلاحيات  
**الحل**: 
1. افتح Console (F12)
2. ابحث عن أخطاء JavaScript
3. جرب الأزرار وشاهد الأخطاء
4. أرسل لقطة شاشة للخطأ

---

## 🎯 الملخص السريع

### الطريقة السريعة (30 ثانية):

```sql
-- 1. تشخيص
SELECT id FROM auth.users WHERE email = 'eng.khalid.work@gmail.com';

-- 2. إصلاح (استخدم الـ id من الخطوة 1)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 3. تحقق
SELECT role FROM user_roles 
WHERE user_id = 'USER_ID_HERE';
```

### ثم:
1. سجل خروج
2. سجل دخول
3. جرب الأزرار ✅

---

## 📞 إذا استمرت المشكلة

أرسل نتائج هذا الـ SQL:

```sql
-- معلومات كاملة للتشخيص
SELECT 
  'auth.users' as table_name,
  au.id,
  au.email,
  au.email_confirmed_at,
  NULL as role,
  NULL as full_name
FROM auth.users au
WHERE au.email = 'eng.khalid.work@gmail.com'

UNION ALL

SELECT 
  'user_roles' as table_name,
  ur.user_id as id,
  au.email,
  NULL as email_confirmed_at,
  ur.role,
  NULL as full_name
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com'

UNION ALL

SELECT 
  'profiles' as table_name,
  p.user_id as id,
  au.email,
  NULL as email_confirmed_at,
  NULL as role,
  p.full_name
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'eng.khalid.work@gmail.com';
```

---

**تاريخ الحل**: 16 أكتوبر 2025  
**الحالة**: ✅ جاهز للتطبيق

**بعد تنفيذ هذه الخطوات، جميع الأزرار ستعمل! 🚀**

