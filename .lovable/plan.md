

# إنشاء صفحة "توثيق التطوير" لنظام WhatsApp OTP 2FA

## الهدف
إنشاء صفحة توثيق تطوير مستقلة تشرح خطة المصادقة الثنائية عبر واتساب بالتفصيل، دون تطبيق أي كود فعلي للميزة.

## الملفات

### 1. `src/pages/DevDocumentation.tsx` (جديد)
صفحة توثيق تطوير تحتوي على:
- **نظرة عامة**: شرح الفكرة وتدفق العملية
- **هيكل قاعدة البيانات**: جداول `otp_codes`, `trusted_devices`, `whatsapp_config` مع أعمدتها وسياسات RLS
- **Edge Functions**: وصف `send-otp-whatsapp` و `verify-otp` مع المدخلات والمخرجات
- **تعديلات الواجهة الأمامية**: `useAuth`, `Login.tsx`, `deviceFingerprint`
- **مخطط التدفق**: رسم نصي لتسلسل العمليات
- **الأسرار المطلوبة**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- **حالة التنفيذ**: قائمة بما تم وما لم يتم بعد

التصميم: استخدام Card, Badge, Accordion من المكونات الموجودة، بتنسيق RTL عربي.

### 2. `src/App.tsx` (تعديل)
- إضافة route: `/dev-docs` → lazy load `DevDocumentation`
- داخل `AppLayout` مع `ProtectedRoute`

### 3. `src/components/Dashboard/DashboardSidebar.tsx` (تعديل)
- إضافة رابط "توثيق التطوير" في قسم جديد أو ضمن قسم الإعدادات مع أيقونة `BookOpen`

