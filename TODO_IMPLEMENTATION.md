# ✅ قائمة المهام - تطبيق النظام الموحد
## Todo List - Implementation Checklist

---

## 📋 المهام المطلوبة منك

### ☐ **0. فحص سريع: هل نُفذ Migration؟** (30 ثانية) ⚠️ **ابدأ من هنا!**

**الخطوات:**
1. افتح Supabase SQL Editor
2. افتح الملف: `CHECK_MIGRATION_STATUS.sql`
3. انسخ كامل المحتوى
4. الصقه في SQL Editor
5. اضغط **"Run"**

**النتيجة المتوقعة:**
- إذا رأيت `✅ Migration نُفذ بنجاح!` → **انتقل للخطوة 2** (تعيين مدير)
- إذا رأيت `❌ Migration لم يُنفذ بعد!` → **انتقل للخطوة 1** (تنفيذ Migration)

---

### ☐ **1. تنفيذ Migration في Supabase** (5 دقائق)

**⚠️ نفذ هذه الخطوة فقط إذا أظهر الفحص السريع أن Migration غير منفذ**

**الخطوات:**
1. افتح https://supabase.com/dashboard
2. اختر مشروعك: maskani-door-homes-52
3. اذهب إلى: SQL Editor
4. افتح الملف: `supabase/migrations/20251017000000_unified_permissions_system.sql`
5. انسخ **كل المحتوى** (450+ سطر)
6. الصقه في SQL Editor
7. اضغط **"Run"** أو Ctrl+Enter
8. انتظر حتى ترى: ✅ Success

**النتيجة المتوقعة:**
```
Success. No rows returned
NOTICE:  ✅ Unified Permissions System Created Successfully!
NOTICE:  📊 Roles Available:
NOTICE:     - admin: مدير النظام (غير محدود)
NOTICE:     - office: مكتب عقارات (غير محدود عقارات، 10 صور)
...
```

---

### ☐ **2. تعيين نفسك كمدير** (2 دقيقة)

**الخطوات:**
1. افتح الملف: `MAKE_ADMIN_UNIFIED.sql`
2. **استبدل** جميع مواضع `'eng.khalid.work@gmail.com'` بـ إيميلك الفعلي
3. انسخ المحتوى المعدل
4. الصقه في Supabase SQL Editor
5. اضغط **"Run"**

**النتيجة المتوقعة:**
```
NOTICE:  ✅ تم تعيين YOUR_EMAIL كمدير النظام!
NOTICE:  User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTICE:  🔑 الصلاحيات: غير محدودة في كل شيء
```

---

### ☐ **3. التحقق من نجاح العملية** (1 دقيقة)

**الاستعلام:**
```sql
SELECT 
  email,
  role,
  role_name_ar,
  properties_limit,
  images_limit,
  status_indicator
FROM users_with_permissions
WHERE email = 'YOUR_EMAIL@example.com'; -- ضع إيميلك هنا
```

**النتيجة الصحيحة:**
```
email: your@email.com
role: admin
role_name_ar: 🔑 مدير النظام
properties_limit: -1 (غير محدود)
images_limit: -1 (غير محدود)
status_indicator: 🔑 غير محدود
```

---

### ☐ **4. تسجيل دخول جديد** (1 دقيقة)

**الخطوات:**
1. افتح التطبيق (http://localhost:8081)
2. سجل خروج (Logout)
3. سجل دخول مرة أخرى
4. اضغط F12 لفتح Console
5. ابحث عن رسالة: `"Auth state:"`

**النتيجة الصحيحة:**
```javascript
Auth state: {
  user: "your@email.com",
  userRole: "admin",
  isAdmin: true,
  isLoading: false
}
```

---

### ☐ **5. اختبار الصلاحيات** (3 دقائق)

#### **أ. اختبار Dashboard:**
- افتح: http://localhost:8081/admin/users أو /users-view
- يجب أن ترى جميع المستخدمين ✅
- يجب أن ترى أزرار التحكم (تعديل، حظر، حذف) ✅

#### **ب. اختبار ترقية مستخدم:**
في Supabase SQL Editor:
```sql
-- اختر أي مستخدم للاختبار
SELECT update_user_role(
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'agent' -- جرب: publisher, agent, office
);
```

#### **ج. تحقق من View:**
```sql
SELECT * FROM users_with_permissions
ORDER BY role, properties_count DESC
LIMIT 10;
```

---

### ☐ **6. (اختياري) تشغيل الاختبارات الشاملة** (5 دقائق)

**الملف:** `TEST_UNIFIED_PERMISSIONS.sql`

**الاستخدام:**
- افتحه واختر أي اختبار
- نفذه في SQL Editor
- تحقق من النتائج

**الاختبارات المهمة:**
```sql
-- 1. فحص توزيع الأدوار
SELECT role, role_name_ar, COUNT(*) 
FROM users_with_permissions 
GROUP BY role, role_name_ar;

-- 2. فحص المستخدمين القريبين من الحد
SELECT email, role_name_ar, properties_count, properties_limit, status_indicator
FROM users_with_permissions
WHERE role NOT IN ('admin', 'office')
  AND properties_count >= properties_limit * 0.8;

-- 3. فحص نقل البيانات
SELECT 
  'user_roles' as source, COUNT(*) FROM user_roles
UNION ALL
SELECT 'user_permissions (NEW)', COUNT(*) FROM user_permissions;
```

---

## ⚠️ إذا واجهت مشاكل

### **المشكلة 1: "relation user_permissions does not exist"**
**الحل:** لم تنفذ Migration - ارجع للخطوة 1

---

### **المشكلة 2: "isAdmin: false في Console"**
**الحل:** 
```sql
-- تأكد من تعيين نفسك كمدير
SELECT role FROM user_permissions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');

-- إذا لم يكن 'admin'، نفذ:
UPDATE user_permissions 
SET role = 'admin', 
    limits = '{"properties":-1,"images_per_property":-1,"featured_properties":-1,"storage_mb":-1}'::jsonb
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
```

---

### **المشكلة 3: "لا أرى المستخدمين في Dashboard"**
**الحل:**
1. تأكد من تسجيل دخول جديد
2. افحص Console بحثاً عن errors
3. تحقق من RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'user_permissions';
```

---

### **المشكلة 4: "Cannot add property - limit reached"**
**الحل:**
```sql
-- تحقق من حدودك
SELECT * FROM get_user_limits();

-- إذا كنت admin ولا زلت محدوداً:
UPDATE user_permissions 
SET limits = '{"properties":-1,"images_per_property":-1,"featured_properties":-1,"storage_mb":-1}'::jsonb
WHERE user_id = auth.uid();
```

---

## 📞 للمساعدة

راجع الملفات:
- ✅ `UNIFIED_PERMISSIONS_GUIDE.md` - دليل شامل
- ✅ `UNIFIED_IMPLEMENTATION_SUMMARY.md` - ملخص
- ✅ `TEST_UNIFIED_PERMISSIONS.sql` - اختبارات

---

## ✅ بعد الانتهاء

### **تم بنجاح إذا:**
- ☑ Migration نُفذ بدون أخطاء
- ☑ أنت مدير (role = 'admin')
- ☑ Console يظهر isAdmin: true
- ☑ تستطيع رؤية Dashboard
- ☑ View يعرض البيانات بشكل صحيح
- ☑ يمكنك ترقية المستخدمين

### **التالي:**
- 🎯 جرب ترقية بعض المستخدمين
- 🎯 اختبر حظر/إلغاء حظر
- 🎯 راجع الإحصائيات في View
- 🎯 ابدأ في تطوير ميزات جديدة!

---

**🎉 بالتوفيق!**
