# 📋 دليل سريع: أيقونات إدارة المستخدمين
## Quick Reference Guide

---

## 🎯 صفحة إدارة المستخدمين (UsersManagement.tsx)

### المسار: `/admin/users`

### الأيقونات المتاحة:

| الأيقونة | الوظيفة | الكود | الملاحظات |
|---------|---------|------|-----------|
| 🔑 | تغيير كلمة المرور | `handleOpenPasswordDialog(user)` | يفتح نافذة حوار لتغيير كلمة المرور |
| 📧 | إرسال رابط إعادة تعيين | `handleSendResetEmail(user)` | يرسل بريد إلكتروني للمستخدم |
| 🗑️ | حذف المستخدم | `handleDeleteUser(user)` | حذف نهائي مع رسالة تأكيد |
| 🔄 | تحديث القائمة | `fetchUsers()` | إعادة تحميل البيانات |
| 🔍 | البحث | - | البحث بالبريد أو الاسم أو ID |

---

## 🎮 مكون إجراءات المستخدم (UserActions.tsx)

### المسار: `src/components/Dashboard/UserActions.tsx`

### الأيقونات المتاحة:

| الأيقونة | الوظيفة | الكود | الملاحظات |
|---------|---------|------|-----------|
| 👁️ | عرض التفاصيل | `handleViewUser()` | يعرض معلومات المستخدم وعقاراته |
| ✏️ | تعديل الدور | `handleEditUser()` | تغيير من مدير إلى مستخدم أو العكس |
| 🚫 | حظر من النشر | `handleBanUser()` | إخفاء جميع عقارات المستخدم |
| 🔓 | إلغاء الحظر | `handleUnbanUser()` | نشر جميع عقارات المستخدم |
| 🗑️ | حذف المستخدم | `handleDeleteUser()` | حذف نهائي للمستخدم وعقاراته |

---

## 🔧 Edge Functions

### 1. admin-list-users
```typescript
// الاستدعاء
const { data, error } = await supabase.functions.invoke('admin-list-users', { 
  body: {} 
});

// النتيجة
{ users: User[] }
```

### 2. admin-update-password
```typescript
// الاستدعاء
const { error } = await supabase.functions.invoke('admin-update-password', {
  body: { userId: 'xxx', newPassword: 'xxx' }
});

// النتيجة
{ success: true, user: User }
```

### 3. admin-delete-user
```typescript
// الاستدعاء
const { error } = await supabase.functions.invoke('admin-delete-user', {
  body: { userId: 'xxx' }
});

// النتيجة
{ success: true }
```

---

## 🎨 الألوان والأنماط

### الأزرار:
- **تغيير كلمة المرور**: تدرج برتقالي/عنبري
- **إرسال رابط**: أزرق فاتح
- **حذف**: أحمر (destructive)
- **حظر**: برتقالي
- **إلغاء الحظر**: أخضر
- **عرض**: رمادي (outline)
- **تعديل**: رمادي (outline)

### الشارات (Badges):
- **ناشر**: أزرق 📝
- **مالك موثوق**: أخضر 🏆
- **مكلف بالنشر**: بنفسجي 🏢
- **صاحب مكتب**: برتقالي 👔

---

## ✅ قائمة التحقق السريعة

### قبل الاستخدام:
- [ ] تأكد من صلاحيات المدير
- [ ] تأكد من عمل Edge Functions
- [ ] تأكد من تفعيل CORS

### عند استخدام تغيير كلمة المرور:
- [ ] كلمة المرور ≥ 6 أحرف
- [ ] التأكيد يطابق كلمة المرور
- [ ] المستخدم موجود

### عند استخدام الحذف:
- [ ] قراءة رسالة التحذير
- [ ] التأكيد النهائي
- [ ] لا يمكن التراجع

---

## 🔐 الأمان

### الصلاحيات:
- ✅ جميع العمليات تتطلب صلاحيات المدير
- ✅ Edge Functions تستخدم Service Role Key
- ✅ رسائل تأكيد قبل العمليات الخطرة

### RLS:
- ✅ تفعيل RLS على جميع الجداول
- ✅ سياسات الأمان للمديرين فقط
- ✅ عدم السماح بالوصول المباشر

---

## 🐛 استكشاف الأخطاء

### خطأ 403:
- تحقق من صلاحيات المدير
- تحقق من RLS
- استخدم Edge Functions

### خطأ CORS:
- تحقق من headers في Edge Functions
- تأكد من bypass في service worker
- أعد تحميل الصفحة (Ctrl+Shift+R)

### خطأ "failed to send request":
- تحقق من service worker
- تحقق من Edge Function deployment
- تحقق من CORS headers

---

## 📞 للمساعدة

راجع التقرير الشامل: `USERS_ACTIONS_REPORT.md`

---

**آخر تحديث**: 15 أكتوبر 2025
**الحالة**: ✅ جميع الأيقونات تعمل بشكل كامل
