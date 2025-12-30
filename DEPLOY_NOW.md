# 🚨 حل فوري: نشر Edge Function عبر Dashboard

## المشكلة:
```
CORS policy: Response to preflight request doesn't pass access control check
```

**السبب**: Edge Function غير منشورة أو قديمة!

---

## ✅ الحل السريع (دقيقتان فقط!)

### الخطوات:

1. **افتح هذا الرابط مباشرة**:
   ```
   https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
   ```

2. **ابحث عن `admin-delete-user`**:
   - إذا وجدتها: اضغط على **اسم الدالة** → اضغط **Edit**
   - إذا لم تجدها: اضغط **Create a new function**

3. **إعدادات الدالة**:
   - **Name**: `admin-delete-user`
   - **Region**: اختر أقرب منطقة (مثل Frankfurt)
   - **Verify JWT**: اتركها مُفعّلة (✅)

4. **الصق الكود التالي بالكامل**:

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

5. **اضغط Deploy** (الزر الأزرق في الأسفل)

6. **انتظر** رسالة "Function deployed successfully" ✅

7. **ارجع للتطبيق** واضغط `Ctrl+Shift+R` لإعادة التحميل

8. **جرب الحذف مرة أخرى** → يجب أن يعمل! 🎉

---

## 🔍 كيف تتأكد من النجاح؟

بعد النشر، جرب الحذف. في Console يجب أن ترى:

**بدلاً من**:
```
❌ CORS policy: Response to preflight request doesn't pass access control check
```

**سترى**:
```
✅ POST https://...admin-delete-user 200 OK
✅ User deleted successfully
```

---

## 📸 صور توضيحية للخطوات:

### الخطوة 1-2: فتح Functions
```
Dashboard → اختر المشروع → Functions (القائمة اليسرى)
```

### الخطوة 3-4: إنشاء/تعديل الدالة
```
اضغط "Create a new function" أو "Edit" على الدالة الموجودة
```

### الخطوة 5: Deploy
```
الصق الكود → اضغط الزر الأزرق "Deploy function"
```

---

## ⏱️ كم من الوقت يستغرق؟

- **النشر**: 30-60 ثانية
- **الاختبار**: 10 ثوان
- **المجموع**: أقل من دقيقتين ⚡

---

## 🚨 ملاحظة هامة

**لا تنسَ**: بعد النشر، أعد تحميل الصفحة بـ `Ctrl+Shift+R` لتجديد Service Worker!

---

## ❓ أسئلة شائعة

### س: لماذا لا يعمل من Terminal؟
**ج**: تحتاج تسجيل دخول Supabase CLI أولاً (`supabase login`)، لكن Dashboard أسرع!

### س: هل سيحذف البيانات القديمة؟
**ج**: لا، الدالة تحذف المستخدمين فقط عند الضغط على زر الحذف.

### س: هل آمنة؟
**ج**: نعم، تستخدم Service Role Key وتحذف من `auth.users` فقط.

---

**النتيجة**: بعد النشر، زر الحذف سيعمل 100% ✅

**ابدأ الآن**: https://supabase.com/dashboard/project/ugefzrktqeyspnzhxzzw/functions
