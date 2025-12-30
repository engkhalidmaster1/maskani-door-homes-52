# 🔴 حل مشكلة CORS - Edge Function غير منشور!

## ❌ الخطأ الحالي:

```
Access to fetch at 'https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/create-user' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

**السبب**: Edge Function غير منشور على Supabase!

---

## ✅ الحل (3 طرق):

### 🚀 الطريقة 1: استخدام السكريبت التلقائي (الأسهل)

افتح PowerShell **جديد** (كمسؤول) ونفذ:

```powershell
cd "d:\projects\sakani\‏‏sakani"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy-edge-function.ps1
```

السكريبت سيطلب منك:
1. الموافقة على تسجيل الدخول (سيفتح المتصفح)
2. لصق Project Reference ID (سيفتح الصفحة تلقائياً)

---

### 🛠️ الطريقة 2: تنفيذ يدوي (إذا لم تنجح الطريقة 1)

```powershell
# 1. تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل الدخول
supabase login

# 3. الحصول على Project ID
# افتح: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/settings/general
# انسخ "Reference ID"

# 4. ربط المشروع (استبدل YOUR_PROJECT_ID بالقيمة المنسوخة)
supabase link --project-ref YOUR_PROJECT_ID

# 5. نشر Edge Function
supabase functions deploy create-user

# 6. التحقق
supabase functions list
```

**ملاحظة**: Project ID المحتمل لك: `ugefzrktqeyspnzhxzzw` (من رابط الخطأ)

---

### 🌐 الطريقة 3: من Supabase Dashboard مباشرة

إذا كان لديك Supabase CLI مثبت مسبقاً:

1. افتح: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
2. اضغط **Deploy new function**
3. اختر **Upload from local**
4. أو استخدم CLI كما في الطريقة 2

---

## 🔍 كيف تعرف Project Reference ID:

### الطريقة السريعة:
من رابط الخطأ في Console، يظهر:
```
https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/create-user
```

Project ID هو: **`ugefzrktqeyspnzhxzzw`**

### الطريقة الرسمية:
1. افتح: https://supabase.com/dashboard
2. اختر مشروع "maskani"
3. اذهب إلى **Settings** → **General**
4. انسخ **Reference ID**

---

## ✅ بعد النشر:

1. أعد تحميل الصفحة: http://localhost:8082/admin/add-user
2. جرب إضافة مستخدم مرة أخرى
3. يجب أن يعمل بدون مشاكل!

---

## 🧪 اختبار سريع:

بعد نشر Edge Function، اختبر من Terminal:

```powershell
# اختبار Edge Function مباشرة
curl -X POST https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"role\":\"agent\"}'
```

يجب أن ترى:
```json
{"success": true, "user": {...}}
```

---

## 📊 ملخص الخطوات:

| الخطوة | الأمر | الحالة |
|--------|-------|--------|
| تثبيت CLI | `npm install -g supabase` | ⏳ معلق |
| تسجيل الدخول | `supabase login` | ⏳ معلق |
| ربط المشروع | `supabase link --project-ref ugefzrktqeyspnzhxzzw` | ⏳ معلق |
| نشر Function | `supabase functions deploy create-user` | ⏳ معلق |
| اختبار | فتح /admin/add-user | ⏳ معلق |

---

## 🚀 الأمر السريع (نسخ ولصق):

```powershell
npm install -g supabase; supabase login; supabase link --project-ref ugefzrktqeyspnzhxzzw; supabase functions deploy create-user
```

**بعد 5 دقائق، سيعمل النظام!** 🎉

---

## ❓ إذا استمرت المشكلة:

### خطأ: "supabase: command not found"
```powershell
npx supabase login
npx supabase link --project-ref ugefzrktqeyspnzhxzzw
npx supabase functions deploy create-user
```

### خطأ: "Failed to link project"
- تأكد من Project ID صحيح
- جرب تسجيل الدخول مرة أخرى: `supabase login`

### خطأ: "Permission denied"
- افتح PowerShell كمسؤول (Run as Administrator)
- أعد المحاولة

---

**الملخص**: Edge Function موجود في الكود لكن **غير منشور**. نفذ الأوامر أعلاه لنشره! 🚀
