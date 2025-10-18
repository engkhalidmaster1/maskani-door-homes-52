# إعداد Supabase Edge Function لإضافة المستخدمين

## الخطوة 1: نشر الـ Function في Supabase

### أ. تثبيت Supabase CLI (إذا لم يكن مثبتاً)
```powershell
# Windows (PowerShell)
scoop install supabase
# أو
npm install -g supabase
```

### ب. تسجيل الدخول إلى Supabase
```powershell
supabase login
```

### ج. ربط المشروع
```powershell
# من مجلد المشروع
cd d:\projects\sakani\‏‏sakani
supabase link --project-ref YOUR_PROJECT_REF
```
**ملاحظة:** احصل على `YOUR_PROJECT_REF` من لوحة تحكم Supabase (Settings > General > Reference ID)

### د. نشر الـ Function
```powershell
supabase functions deploy create-user
```

---

## الخطوة 2: الحصول على رابط الـ Function

بعد النشر، احصل على الرابط من:
- Supabase Dashboard → Edge Functions → create-user
- الرابط سيكون مثل: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-user`

---

## الخطوة 3: تحديث ملف البيئة

أضف الرابط في ملف `.env.local` أو `.env`:

```env
VITE_SUPABASE_FUNCTION_CREATE_USER=https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-user
```

---

## الخطوة 4: إعادة تشغيل المشروع

```powershell
npm run dev
```

---

## الاختبار

1. افتح: http://localhost:8080/admin/add-user
2. املأ البيانات:
   - البريد الإلكتروني
   - كلمة المرور
   - الاسم الكامل
   - رقم الهاتف
   - الدور (admin/office/agent/publisher)
3. اضغط "إنشاء حساب"
4. يجب أن يظهر إشعار نجاح وتتم إضافة المستخدم

---

## استكشاف الأخطاء

### خطأ 403 (Forbidden)
- تأكد من نشر الـ Function بنجاح
- تأكد من أن Service Role Key موجود في Supabase (يُضاف تلقائياً)

### خطأ CORS
- الـ Function تدعم CORS بالفعل في الكود
- تأكد من نشر آخر إصدار

### خطأ في الصلاحيات
- تأكد من وجود جدول `user_permissions` في قاعدة البيانات
- نفّذ `RESTORE_AND_PROTECT_ADMIN.sql` إذا لم تفعل

---

## الأمان

✅ **Service Role Key** محفوظ في Supabase ولا يُرسل للواجهة الأمامية
✅ **Edge Function** تعمل على خوادم Supabase فقط
✅ **CORS** مفعّل للسماح بالاستدعاء من الواجهة
✅ **التحقق** من البيانات يتم في الـ Function

---

## ملاحظات

- الـ Function تُنشئ المستخدم وتضيف صلاحياته تلقائياً
- إذا فشل إنشاء الصلاحيات، يُحذف المستخدم تلقائياً (Rollback)
- المستخدم الجديد يُنشأ مع `email_confirm: true` (لا يحتاج تأكيد بريد)
- يمكن تعديل الصلاحيات الافتراضية في كود الـ Function

---

## بديل: لوحة تحكم Supabase (مؤقت)

إذا لم تستطع نشر الـ Function الآن، أضف المستخدمين مؤقتاً من:
- Supabase Dashboard → Authentication → Users → Add User
- ثم أضف صلاحياتهم يدوياً في جدول `user_permissions`
