# 🎯 ملخص سريع: نظام الصلاحيات في Maskani

> **آخر تحديث:** 17 أكتوبر 2025

---

## 📌 نظامان منفصلان

### 1️⃣ `user_roles` - الأدوار الإدارية
```
┌─────────┬──────────────────────────┐
│ الدور   │ الصلاحيات               │
├─────────┼──────────────────────────┤
│ admin   │ ✅ صلاحيات كاملة        │
│ user    │ ⚪ صلاحيات محدودة        │
└─────────┴──────────────────────────┘
```

### 2️⃣ `user_statuses` - الحالات والحدود
```
┌──────────────┬─────────┬─────────┬──────────┐
│ الحالة       │ عقارات │ صور    │ موثوق    │
├──────────────┼─────────┼─────────┼──────────┤
│ publisher    │    1    │    2    │    ❌    │
│ trusted_owner│    5    │    5    │    ✅    │
│ office_agent │   999   │    7    │    ✅    │
└──────────────┴─────────┴─────────┴──────────┘
```

---

## 🔍 كيفية فحص صلاحياتك

### في Supabase SQL Editor:
```sql
-- استبدل YOUR_EMAIL بإيميلك
SELECT 
  au.email,
  ur.role as admin_role,
  us.status as account_type,
  us.properties_limit,
  us.can_publish,
  COUNT(p.id) as current_properties
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_statuses us ON au.id = us.user_id
LEFT JOIN properties p ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL'
GROUP BY au.email, ur.role, us.status, us.properties_limit, us.can_publish;
```

### في التطبيق (F12 Console):
```javascript
// يجب أن ترى:
// isAdmin: true  (إذا كنت مدير)
// userRole: "admin" أو "user"
```

---

## 🛠️ العمليات الشائعة

### ✅ جعل مستخدم مديراً:
```sql
-- الطريقة 1: إضافة جديد
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');

-- الطريقة 2: تحديث موجود
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'user-uuid-here';
```

### ✅ ترقية مستخدم لمالك موثوق:
```sql
UPDATE user_statuses 
SET 
  status = 'trusted_owner',
  properties_limit = 5,
  images_limit = 5,
  is_verified = true,
  verified_by = 'admin-uuid',
  verified_at = now()
WHERE user_id = 'user-uuid-here';
```

### ✅ حظر مستخدم:
```sql
UPDATE user_statuses 
SET can_publish = false 
WHERE user_id = 'user-uuid-here';
```

### ✅ إلغاء الحظر:
```sql
UPDATE user_statuses 
SET can_publish = true 
WHERE user_id = 'user-uuid-here';
```

---

## 📊 الإحصائيات السريعة

```sql
-- عدد المدراء
SELECT COUNT(*) FROM user_roles WHERE role = 'admin';

-- عدد المحظورين
SELECT COUNT(*) FROM user_statuses WHERE can_publish = false;

-- عدد الموثوقين
SELECT COUNT(*) FROM user_statuses WHERE is_verified = true;

-- توزيع الحالات
SELECT status, COUNT(*) 
FROM user_statuses 
GROUP BY status;
```

---

## ⚠️ المشاكل الحالية

1. **ازدواجية**: نظامان منفصلان يتطلبان JOIN
2. **التعقيد**: صعوبة تتبع الصلاحيات من مكانين
3. **عدم المرونة**: حدود ثابتة لكل حالة
4. **لا يوجد اشتراكات**: كل المستخدمين مجاناً

---

## 💡 التوصيات

### عاجل:
- ✅ توحيد الجدولين في جدول واحد
- ✅ إضافة Audit Logging

### قريب:
- ✅ نظام الاشتراكات المدفوعة
- ✅ صلاحيات أكثر دقة

### مستقبلاً:
- ✅ دعم المؤسسات/الفرق
- ✅ API Keys للمطورين

---

## 📚 الملفات المهمة

- `PERMISSIONS_SYSTEM_ANALYSIS.md` - تحليل شامل ومفصل
- `TEST_PERMISSIONS.sql` - استعلامات فحص شاملة
- `MAKE_ADMIN.sql` - كيفية إضافة مدير
- `src/hooks/useAuth.tsx` - منطق التحقق من الصلاحيات
- `src/pages/UsersView.tsx` - واجهة إدارة المستخدمين

---

## 🆘 مشكلة شائعة

**السؤال:** لماذا يظهر "دورك: admin" في الواجهة لكن "الدور: user" في البطاقة؟

**الجواب:** 
- "دورك: admin" ← من `useAuth()` يقرأ `user_roles.role`
- "الدور: user" ← من بطاقة المستخدم تقرأ `user_roles.role` للمستخدم المحدد
- إذا كنت تنظر لملف مستخدم آخر، ستظهر معلوماته هو وليس معلوماتك

**الحل:** افتح console وشاهد:
```javascript
console.log('My role:', userRole, 'isAdmin:', isAdmin);
```

---

✅ **للحصول على تحليل شامل ومفصل، راجع:** `PERMISSIONS_SYSTEM_ANALYSIS.md`
