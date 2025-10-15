# 🚀 تعليمات سريعة: إصلاح حذف وحظر المستخدمين

## ⚡ التطبيق السريع (3 دقائق)

### ⚠️ المشكلة الحالية:
```
CORS policy: Response to preflight request doesn't pass access control check
Failed to send a request to the Edge Function
```

**السبب**: Edge Function `admin-delete-user` غير منشورة أو قديمة!

---

### 🎯 الحل السريع (افتح هذا الملف): `DEPLOY_NOW.md`

**أو اتبع هذه الخطوات:**

1. **افتح**: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
2. **ابحث عن** `admin-delete-user` (أو أنشئها)
3. **الصق الكود** من `supabase/functions/admin-delete-user/index.ts`
4. **اضغط Deploy**
5. **أعد تحميل** Dashboard (`Ctrl+Shift+R`)
6. **جرب الحذف** → يجب أن يعمل! ✅

📄 **للتفاصيل الكاملة**: افتح `DEPLOY_NOW.md`

---

### 1️⃣ نشر Edge Function (⏳ **مطلوب أولاً - انظر DEPLOY_NOW.md**)

**افتح Terminal في مجلد المشروع واكتب:**

```bash
# تسجيل الدخول إلى Supabase (إذا لم تكن مسجلاً)
npx supabase login

# ربط المشروع (استبدل project-ref برقم مشروعك)
npx supabase link --project-ref ugefzrktqeyspnzhxzzw

# نشر Edge Function
npx supabase functions deploy admin-delete-user
```

**أو عبر Supabase Dashboard:**
1. افتح https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
2. اضغط **Deploy new function**
3. اختر `admin-delete-user`
4. الصق الكود من `supabase/functions/admin-delete-user/index.ts`
5. اضغط **Deploy**

---

### 2️⃣ الكود (✅ تم تلقائياً)
لا حاجة لعمل شيء - تم تحديث الكود تلقائياً.

---

### 2️⃣ الكود (✅ تم تلقائياً)
لا حاجة لعمل شيء - تم تحديث الكود تلقائياً.

**التحديثات:**
- ✅ `src/hooks/useDashboardData.tsx` - استخدام Edge Function
- ✅ `supabase/functions/admin-delete-user/index.ts` - إصلاح CORS

---

### 3️⃣ قاعدة البيانات (⏳ مطلوب منك)

**انسخ والصق في Supabase SQL Editor:**

```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "admin_all_properties" ON properties;
DROP POLICY IF EXISTS "admin_full_control_properties" ON properties;
DROP POLICY IF EXISTS "users_insert_own_properties" ON properties;
DROP POLICY IF EXISTS "users_update_own_properties" ON properties;
DROP POLICY IF EXISTS "users_delete_own_properties" ON properties;

-- سياسة القراءة
CREATE POLICY "public_read_published_properties"
ON properties FOR SELECT
USING (
  is_published = true
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- سياسة الإضافة
CREATE POLICY "users_insert_properties"
ON properties FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- سياسة التحديث (الأهم!)
CREATE POLICY "users_and_admins_update_properties"
ON properties FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- سياسة الحذف
CREATE POLICY "users_and_admins_delete_properties"
ON properties FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- تفعيل RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

**الخطوات:**
1. افتح https://supabase.com/dashboard
2. اختر مشروعك
3. SQL Editor من القائمة الجانبية
4. الصق الكود أعلاه
5. اضغط Run/Execute
6. انتظر رسالة النجاح ✅

---

### 4️⃣ الاختبار

1. **تأكد من نشر Edge Function** (الخطوة 1)
2. أعد تحميل صفحة Dashboard (`Ctrl+Shift+R`)
3. انتقل إلى قسم Users
4. جرب حذف مستخدم → يجب أن يعمل ✅
5. جرب حظر مستخدم → يجب أن يعمل ✅ (بعد تطبيق SQL)

---

## 🎯 ماذا يفعل هذا الإصلاح؟

### قبل الإصلاح ❌:
- الحذف: يحذف من profiles فقط، المستخدم يبقى في النظام
- الحظر: يفشل بسبب RLS

### بعد الإصلاح ✅:
- الحذف: حذف كامل من auth.users عبر Edge Function
- الحظر: يعمل - المدير يمكنه تحديث is_published لأي عقار

---

## 🔍 التحقق من النجاح

في SQL Editor، نفذ:

```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'properties' 
ORDER BY cmd;
```

يجب أن ترى:
- ✅ users_and_admins_delete_properties (DELETE)
- ✅ users_insert_properties (INSERT)
- ✅ public_read_published_properties (SELECT)
- ✅ users_and_admins_update_properties (UPDATE)

---

## 📞 مشاكل؟

### لم يحذف المستخدم:
- تحقق من Console (F12)
- تأكد من نشر Edge Function: `admin-delete-user`
- تحقق من صلاحياتك كمدير

### لم يحظر المستخدم:
- تأكد من تنفيذ SQL أعلاه
- أعد تحميل الصفحة (Ctrl+Shift+R)
- تحقق من RLS: `SELECT * FROM pg_policies WHERE tablename = 'properties';`

---

**آخر تحديث**: 15 أكتوبر 2025
