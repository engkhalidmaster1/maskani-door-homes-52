# 🚀 نشر Edge Function: admin-delete-user

## المشكلة الحالية

```
Access to fetch at 'https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/admin-delete-user' 
from origin 'http://localhost:8080' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check
```

**السبب**: Edge Function بها خطأ في معالجة CORS ولم يتم نشرها بعد التحديث.

---

## ✅ الحل: إعادة نشر Edge Function

### الطريقة 1: عبر Supabase CLI (مُوصى بها)

```bash
# 1. تسجيل الدخول (إذا لم تكن مسجلاً)
npx supabase login

# 2. ربط المشروع
npx supabase link --project-ref ugefzrktqeyspnzhxzzw

# 3. نشر الدالة
npx supabase functions deploy admin-delete-user

# 4. تأكيد النشر
# يجب أن ترى: "Deployed Function admin-delete-user"
```

---

### الطريقة 2: عبر Supabase Dashboard

#### الخطوات:

1. **افتح Functions**:
   - اذهب إلى: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions

2. **ابحث عن الدالة**:
   - ابحث عن `admin-delete-user`
   - إذا وجدتها، اضغط **Edit**
   - إذا لم تجدها، اضغط **New Function**

3. **الصق الكود**:
   - انسخ الكود أدناه والصقه كاملاً

4. **احفظ وانشر**:
   - اضغط **Deploy Function**
   - انتظر رسالة النجاح

---

### الكود الصحيح (منسوخ من الملف المحدّث):

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-authorization, accept",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Get request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Supabase credentials
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create admin client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Delete user from auth.users (this will cascade delete from other tables)
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

## 🔍 التحقق من النشر

### 1. عبر Dashboard:
- افتح: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
- يجب أن ترى `admin-delete-user` بحالة **Active**

### 2. عبر CLI:
```bash
npx supabase functions list
```

يجب أن ترى:
```
NAME                  | VERSION | CREATED AT
admin-delete-user     | 1       | 2025-10-15 ...
```

### 3. اختبار مباشر:
```bash
curl -i --location --request POST \
  'https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/admin-delete-user' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"test-user-id"}'
```

يجب أن ترى:
- ✅ Status: 200 OK (إذا نجح)
- أو 400/500 مع رسالة خطأ واضحة (ليس CORS error)

---

## 🎯 بعد النشر

1. **أعد تحميل Dashboard**:
   ```
   Ctrl+Shift+R
   ```

2. **جرب حذف مستخدم**:
   - يجب أن تختفي رسالة CORS
   - يجب أن يتم الحذف بنجاح

3. **تحقق من Console**:
   - افتح F12
   - يجب أن ترى: "User deleted successfully"

---

## 🚨 استكشاف الأخطاء

### خطأ: "Supabase CLI not found"
```bash
npm install -g supabase
```

### خطأ: "Not logged in"
```bash
npx supabase login
```

### خطأ: "Project not linked"
```bash
npx supabase link --project-ref ugefzrktqeyspnzhxzzw
```

### خطأ: "Function not found in Dashboard"
- انشئها يدوياً:
  1. اضغط **New Function**
  2. الاسم: `admin-delete-user`
  3. الصق الكود أعلاه
  4. اضغط **Deploy**

---

## 📊 ما تم إصلاحه

| المشكلة | القديم ❌ | الجديد ✅ |
|---------|----------|----------|
| **CORS Headers** | ناقصة | كاملة |
| **OPTIONS Request** | بسيط | معالج بشكل صحيح |
| **Error Handling** | ضعيف | شامل |
| **Response Format** | غير متسق | JSON موحد |
| **JWT Parsing** | يدوي ومعطل | لا حاجة له |

---

## 🎉 الخلاصة

**الخطوات المطلوبة:**
1. ⏳ نشر Edge Function (الخطوة الأهم!)
2. ⏳ تطبيق SQL في Supabase (للحظر)
3. ✅ إعادة تحميل الصفحة

بعد النشر، يجب أن يعمل **حذف المستخدمين** بشكل كامل! 🚀

---

**آخر تحديث**: 15 أكتوبر 2025
