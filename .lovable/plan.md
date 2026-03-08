

# خطة توحيد نظام إدارة المستخدمين والصلاحيات

## المشكلة الحالية

يوجد **5 واجهات مختلفة** تدير المستخدمين بطرق متضاربة، و**3 جداول صلاحيات** متداخلة:

```text
الواجهات المتكررة:
├── /admin/users         (AdminUsers.tsx - 770 سطر)
├── /users-view          (UsersView.tsx - 702 سطر)
├── Dashboard → users    (UsersTable.tsx - 532 سطر)
├── Dashboard → roles    (UserRolesManagement.tsx - 466 سطر)
└── /admin/subscribers   (Subscribers.tsx - بيانات مكررة)

جداول الصلاحيات المتداخلة:
├── user_permissions  ← المصدر الرئيسي (admin/office/agent/publisher)
├── user_roles        ← قديم (admin/user فقط)
└── user_statuses     ← مكرر (publisher/trusted_owner/office_agent)
```

مشاكل إضافية:
- `useDashboardData` يجلب من `profiles + user_roles` (قديم) بدلاً من `user_permissions`
- `rbacManager.ts` نظام RBAC في الذاكرة لا يتصل بقاعدة البيانات
- كل واجهة لها منطق جلب وتحديث مختلف

## الحل: توحيد كل شيء في صفحة واحدة

### 1. حذف الصفحات المكررة
- **حذف** `src/pages/UsersView.tsx` — مكرر مع AdminUsers
- **حذف** `src/pages/Subscribers.tsx` — بيانات مكررة
- **حذف** `src/components/Dashboard/UsersTable.tsx` — سيُستبدل
- **حذف** `src/components/Dashboard/UserRolesManagement.tsx` — سيدمج في الصفحة الموحدة

### 2. إعادة كتابة `AdminUsers.tsx` كصفحة موحدة (~400 سطر بدلاً من 770)
الصفحة الجديدة ستحتوي على:
- **إحصائيات** باستخدام `UsersStats` الموجود
- **فلاتر** باستخدام `UsersFilters` الموجود  
- **عرض جدول/شبكة** مع تبديل (يستخدم `UserCard` للشبكة)
- **إجراءات موحدة**: عرض تفاصيل، تعديل (اسم/هاتف/عنوان/دور)، حظر/إلغاء، حذف
- **ترقيم صفحات**
- مصدر بيانات واحد: `get_users_for_admin_v2` RPC

### 3. تحديث Dashboard ليوجه لصفحة المستخدمين
- تبويب "users" في Dashboard → `navigate('/admin/users')` بدلاً من عرض مكون مدمج
- تبويب "user-roles" → يُدمج في صفحة المستخدمين (تغيير الدور من الجدول مباشرة)
- إزالة تبويب "user-roles" من Sidebar و Tabs

### 4. تحديث `useDashboardData.tsx`
- إزالة منطق جلب المستخدمين (لم يعد مطلوباً في Dashboard)
- الإبقاء على جلب العقارات والإحصائيات فقط

### 5. تحديث المسارات في `App.tsx`
- إبقاء `/admin/users` → `AdminUsers` الجديد
- حذف `/users-view` و `/admin/subscribers`
- إبقاء `/admin/add-user`

### 6. تنظيف `rbacManager.ts`
- لا حذف (قد يكون مستخدماً في أماكن أخرى)، لكن إضافة تعليق أنه غير فعّال حالياً

## الملفات المتأثرة

| ملف | تغيير |
|---|---|
| `src/pages/AdminUsers.tsx` | إعادة كتابة - موحد ومبسط |
| `src/pages/UsersView.tsx` | حذف |
| `src/pages/Subscribers.tsx` | حذف |
| `src/components/Dashboard/UsersTable.tsx` | حذف |
| `src/components/Dashboard/UserRolesManagement.tsx` | حذف |
| `src/pages/Dashboard.tsx` | تعديل - إزالة تبويبات المستخدمين المدمجة |
| `src/components/Dashboard/DashboardSidebar.tsx` | تعديل - توجيه تبويب users لصفحة خارجية |
| `src/components/Dashboard/DashboardTabs.tsx` | تعديل - إزالة تبويب user-roles |
| `src/hooks/useDashboardData.tsx` | تعديل - تبسيط |
| `src/App.tsx` | تعديل - حذف مسارات مكررة |
| `src/config/routes.tsx` | تعديل - حذف مسار subscribers |

## النتيجة
- صفحة واحدة `/admin/users` تدير كل شيء
- مصدر بيانات واحد (`user_permissions` عبر RPC)
- كود أقل بـ ~1500 سطر
- لا تكرار في المنطق

