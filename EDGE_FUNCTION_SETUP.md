# 🚀 إعداد Supabase Edge Function لإضافة المستخدمين

## المشكلة
- لا يمكن إضافة مستخدمين جدد من الواجهة الأمامية مباشرة لأسباب أمنية
- خطأ 403: "User not allowed" عند استخدام `supabase.auth.admin.createUser`

## الحل
استخدام **Supabase Edge Function** مع Service Role Key للإضافة الآمنة

---

## 📋 خطوات الإعداد

### 1. تثبيت Supabase CLI (إذا لم يكن مثبتاً)

**Windows (PowerShell):**
```powershell
# باستخدام Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# أو باستخدام npm
npm install -g supabase
```

**تحقق من التثبيت:**
```powershell
supabase --version
```

### 2. تسجيل الدخول إلى Supabase
```powershell
supabase login
```

### 3. ربط المشروع المحلي مع Supabase
```powershell
# في مجلد المشروع
cd d:\projects\sakani\‏‏sakani

# ربط المشروع (استخدم Project ID من Supabase Dashboard)
supabase link --project-ref YOUR_PROJECT_ID
```

**للحصول على Project ID:**
- افتح Supabase Dashboard
- Settings → General → Reference ID

### 4. نشر الـ Function
```powershell
# نشر function واحدة
supabase functions deploy create-user

# أو نشر جميع الـ functions
supabase functions deploy
```

### 5. الحصول على رابط الـ Function
بعد النشر، ستحصل على رابط مثل:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user
```

احفظ هذا الرابط لاستخدامه في الواجهة الأمامية.

---

## 🔧 تحديث متغيرات البيئة

أضف الرابط في ملف `.env` أو `.env.local`:

```env
VITE_SUPABASE_CREATE_USER_FUNCTION_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user
```

---

## 🧪 اختبار الـ Function

### من Terminal/PowerShell:
```powershell
# اختبار إنشاء مستخدم
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"full_name\":\"Test User\",\"role\":\"agent\"}'
```

### من JavaScript (الواجهة الأمامية):
```typescript
const response = await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!',
    full_name: 'Test User',
    role: 'agent'
  })
});

const data = await response.json();
console.log(data);
```

---

## 📝 البيانات المطلوبة

### مطلوب:
- `email` (string): البريد الإلكتروني
- `password` (string): كلمة المرور

### اختياري:
- `full_name` (string): الاسم الكامل
- `phone` (string): رقم الهاتف
- `role` (string): الدور - افتراضي `publisher`
  - `admin` - مدير النظام
  - `office` - مكتب عقاري
  - `agent` - وكيل عقاري
  - `publisher` - ناشر عقارات

---

## 🔒 الأمان

- ✅ Service Role Key محفوظ في Supabase فقط (لا يظهر في الواجهة الأمامية)
- ✅ CORS مفعّل للسماح بالاستدعاء من الواجهة الأمامية
- ✅ التحقق من البيانات قبل الإنشاء
- ✅ حذف تلقائي للمستخدم إذا فشل إضافة الصلاحيات

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

### خطأ: "Function deployment failed"
تحقق من:
1. صحة ملف `index.ts`
2. صحة `deno.json` أو `supabase/config.toml`
3. اتصال الإنترنت

### عرض logs الـ Function:
```powershell
supabase functions logs create-user
```

---

## 📊 مراقبة الـ Function

في Supabase Dashboard:
- Functions → create-user → Logs
- شاهد الاستدعاءات والأخطاء مباشرة

---

## 🔄 تحديث الـ Function

بعد تعديل `index.ts`:
```powershell
supabase functions deploy create-user
```

---

## ✅ النتيجة المتوقعة

عند نجاح الإضافة:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "User Name",
    "role": "agent"
  }
}
```

عند الفشل:
```json
{
  "error": "رسالة الخطأ هنا"
}
```

---

## 📚 مراجع

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**ملاحظة:** بعد نشر الـ Function، حدّث ملف `AdminAddUser.tsx` لاستدعاء الرابط الجديد.
