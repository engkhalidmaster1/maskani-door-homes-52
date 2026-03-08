

# خطة المصادقة الثنائية عبر واتساب (WhatsApp OTP 2FA)

## ملخص
إضافة طبقة أمان ثانية بعد تسجيل الدخول: إرسال رمز OTP من 6 أرقام عبر WhatsApp Cloud API، مع خيار تذكر الجهاز لمدة 30 يوم.

## ملاحظات مهمة قبل البدء
- لا يوجد حالياً عمود `whatsapp_number` في جدول `profiles` -- سنضيفه
- لا توجد edge function لإرسال واتساب -- سننشئها من الصفر
- نحتاج إضافة **سرّين** جديدين: `WHATSAPP_ACCESS_TOKEN` و `WHATSAPP_PHONE_NUMBER_ID`

---

## المراحل

### 1. إضافة الأسرار (Secrets)
- `WHATSAPP_ACCESS_TOKEN` -- توكن Meta Business API
- `WHATSAPP_PHONE_NUMBER_ID` -- معرف رقم الهاتف

### 2. هجرة قاعدة البيانات (Migration)
- إضافة عمود `whatsapp_number` (text, nullable) لجدول `profiles`
- إنشاء جدول `otp_codes`:
  - `id`, `user_id`, `code` (مشفر), `expires_at` (5 دقائق), `attempts` (default 0, max 3), `verified`, `created_at`
  - RLS: المستخدم يقرأ سجلاته فقط
- إنشاء جدول `trusted_devices`:
  - `id`, `user_id`, `device_hash`, `expires_at` (30 يوم), `created_at`
  - RLS: المستخدم يقرأ/يحذف سجلاته فقط
- دالة `check_trusted_device(p_user_id uuid, p_device_hash text)` -- SECURITY DEFINER
- دالة `cleanup_expired_otps()` لحذف الرموز المنتهية

### 3. Edge Function: `send-otp-whatsapp`
- `verify_jwt = false` في config.toml، مع تحقق يدوي بـ `getClaims()`
- الخطوات:
  1. استخراج `user_id` من JWT
  2. جلب `whatsapp_number` من `profiles`
  3. إذا لا يوجد رقم → إرجاع `{ skip: true }`
  4. توليد رمز عشوائي 6 أرقام
  5. حذف أي OTP سابق لنفس المستخدم
  6. حفظ الرمز في `otp_codes` (مع تشفير)
  7. إرسال عبر Meta Graph API كرسالة نصية:
     ```
     POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
     { messaging_product: "whatsapp", to: whatsapp_number, type: "text", text: { body: "رمز التحقق: 123456" } }
     ```

### 4. Edge Function: `verify-otp`
- `verify_jwt = false` في config.toml
- يستقبل: `code`, `device_hash` (اختياري), `remember_device` (boolean)
- يتحقق من الرمز + عدد المحاولات (max 3) + الصلاحية (5 دقائق)
- إذا صحيح: `verified = true`
- إذا `remember_device`: حفظ في `trusted_devices` (30 يوم)

### 5. تعديل `useAuth.tsx`
- إضافة حالات: `needsOtp`, `otpUserId`
- تعديل `signIn`:
  - بعد النجاح، فحص `trusted_devices` عبر استدعاء DB
  - إذا الجهاز موثوق → سلوك عادي
  - إذا لا → فحص وجود `whatsapp_number`
    - إذا لا يوجد رقم → سلوك عادي (بدون OTP)
    - إذا يوجد → `needsOtp = true`، استدعاء `send-otp-whatsapp`
- تصدير دوال `verifyOtp()` و `resendOtp()`

### 6. شاشة OTP جديدة في `Login.tsx`
- عرض مشروط بناءً على `needsOtp`
- استخدام مكون `InputOTP` الموجود (6 خانات)
- عداد تنازلي (5 دقائق)
- زر "إعادة إرسال" (متاح بعد 60 ثانية)
- خيار "تذكر هذا الجهاز" (checkbox)
- بناء `device_hash` من: `navigator.userAgent + screen.width + screen.height + navigator.language` → SHA-256

### 7. تحديث `config.toml`
```toml
[functions.send-otp-whatsapp]
verify_jwt = false

[functions.verify-otp]
verify_jwt = false
```

---

## تدفق العملية
```text
بريد + كلمة مرور → Supabase signIn
    ↓ نجاح
فحص trusted_devices (device_hash)
    ├─ موثوق → دخول مباشر
    └─ غير موثوق → فحص whatsapp_number
        ├─ لا يوجد رقم → دخول مباشر
        └─ يوجد رقم → send-otp-whatsapp → شاشة OTP
            ├─ رمز صحيح + تذكر → حفظ جهاز + دخول
            ├─ رمز صحيح → دخول
            └─ رمز خاطئ (3 محاولات) → قفل مؤقت
```

## الملفات المتأثرة
| ملف | نوع التغيير |
|---|---|
| Migration SQL | جديد (3 جداول + دوال) |
| `supabase/functions/send-otp-whatsapp/index.ts` | جديد |
| `supabase/functions/verify-otp/index.ts` | جديد |
| `supabase/config.toml` | تعديل |
| `src/hooks/useAuth.tsx` | تعديل (إضافة OTP flow) |
| `src/pages/Auth/Login.tsx` | تعديل (إضافة شاشة OTP) |
| `src/utils/deviceFingerprint.ts` | جديد |

