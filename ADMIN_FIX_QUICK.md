# ⚡ حل سريع: تفعيل صلاحيات المدير

## 🎯 المشكلة
**المستخدم**: `eng.khalid.work@gmail.com`  
**الأعراض**: لا يمكنه استخدام أزرار الإجراءات أو تغيير الصلاحيات

## 🔧 الحل (3 دقائق)

### 1. افتح Supabase SQL Editor
```
https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw
→ SQL Editor → New Query
```

### 2. الصق هذا الكود
```sql
-- إضافة المستخدم كمدير
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eng.khalid.work@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود! سجل في التطبيق أولاً';
  END IF;

  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';

  RAISE NOTICE '✅ تم بنجاح!';
END $$;
```

### 3. تحقق
```sql
SELECT email, role 
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE email = 'eng.khalid.work@gmail.com';
```

**يجب أن ترى**: `role: admin` ✅

### 4. في التطبيق
1. **سجل خروج**
2. **سجل دخول مرة أخرى**
3. **افتح Console (F12)**
4. ابحث عن: `Auth state:`
5. **يجب أن ترى**: `isAdmin: true` ✅

### 5. اختبر
- اذهب لـ Dashboard → المستخدمون
- جرب الأزرار → يجب أن تعمل ✅

---

## 📄 الملفات الكاملة

- **`ADMIN_FIX_GUIDE.md`**: دليل تفصيلي شامل
- **`MAKE_ADMIN.sql`**: سكريبت SQL جاهز

---

## ⚠️ إذا لم يعمل

### السيناريو 1: "المستخدم غير موجود"
**الحل**: سجل في التطبيق أولاً، ثم نفذ SQL

### السيناريو 2: "ما زال لا يعمل بعد SQL"
**الحل**: سجل خروج كامل، أغلق التطبيق، افتحه وسجل دخول

### السيناريو 3: "Console يظهر isAdmin: false"
**الحل**: 
```sql
-- تحقق من البيانات
SELECT * FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'eng.khalid.work@gmail.com'
);
```

---

**بعد تنفيذ هذه الخطوات، كل شيء سيعمل! 🚀**

