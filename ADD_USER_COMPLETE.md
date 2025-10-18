# ✅ ملخص إعداد نظام إضافة المستخدمين

## 📁 الملفات التي تم إنشاؤها

1. **`supabase/functions/create-user/index.ts`** - Edge Function لإضافة المستخدمين بأمان
2. **`EDGE_FUNCTION_SETUP.md`** - دليل إعداد Edge Function كامل

## 🚀 خطوات التشغيل السريع

### 1. تثبيت Supabase CLI
```powershell
# باستخدام npm
npm install -g supabase

# تحقق من التثبيت
supabase --version
```

### 2. تسجيل الدخول وربط المشروع
```powershell
# تسجيل دخول
supabase login

# ربط المشروع (احصل على PROJECT_ID من Supabase Dashboard > Settings > General)
supabase link --project-ref YOUR_PROJECT_ID
```

### 3. نشر الـ Function
```powershell
# من مجلد المشروع
cd d:\projects\sakani\‏‏sakani

# نشر function
supabase functions deploy create-user
```

### 4. اختبار الـ Function
```powershell
# اختبار سريع
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"full_name\":\"Test User\",\"role\":\"agent\"}'
```

### 5. تحديث متغير البيئة (اختياري)
أضف في `.env` أو `.env.local`:
```env
VITE_SUPABASE_FUNCTION_CREATE_USER=https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user
```

---

## ✅ ما تم إنجازه

### الكود الموجود حالياً
- ✅ صفحة `AdminAddUser.tsx` جاهزة لاستدعاء Edge Function
- ✅ النموذج يتضمن: email, password, full_name, phone, role
- ✅ معالجة الأخطاء والنجاح موجودة
- ✅ التوجيه التلقائي لصفحة `/admin/users` بعد النجاح

### Edge Function
- ✅ إنشاء المستخدم باستخدام Service Role Key
- ✅ تأكيد البريد الإلكتروني تلقائياً
- ✅ إضافة صلاحيات حسب الدور في `user_permissions`
- ✅ حذف تلقائي للمستخدم إذا فشل إضافة الصلاحيات
- ✅ CORS مفعّل للاستدعاء من الواجهة الأمامية
- ✅ معالجة الأخطاء الكاملة

---

## 🎯 الأدوار المدعومة

| الدور | العقارات | الصور/عقار | المميزة | التخزين |
|------|---------|-----------|---------|---------|
| 👤 ناشر (publisher) | 20 | 10 | 2 | 2 GB |
| 🏠 وكيل (agent) | 100 | 20 | 10 | 10 GB |
| 🏢 مكتب (office) | ∞ | ∞ | 50 | ∞ |
| 👑 مدير (admin) | ∞ | ∞ | ∞ | ∞ |

---

## 🔐 الأمان

- ✅ Service Role Key محفوظ في Supabase فقط (لا يظهر في الكود الأمامي)
- ✅ استخدام Authorization header من الجلسة الحالية
- ✅ التحقق من البيانات قبل الإنشاء
- ✅ حماية ضد SQL Injection (Supabase client محمي)

---

## 🧪 اختبار النظام

### من الواجهة الأمامية:
1. سجل دخول كمدير (eng.khalid.work@gmail.com)
2. اذهب إلى http://localhost:8080/admin/add-user
3. املأ النموذج:
   - البريد: `test@example.com`
   - كلمة المرور: `Test123!`
   - الاسم: `Test User`
   - الدور: اختر أي دور
4. اضغط "إنشاء مستخدم جديد"
5. يجب أن تظهر رسالة نجاح وتوجيه لصفحة `/admin/users`

### من التيرمنال (PowerShell):
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_ANON_KEY"
}

$body = @{
    email = "test2@example.com"
    password = "Test123!"
    full_name = "Test User 2"
    role = "agent"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user" -Method Post -Headers $headers -Body $body
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Project not linked"
```powershell
supabase link --project-ref YOUR_PROJECT_ID
```

### خطأ: "Not authenticated"
```powershell
supabase login
```

### خطأ: "فشل إنشاء المستخدم"
- تحقق من أن الـ Function تم نشرها: `supabase functions list`
- راجع logs: `supabase functions logs create-user`
- تحقق من صحة البيانات المرسلة

### خطأ: "403 Forbidden"
- تأكد من أنك مسجل دخول كمدير
- تحقق من Authorization header

---

## 📊 عرض Logs

```powershell
# عرض logs آخر 100 استدعاء
supabase functions logs create-user --limit 100

# عرض logs مباشر (real-time)
supabase functions logs create-user --follow
```

---

## 🔄 تحديث الـ Function

بعد تعديل `supabase/functions/create-user/index.ts`:
```powershell
supabase functions deploy create-user
```

---

## 📚 ملفات مرجعية

- [`EDGE_FUNCTION_SETUP.md`](EDGE_FUNCTION_SETUP.md) - دليل إعداد مفصل
- [`supabase/functions/create-user/index.ts`](supabase/functions/create-user/index.ts) - كود الـ Function
- [`src/pages/AdminAddUser.tsx`](src/pages/AdminAddUser.tsx) - صفحة إضافة المستخدم

---

## ✅ الخطوة التالية

بعد نشر الـ Function واختبارها، يمكنك:
1. إضافة مستخدمين جدد من `/admin/users` → "إضافة مستخدم جديد"
2. تعيين الأدوار المناسبة لكل مستخدم
3. مراقبة المستخدمين من صفحة إدارة المستخدمين

---

**نصيحة:** احفظ رابط الـ Function في متغير بيئة لسهولة التحديث لاحقاً.
