

# خطة فحص وإصلاح لوحة التحكم `/dashboard`

---

## العيوب المكتشفة

### 1. عدم تطابق التبويبات بين المكونات (مشكلة حرجة)
- **DashboardTabs.tsx** (شريط التبويبات العلوي) لا يحتوي على تبويبات: `properties-management`, `edit-properties` — لكن `renderTabContent` في Dashboard.tsx يتوقعها
- **DashboardSidebar.tsx** يحتوي على تبويبات غير موجودة في `renderTabContent`: `users-view`, `subscribers` — ستظهر شاشة فارغة عند الضغط عليها
- التبويبات `properties-management` و `edit-properties` لا يمكن الوصول إليهما من أي مكان في الواجهة

### 2. تكرار المحتوى (properties vs properties-management)
- تبويب `properties` و `properties-management` يعرضان تقريباً نفس الجدول
- `properties-management` يضيف فقط أزرار العمليات المجمعة — يمكن دمجهما

### 3. DashboardSidebar غير مستخدم
- `DashboardSidebar.tsx` موجود لكن `Dashboard.tsx` لا يستخدمه — يستخدم فقط `DashboardTabs`
- يحتوي على تبويبات قديمة/غير متطابقة

### 4. استخدام `confirm()` و `alert()` بدل مكونات UI
- `Dashboard.tsx` سطر 99, 208, 243: `confirm()` — قبيح وغير متناسق مع التصميم
- `BroadcastNotification.tsx` سطر 46, 48: `alert()` — نفس المشكلة

### 5. الدالتان `handleBulkPublish/handleBulkUnpublish/handleBulkDelete` معرّفة قبل `useAuth()`
- سطر 40-125: هذه الدوال تستخدم `userProperties`, `togglePropertyPublication`, `logPropertyAction` التي تُعرّف لاحقاً (سطر 127-141)
- JavaScript hoisting يسمح بذلك لكنه anti-pattern يصعب القراءة والصيانة

### 6. `deleteProperty` مكرر
- `useDashboardData` يُصدّر `deleteProperty` (مع optimistic delete)
- `useProperties` يُصدّر `deleteProperty` أيضاً
- `Dashboard.tsx` يستخدم الاثنين بشكل مختلط — `togglePropertyPublication` من `useProperties` و `deleteProperty` من `useDashboardData` (ضمنياً عبر `handleDeleteProperty`)

### 7. نظرة عامة تعرض 5 بطاقات stats لكن الخامسة غير موجودة
- `grid-cols-5` لكن فقط 4 بطاقات — يترك فراغاً في الشبكة

### 8. `useDashboardData` يجلب البيانات بطريقة غير فعالة
- 3 طلبات متتالية لجلب المستخدمين (profiles + properties user_id + user_roles)
- يمكن استخدام view `users_with_permissions` الموجود مسبقاً

---

## خطة الإصلاح

### الإصلاح 1: توحيد التبويبات (DashboardTabs.tsx)
- إضافة التبويبات الناقصة: `properties-management` (دمجها مع `properties`)، `edit-properties`
- أو الأفضل: **دمج** `properties` + `properties-management` + `edit-properties` في تبويب واحد "العقارات" مع أزرار العمليات المجمعة
- إزالة التبويبات الميتة

### الإصلاح 2: إصلاح شبكة نظرة عامة
- تغيير `grid-cols-5` إلى `grid-cols-4` (أو إضافة بطاقة خامسة: نسبة النشر)

### الإصلاح 3: نقل bulk handlers بعد تعريف hooks
- نقل `handleBulkPublish`, `handleBulkUnpublish`, `handleBulkDelete` إلى ما بعد تعريف جميع الـ hooks

### الإصلاح 4: استبدال `confirm()` و `alert()` بـ AlertDialog و toast
- استبدال 3 `confirm()` في Dashboard.tsx بـ `AlertDialog`
- استبدال `alert()` في BroadcastNotification.tsx بـ `toast()`

### الإصلاح 5: تنظيف DashboardSidebar
- إزالة التبويبات الميتة (`users-view`, `subscribers`) أو إزالة الملف بالكامل إن كان غير مستخدم

### الإصلاح 6: إضافة بطاقة "نسبة النشر" في نظرة عامة
- بطاقة خامسة تعرض `stats.publishRate`% مع أيقونة `TrendingUp`

---

## الملفات المتأثرة
- `src/pages/Dashboard.tsx` — نقل handlers، دمج تبويبات العقارات، إصلاح grid، استبدال confirm
- `src/components/Dashboard/DashboardTabs.tsx` — إزالة/إضافة تبويبات لتطابق renderTabContent
- `src/components/Dashboard/BroadcastNotification.tsx` — استبدال alert بـ toast
- `src/components/Dashboard/DashboardSidebar.tsx` — تنظيف التبويبات الميتة
- `src/hooks/useDashboardNav.ts` — تنظيف التبويبات المحذوفة من القائمة

