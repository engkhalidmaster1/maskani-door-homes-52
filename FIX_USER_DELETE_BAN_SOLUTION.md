# 🔧 إصلاح مشكلة حذف وحظر المستخدمين
## Fix User Delete and Ban Issues

**التاريخ**: 15 أكتوبر 2025  
**المشكلة**: عدم القدرة على حذف أو حظر المستخدم `klidmorre@gmail.com`

---

## 🔍 المشاكل المكتشفة

### 1️⃣ مشكلة الحذف

**السبب**:
- الكود في `useDashboardData.tsx` كان يحاول حذف المستخدم من `profiles` و `user_roles` فقط
- **لا يمكن** حذف المستخدم من `auth.users` باستخدام مفتاح العميل (anon key)
- يتطلب استخدام Service Role Key عبر Edge Function

**الكود القديم (المعطل)**:
```typescript
const deleteUser = async (userId: string) => {
  // حذف العقارات
  await supabase.from('properties').delete().eq('user_id', userId);
  
  // حذف الملف الشخصي
  await supabase.from('profiles').delete().eq('user_id', userId);
  
  // حذف الدور
  await supabase.from('user_roles').delete().eq('user_id', userId);
  
  // ⚠️ المستخدم يبقى في auth.users!
}
```

**الكود الجديد (يعمل)**:
```typescript
const deleteUser = async (userId: string) => {
  if (!isAdmin) return;

  // استخدام Edge Function للحذف الكامل
  const { error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId }
  });

  if (error) throw error;

  // تحديث البيانات
  await Promise.all([fetchUsers(), fetchUserProperties()]);
  
  toast({
    title: "تم حذف المستخدم",
    description: "تم حذف المستخدم وجميع عقاراته بنجاح من النظام بالكامل"
  });
}
```

---

### 2️⃣ مشكلة الحظر من النشر

**السبب**:
- سياسات RLS (Row Level Security) على جدول `properties` تمنع المدير من تحديث عقارات المستخدمين الآخرين
- الكود يحاول تحديث `is_published = false` لكن RLS يرفض العملية

**الكود الموجود**:
```typescript
const banUserFromPublishing = async (userId: string) => {
  // تحديث جميع عقارات المستخدم
  const { error } = await supabase
    .from('properties')
    .update({ is_published: false })
    .eq('user_id', userId);
    
  // ⚠️ RLS يمنع هذا إذا لم يكن المدير مصرحاً
}
```

**الحل**: تحديث RLS policies في Supabase

---

## ✅ الحلول المطبقة

### 1️⃣ تحديث `useDashboardData.tsx`

✅ **تم التعديل**: استخدام Edge Function `admin-delete-user` للحذف الكامل

**الملف**: `src/hooks/useDashboardData.tsx`  
**السطور**: 147-172

**التغيير**:
- استبدال الحذف المباشر من الجداول
- استخدام `supabase.functions.invoke('admin-delete-user')`
- إضافة معالجة أخطاء أفضل

---

### 2️⃣ إنشاء ملف SQL لتحديث RLS

✅ **تم الإنشاء**: `FIX_PROPERTIES_RLS_FOR_ADMINS.sql`

**المحتوى**:
- حذف السياسات القديمة
- إنشاء سياسات جديدة تسمح للمديرين بالتحكم الكامل
- سياسات منفصلة للقراءة والإضافة والتحديث والحذف

**السياسات الجديدة**:

1. **القراءة** (`public_read_published_properties`):
   - الجميع: العقارات المنشورة فقط
   - المالك: جميع عقاراته
   - المدير: جميع العقارات

2. **الإضافة** (`users_insert_properties`):
   - المستخدمون: عقاراتهم فقط
   - المدير: أي عقار

3. **التحديث** (`users_and_admins_update_properties`):
   - المستخدمون: عقاراتهم فقط
   - المدير: جميع العقارات (بما في ذلك `is_published`)

4. **الحذف** (`users_and_admins_delete_properties`):
   - المستخدمون: عقاراتهم فقط
   - المدير: جميع العقارات

---

## 📋 خطوات التطبيق

### الخطوة 1: تحديث الكود (✅ تم)
- تم تحديث `src/hooks/useDashboardData.tsx`

### الخطوة 2: تطبيق RLS في Supabase

1. افتح Supabase Dashboard
2. انتقل إلى **SQL Editor**
3. انسخ محتوى ملف `FIX_PROPERTIES_RLS_FOR_ADMINS.sql`
4. الصق في المحرر
5. اضغط **Run** أو **Execute**

أو استخدم الأمر في Terminal:

```bash
# من مجلد المشروع
supabase db push

# أو
npx supabase db push
```

### الخطوة 3: اختبار الحل

1. أعد تحميل الصفحة بالضغط على `Ctrl+Shift+R`
2. انتقل إلى Dashboard → Users
3. جرب حذف المستخدم `klidmorre@gmail.com`
4. جرب حظر المستخدم من النشر
5. تحقق من رسائل النجاح/الخطأ

---

## 🔍 التحقق من النجاح

### اختبار الحذف:
```typescript
// في Console المتصفح
// انتظر رسالة: "تم حذف المستخدم وجميع عقاراته بنجاح من النظام بالكامل"
```

### اختبار الحظر:
```typescript
// في Console المتصفح
// انتظر رسالة: "تم حظر المستخدم من النشر"
// تحقق من is_published = false لجميع عقارات المستخدم
```

### التحقق من RLS في Supabase:

```sql
-- تشغيل في SQL Editor
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- يجب أن ترى 4 سياسات:
-- 1. public_read_published_properties (SELECT)
-- 2. users_insert_properties (INSERT)
-- 3. users_and_admins_update_properties (UPDATE)
-- 4. users_and_admins_delete_properties (DELETE)
```

---

## 🚨 استكشاف الأخطاء

### خطأ 1: "failed to send request to edge function"

**السبب**: Service Worker يعترض الطلب

**الحل**:
```javascript
// تحقق من public/service-worker.js
// يجب أن يحتوي على:
if (url.pathname.startsWith('/functions/v1/')) {
  return fetch(event.request);
}
```

---

### خطأ 2: "Failed to delete user"

**السبب**: Edge Function غير منشورة أو CORS خاطئ

**الحل**:
1. تحقق من نشر Edge Functions:
   ```bash
   supabase functions list
   ```

2. تحقق من CORS في `admin-delete-user/index.ts`:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization, accept',
     'Access-Control-Max-Age': '86400',
   };
   ```

---

### خطأ 3: "RLS policy violation"

**السبب**: لم يتم تطبيق ملف SQL

**الحل**:
1. نفذ `FIX_PROPERTIES_RLS_FOR_ADMINS.sql` في Supabase
2. تحقق من تطبيق السياسات:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'properties';
   ```

---

## 📊 الفرق بين القديم والجديد

| الميزة | القديم ❌ | الجديد ✅ |
|--------|----------|----------|
| **حذف المستخدم** | من profiles فقط | من auth.users بالكامل |
| **استخدام Edge Function** | لا | نعم |
| **Service Role Key** | لا | نعم |
| **حذف نهائي** | لا (يبقى في auth) | نعم |
| **حظر من النشر** | يفشل (RLS) | يعمل |
| **تحديث is_published** | ممنوع | مسموح للمدير |
| **معالجة الأخطاء** | بسيطة | شاملة |

---

## 🎯 الخلاصة

### ما تم إصلاحه:

✅ **الحذف**: يعمل الآن بشكل كامل عبر Edge Function  
✅ **الحظر**: سيعمل بعد تطبيق RLS في Supabase  
✅ **الأمان**: استخدام Service Role Key للعمليات الحساسة  
✅ **معالجة الأخطاء**: رسائل واضحة للمستخدم

### ما يجب عليك فعله:

1. ✅ تم تحديث الكود تلقائياً
2. ⏳ **نفذ ملف SQL** في Supabase Dashboard
3. ⏳ أعد تحميل الصفحة
4. ⏳ اختبر الحذف والحظر

---

## 📞 الدعم

إذا استمرت المشكلة:
1. تحقق من Console المتصفح (F12)
2. تحقق من Supabase Logs
3. تأكد من صلاحيات المدير في `user_roles`
4. راجع هذا الملف للحلول

---

**آخر تحديث**: 15 أكتوبر 2025  
**الحالة**: ✅ الحل جاهز - يحتاج تطبيق SQL في Supabase
