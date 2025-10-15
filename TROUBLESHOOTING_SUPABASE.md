# حل مشكلة Failed to fetch (api.supabase.com)

## التشخيص الأولي ✅
- الاتصال بالإنترنت: يعمل بشكل طبيعي
- خوادم Supabase: متاحة وتستجيب
- التطبيق المحلي: يعمل على المنفذ 8081

## الأسباب المحتملة والحلول:

### 1. مشكلة CORS (الأكثر شيوعاً)
**الحل:**
- اذهب إلى لوحة تحكم Supabase: https://supabase.com/dashboard
- اختر مشروعك
- اذهب إلى Settings > API
- في قسم "Site URL" تأكد من إضافة:
  - `http://localhost:8081`
  - `http://127.0.0.1:8081`
  - `http://192.168.1.223:8081`

### 2. مفاتيح API منتهية الصلاحية
**التحقق:**
- في لوحة تحكم Supabase > Settings > API
- تأكد من أن Anon/Public key صحيح
- قارنه بالمفتاح في الملف `src/integrations/supabase/client.ts`

### 3. مشكلة في الشبكة المحلية
**الحل:**
- جرب إعادة تشغيل المودم/الراوتر
- جرب استخدام VPN مؤقتاً للاختبار
- تأكد من عدم وجود حجب للموقع

### 4. مشكلة في المتصفح
**الحل:**
- امسح cache المتصفح
- جرب في نافذة خاصة/incognito
- عطل extension المتصفح مؤقتاً
- جرب متصفح آخر

### 5. إعدادات RLS غير صحيحة
**التحقق:**
- تأكد من تفعيل جدول notifications في Supabase
- تأكد من تشغيل SQL setup script

## الخطوات الفورية:

1. **تحقق من Site URL في Supabase:**
   ```
   Dashboard > Settings > API > Site URL
   أضف: http://localhost:8081
   ```

2. **تحقق من المفاتيح:**
   ```
   نسخ Anon key من Supabase
   قارنه بالمفتاح في client.ts
   ```

3. **اختبر بمتصفح آخر:**
   ```
   Chrome → Firefox
   أو جرب Incognito mode
   ```

4. **تحقق من Console:**
   ```
   اضغط F12
   تحقق من أخطاء Network tab
   ```

## اختبار الاتصال:
افتح Developer Tools (F12) وجرب هذا الكود في Console:

```javascript
fetch('https://ugefzrktqeyspnzhxzzw.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWZ6cmt0cWV5c3Buemh4enp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTI2NTIsImV4cCI6MjA3MTcyODY1Mn0.vVGtBuwYN1tSviYCLxbZpUnl7S6peZrtLAhyd7BnxVs'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

إذا نجح هذا الاختبار، المشكلة في التطبيق. إذا فشل، المشكلة في الشبكة أو إعدادات Supabase.