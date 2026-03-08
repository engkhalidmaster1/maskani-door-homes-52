

# تقرير فحص النظام الشامل - تطبيق سكني

---

## الملخص التنفيذي

بعد فحص شامل للكود المصدري وقاعدة البيانات والأمان، النظام يعمل بشكل جيد لكن يحتاج إصلاحات في **3 مجالات حرجة** قبل الإنتاج.

---

## 1. مشاكل أمنية حرجة (أولوية قصوى)

### 1.1 جداول بدون RLS (5 جداول مكشوفة)
الجداول التالية ليس لديها Row-Level Security مفعّل، أي مستخدم يمكنه قراءة/تعديل/حذف البيانات:
- `backup_logs`
- `home_cards`
- `home_page_settings`
- `system_alerts`
- `system_metrics`

**الإصلاح:** تفعيل RLS على كل جدول مع إضافة سياسات مناسبة (قراءة عامة + تعديل للمدير فقط).

### 1.2 كشف بيانات auth.users
الـ view `users_with_permissions` يكشف بيانات من `auth.users` مباشرة عبر PostgREST. هذا خطر أمني كبير.

**الإصلاح:** تحويل الـ view إلى `SECURITY INVOKER` أو استخدام RPC function بدلاً منه.

### 1.3 Security Definer View
الـ view `users_with_permissions` معرّف بـ `SECURITY DEFINER`، مما يجعل RLS يعمل بصلاحيات مالك الـ view وليس المستخدم الحالي.

### 1.4 سياسات RLS متساهلة
- `office_contact_requests`: INSERT بـ `WITH CHECK (true)` - أي شخص يستطيع إدراج بيانات
- `office_reviews`: INSERT بـ `WITH CHECK (true)` - نفس المشكلة
- `property_documents`: INSERT يسمح لأي مستخدم مسجّل

### 1.5 دوال بدون search_path ثابت (~45 دالة)
جميع الدوال تقريباً لا تحدد `search_path`، مما يفتح باب هجمات search_path injection.

### 1.6 إعدادات Auth ضعيفة
- OTP expiry طويل جداً
- حماية كلمات المرور المسربة معطّلة
- نسخة Postgres تحتاج تحديث أمني

---

## 2. مشاكل بنية البيانات (تناقض الأدوار)

### المشكلة الجوهرية
يوجد **نظامان متوازيان** للأدوار يتعارضان:

```text
جدول user_roles  → enum app_role  → ('admin', 'user')           ← نظامان فقط
جدول user_permissions → enum user_role_type → ('admin', 'office', 'agent', 'publisher') ← 4 أدوار
```

الكود يستخدم النظام الرباعي (`admin/office/agent/publisher`) في كل مكان، لكن `user_roles` يقبل فقط `admin` أو `user`.

**الإصلاح المقترح:**
- توحيد على `user_permissions` كجدول رئيسي للأدوار (وهو الحال فعلاً في معظم الكود)
- تحديث `app_role` enum لتشمل الأدوار الأربعة، أو إزالة الاعتماد على `user_roles` تماماً
- تحديث `handle_new_user()` trigger ليستخدم `user_permissions` بدلاً من `user_roles`

---

## 3. مشاكل الكود والصفحات

### 3.1 ملف غير ضروري
- `src/pages/PropertyDetails.tsx.new` - ملف مؤقت يجب حذفه

### 3.2 صفحة UserRolesAudit تستخدم النظام القديم
تعرض فقط `admin` و `user` بينما النظام الفعلي يستخدم 4 أدوار.

### 3.3 adminUserService.ts - createUserSimple
يسجّل المستخدم عبر `supabase.auth.signUp` من الكلاينت، مما يعني:
- يتم تسجيل خروج المدير الحالي عند إنشاء مستخدم جديد
- الحل الصحيح: استخدام Edge Function فقط (`create-user`) مع `admin.createUser`

### 3.4 Edge Function create-user
يستخدم `listUsers()` للتحقق من وجود المستخدم - هذا غير فعال مع عدد كبير من المستخدمين. الأفضل محاولة الإنشاء مباشرة والتعامل مع خطأ التكرار.

### 3.5 console.log في الإنتاج
`useAuth.tsx` يحتوي على عدة `console.log` يجب إزالتها أو تحويلها لـ debug mode فقط.

---

## 4. خطة الإصلاح المقترحة

### المرحلة 1: إصلاحات أمنية عاجلة (migration واحدة)
1. تفعيل RLS على الجداول الخمسة المكشوفة
2. إضافة سياسات RLS مناسبة (قراءة عامة لـ home_cards/home_page_settings، مدير فقط للباقي)
3. إصلاح `users_with_permissions` view
4. إضافة `SET search_path = public` لجميع الدوال

### المرحلة 2: توحيد نظام الأدوار (migration + كود)
1. تحديث `app_role` enum لتشمل `('admin', 'office', 'agent', 'publisher')`
2. تحديث `handle_new_user()` trigger ليضيف في `user_permissions` بدور `publisher`
3. تحديث RLS policies التي تستخدم `user_roles` لتستخدم `user_permissions` بدلاً منها
4. إصلاح صفحة `UserRolesAudit.tsx`

### المرحلة 3: تنظيف الكود
1. حذف `PropertyDetails.tsx.new`
2. إزالة `createUserSimple` والاعتماد على Edge Function فقط
3. إزالة console.log من الإنتاج
4. تحسين Edge Function `create-user` (إزالة listUsers)

### المرحلة 4: تفعيل إعدادات Auth
1. تقليل OTP expiry
2. تفعيل حماية كلمات المرور المسربة
3. ترقية Postgres (من لوحة تحكم Supabase)

---

## 5. ملخص الأولويات

| الأولوية | المهمة | التأثير | الوقت |
|---------|--------|---------|-------|
| حرج | تفعيل RLS على 5 جداول | أمان | رسالة واحدة |
| حرج | إصلاح users_with_permissions view | أمان | رسالة واحدة |
| عالي | توحيد نظام الأدوار | استقرار | 2-3 رسائل |
| عالي | إضافة search_path للدوال | أمان | رسالة واحدة |
| متوسط | تنظيف الكود | جودة | رسالة واحدة |
| متوسط | إعدادات Auth | أمان | يدوي من Dashboard |

---

هل تريد البدء بتنفيذ هذه الإصلاحات؟ أقترح البدء بالمرحلة 1 (الأمان) ثم المرحلة 2 (توحيد الأدوار) لأنهما الأكثر تأثيراً على جاهزية النظام للعمل.

