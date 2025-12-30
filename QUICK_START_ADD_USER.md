# ✅ نظام إضافة المستخدمين - جاهز للتشغيل

## 📦 ما تم إنجازه

### ✅ الملفات التي تم إنشاؤها:
1. **`supabase/functions/create-user/index.ts`** - Edge Function كاملة لإضافة المستخدمين
2. **`EDGE_FUNCTION_SETUP.md`** - دليل الإعداد المفصّل
3. **`ADD_USER_COMPLETE.md`** - ملخص سريع ونقاط الاختبار

### ✅ الكود الجاهز:
- صفحة `/admin/add-user` جاهزة ومتصلة بالـ Edge Function
- معالجة كاملة للأخطاء والنجاح
- دعم جميع الأدوار (admin, office, agent, publisher)

---

## 🚀 خطوات التشغيل (5 دقائق)

### 1️⃣ تثبيت Supabase CLI

```powershell
npm install -g supabase
```

### 2️⃣ تسجيل الدخول

```powershell
supabase login
```

ستفتح صفحة متصفح لتسجيل الدخول.

### 3️⃣ ربط المشروع

احصل على Project Reference ID من:
- **Supabase Dashboard** → **Settings** → **General** → **Reference ID**

```powershell
cd d:\projects\sakani\‏‏sakani
supabase link --project-ref YOUR_PROJECT_REF_ID
```

### 4️⃣ نشر الـ Function

```powershell
supabase functions deploy create-user
```

النتيجة المتوقعة:
```
Deploying function create-user...
Function URL: https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user
Deployed successfully ✓
```

### 5️⃣ اختبار من الواجهة

1. شغّل المشروع المحلي: `npm run dev`
2. سجّل دخول كمدير (eng.khalid.work@gmail.com)
3. اذهب إلى: http://localhost:8080/admin/add-user
4. املأ النموذج وأنشئ مستخدم تجريبي

---

## 📋 معلومات الأدوار

| الدور | العقارات | الصور/عقار | المميزة | المساحة |
|------|---------|-----------|---------|---------|
| 👤 **ناشر** | 20 | 10 | 2 | 2 GB |
| 🏠 **وكيل** | 100 | 20 | 10 | 10 GB |
| 🏢 **مكتب** | ∞ | ∞ | 50 | ∞ |
| 👑 **مدير** | ∞ | ∞ | ∞ | ∞ |

---

## 🧪 الاختبار

### اختبار سريع من PowerShell:

```powershell
$url = "https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    email = "test@example.com"
    password = "Test123!"
    full_name = "Test User"
    role = "agent"
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
```

### النتيجة المتوقعة:

```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "full_name": "Test User",
    "role": "agent"
  }
}
```

---

## 🔍 استكشاف الأخطاء

### ❌ خطأ: "Project not linked"

```powershell
supabase link --project-ref YOUR_PROJECT_ID
```

### ❌ خطأ: "Not authenticated"

```powershell
supabase logout
supabase login
```

### ❌ خطأ: "فشل إنشاء المستخدم"

عرض logs:
```powershell
supabase functions logs create-user
```

### ❌ خطأ: "403 Forbidden" من الواجهة

تأكد من:
1. أنك مسجل دخول كمدير
2. أن الـ Function تم نشرها بنجاح

---

## 📊 مراقبة الـ Function

### عرض logs مباشر:

```powershell
supabase functions logs create-user --follow
```

### عرض آخر 50 استدعاء:

```powershell
supabase functions logs create-user --limit 50
```

### في Supabase Dashboard:

**Functions** → **create-user** → **Logs**

---

## 🔄 التحديثات المستقبلية

لتحديث الـ Function بعد تعديل `index.ts`:

```powershell
supabase functions deploy create-user
```

---

## ✅ قائمة التحقق النهائية

- [ ] تثبيت Supabase CLI
- [ ] تسجيل الدخول (`supabase login`)
- [ ] ربط المشروع (`supabase link`)
- [ ] نشر الـ Function (`supabase functions deploy create-user`)
- [ ] اختبار من الواجهة (http://localhost:8080/admin/add-user)
- [ ] التحقق من إنشاء المستخدم في Supabase Dashboard → Authentication → Users
- [ ] التحقق من الصلاحيات في جدول `user_permissions`

---

## 📚 ملفات مرجعية

- [`supabase/functions/create-user/index.ts`](supabase/functions/create-user/index.ts) - كود Edge Function
- [`EDGE_FUNCTION_SETUP.md`](EDGE_FUNCTION_SETUP.md) - دليل مفصّل
- [`ADD_USER_COMPLETE.md`](ADD_USER_COMPLETE.md) - ملخص وتوثيق
- [`src/pages/AdminAddUser.tsx`](src/pages/AdminAddUser.tsx) - صفحة إضافة المستخدم

---

## 🎯 الخطوات التالية

بعد نشر الـ Function واختبارها:

1. ✅ إضافة مستخدمين جدد من `/admin/add-user`
2. ✅ تعيين الأدوار من `/admin/users`
3. ✅ مراقبة نشاط المستخدمين
4. ✅ تعديل الصلاحيات من Dashboard

---

**ملاحظة مهمة:** Edge Function تستخدم Service Role Key المحفوظ في Supabase فقط - لا يظهر أبداً في الكود الأمامي. هذا أعلى مستوى من الأمان.

---

**🎉 تهانينا!** نظام إضافة المستخدمين جاهز للعمل بشكل كامل.
