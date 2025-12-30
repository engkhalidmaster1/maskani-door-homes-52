# 🚀 نظام الصلاحيات الموحد - دليل كامل
## Unified Permissions System - Complete Guide

> **النسخة:** 2.0  
> **التاريخ:** 17 أكتوبر 2025  
> **الحالة:** نظام موحد محسّن ✅

---

## 📊 الأدوار والصلاحيات الجديدة

### 🎯 جدول الأدوار

| الدور | الاسم | العقارات | الصور/عقار | عقارات مميزة | التخزين | الحالة |
|-------|-------|----------|------------|--------------|----------|--------|
| **admin** | 🔑 مدير النظام | ∞ | ∞ | ∞ | ∞ | موثق ✅ |
| **office** | 🏢 مكتب عقارات | ∞ | 10 | 50 | 5 GB | موثق ✅ |
| **agent** | 🏆 وكيل عقاري | 10 | 10 | 3 | 500 MB | موثق ✅ |
| **publisher** | 👤 ناشر عادي | 3 | 10 | 0 | 100 MB | غير موثق ⚪ |

**ملاحظة:** `-1` يعني غير محدود

---

## 🏗️ البنية الجديدة

### **جدول واحد موحد: `user_permissions`**

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- الدور
  role user_role_type DEFAULT 'publisher',
  
  -- الحدود (JSONB مرن)
  limits JSONB DEFAULT '{
    "properties": 3,
    "images_per_property": 10,
    "featured_properties": 0,
    "storage_mb": 100
  }',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  can_publish BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- الإحصائيات
  properties_count INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  
  -- التحقق
  verified_by UUID,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔧 الدوال المتاحة

### 1️⃣ **get_user_role()** - الحصول على دور المستخدم
```sql
SELECT get_user_role(); -- دور المستخدم الحالي
SELECT get_user_role('user-uuid-here'); -- دور مستخدم محدد
```

### 2️⃣ **is_admin()** - التحقق من صلاحية المدير
```sql
SELECT is_admin(); -- هل المستخدم الحالي مدير؟
SELECT is_admin('user-uuid-here'); -- هل المستخدم المحدد مدير؟
```

### 3️⃣ **get_user_limits()** - الحصول على الحدود
```sql
SELECT * FROM get_user_limits(); -- حدود المستخدم الحالي
SELECT * FROM get_user_limits('user-uuid-here'); -- حدود مستخدم محدد
```

**النتيجة:**
```
role               | publisher
properties_limit   | 3
images_limit       | 10
featured_limit     | 0
storage_mb         | 100
current_properties | 1
current_images     | 5
can_publish        | true
is_verified        | false
is_active          | true
```

### 4️⃣ **can_add_property()** - التحقق من إمكانية إضافة عقار
```sql
SELECT can_add_property(); -- هل يمكن للمستخدم الحالي إضافة عقار؟
SELECT can_add_property('user-uuid-here'); -- لمستخدم محدد
```

### 5️⃣ **update_user_role()** - تحديث دور مستخدم (للمدراء فقط)
```sql
SELECT update_user_role(
  target_user_id := 'user-uuid-here',
  new_role := 'agent', -- publisher, agent, office, admin
  admin_id := auth.uid() -- اختياري، يستخدم المدير الحالي افتراضياً
);
```

**التحديثات التلقائية:**
- ✅ تحديث الحدود حسب الدور
- ✅ تفعيل التحقق للأدوار المتقدمة
- ✅ تسجيل من قام بالتحقق

### 6️⃣ **toggle_user_ban()** - حظر/إلغاء حظر مستخدم
```sql
-- حظر مستخدم
SELECT toggle_user_ban(
  target_user_id := 'user-uuid-here',
  should_ban := true,
  admin_id := auth.uid()
);

-- إلغاء الحظر
SELECT toggle_user_ban(
  target_user_id := 'user-uuid-here',
  should_ban := false,
  admin_id := auth.uid()
);
```

---

## 📋 View: users_with_permissions

عرض جاهز لكل معلومات المستخدمين:

```sql
SELECT * FROM users_with_permissions
WHERE email = 'user@example.com';
```

**الأعمدة:**
- `id`, `email`, `full_name`, `phone`
- `role`, `role_name_ar` (🔑 مدير النظام)
- `properties_limit`, `images_limit`, `featured_limit`, `storage_mb`
- `properties_count`, `images_count`
- `can_publish`, `is_verified`, `is_active`
- `status_indicator` (🟢 ضمن الحد، 🟡 قريب من الحد، 🔴 وصل للحد)

---

## 🎨 أمثلة الاستخدام

### ✅ ترقية مستخدم إلى وكيل عقاري
```sql
SELECT update_user_role(
  target_user_id := (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  new_role := 'agent'
);
```

**النتيجة:**
- 📊 حد العقارات: 3 → **10**
- 🖼️ حد الصور: 10 → **10**
- ⭐ عقارات مميزة: 0 → **3**
- 💾 التخزين: 100 MB → **500 MB**
- ✅ التحقق: غير موثق → **موثق**

---

### ✅ ترقية إلى مكتب عقارات
```sql
SELECT update_user_role(
  target_user_id := (SELECT id FROM auth.users WHERE email = 'office@example.com'),
  new_role := 'office'
);
```

**النتيجة:**
- 📊 حد العقارات: **∞ (غير محدود)**
- 🖼️ حد الصور: **10**
- ⭐ عقارات مميزة: **50**
- 💾 التخزين: **5 GB**
- ✅ التحقق: **موثق**

---

### ✅ تعيين مدير نظام
```sql
SELECT update_user_role(
  target_user_id := (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  new_role := 'admin'
);
```

**النتيجة:**
- 🔑 **صلاحيات كاملة وغير محدودة**
- 📊 العقارات: **∞**
- 🖼️ الصور: **∞**
- ⭐ المميزة: **∞**
- 💾 التخزين: **∞**

---

### ✅ حظر مستخدم مخالف
```sql
SELECT toggle_user_ban(
  target_user_id := (SELECT id FROM auth.users WHERE email = 'spammer@example.com'),
  should_ban := true
);
```

**النتيجة:**
- 🚫 `can_publish` = false
- 🚫 `is_active` = false
- ❌ لا يمكنه إضافة عقارات

---

### ✅ إحصائيات شاملة
```sql
-- عدد المستخدمين حسب الدور
SELECT 
  role,
  role_name_ar,
  COUNT(*) as total_users,
  COUNT(CASE WHEN can_publish THEN 1 END) as active_users,
  COUNT(CASE WHEN is_verified THEN 1 END) as verified_users,
  SUM(properties_count) as total_properties
FROM users_with_permissions
GROUP BY role, role_name_ar
ORDER BY role;
```

**نتيجة محتملة:**
```
role      | role_name_ar       | total_users | active_users | verified_users | total_properties
----------+--------------------+-------------+--------------+----------------+-----------------
admin     | 🔑 مدير النظام    |           2 |            2 |              2 |               15
office    | 🏢 مكتب عقارات    |           5 |            5 |              5 |              450
agent     | 🏆 وكيل عقاري     |          30 |           28 |             30 |              180
publisher | 👤 ناشر عادي      |         200 |          190 |             50 |              380
```

---

### ✅ المستخدمون القريبون من الحد
```sql
SELECT 
  email,
  full_name,
  role_name_ar,
  properties_count,
  properties_limit,
  status_indicator,
  ROUND((properties_count::NUMERIC / NULLIF(properties_limit, 0)) * 100, 1) as usage_percentage
FROM users_with_permissions
WHERE role NOT IN ('admin', 'office') -- استثناء غير المحدودين
  AND properties_count >= properties_limit * 0.8
ORDER BY usage_percentage DESC;
```

---

## 🔐 الأمان والصلاحيات (RLS)

### **Row Level Security Policies:**

#### 1. المستخدمون يرون صلاحياتهم فقط
```sql
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  USING (auth.uid() = user_id);
```

#### 2. المدراء يرون كل الصلاحيات
```sql
CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  USING (is_admin());
```

#### 3. المدراء فقط يحدثون الصلاحيات
```sql
CREATE POLICY "Admins can update permissions"
  ON user_permissions FOR UPDATE
  USING (is_admin());
```

#### 4. التحقق من الحد عند إضافة عقار
```sql
CREATE POLICY "Users can add properties within limits"
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND can_add_property(auth.uid())
  );
```

---

## 🔄 الترحيل من النظام القديم

### **تم تلقائياً! ✅**

Migration يقوم بـ:
1. ✅ نقل جميع البيانات من `user_roles` و `user_statuses`
2. ✅ تحويل الأدوار القديمة:
   - `user_roles.role = 'admin'` → `admin`
   - `user_statuses.status = 'office_agent'` → `office`
   - `user_statuses.status = 'trusted_owner'` → `agent`
   - افتراضي → `publisher`
3. ✅ تحديث الحدود حسب الدور الجديد
4. ✅ الحفاظ على `can_publish` و `is_verified`
5. ✅ حساب `properties_count` و `images_count`

---

## 📊 مقارنة: قبل وبعد

### **قبل (النظام القديم):**
```
user_roles           user_statuses
├── role: admin      ├── status: publisher
└── role: user       ├── status: trusted_owner
                     └── status: office_agent
                     
❌ جدولان منفصلان
❌ حدود ثابتة
❌ استعلامات معقدة (JOIN دائماً)
❌ لا مرونة
```

### **بعد (النظام الجديد):**
```
user_permissions
├── role: admin (∞)
├── role: office (∞ عقارات)
├── role: agent (10 عقارات)
└── role: publisher (3 عقارات)

✅ جدول واحد موحد
✅ حدود مرنة (JSONB)
✅ استعلامات بسيطة
✅ قابل للتوسع
✅ دوال مساعدة قوية
✅ View جاهز
✅ Triggers تلقائية
```

---

## 🛠️ التكامل مع Frontend

### **تحديث useAuth Hook:**

```typescript
// src/hooks/useAuth.tsx
const fetchUserRole = async (userId: string) => {
  const { data } = await supabase
    .from('user_permissions')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  return data?.role || null;
};

const isAdmin = userRole === 'admin';
```

### **الحصول على الحدود:**

```typescript
// src/hooks/useUserLimits.ts
export const useUserLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchLimits = async () => {
      const { data } = await supabase
        .rpc('get_user_limits', { uid: user.id });
      
      setLimits(data[0]);
    };
    
    fetchLimits();
  }, [user]);

  return limits;
};
```

### **التحقق من إمكانية إضافة عقار:**

```typescript
// قبل إضافة عقار
const { data: canAdd } = await supabase
  .rpc('can_add_property');

if (!canAdd) {
  toast.error('لقد وصلت للحد الأقصى من العقارات!');
  return;
}

// إضافة العقار
await supabase.from('properties').insert({ ... });
```

---

## 🎯 حالات الاستخدام الشائعة

### 1️⃣ **لوحة تحكم المدير**

```sql
-- عرض جميع المستخدمين مع التفاصيل
SELECT 
  email,
  full_name,
  role_name_ar,
  properties_count || ' / ' || 
    CASE WHEN properties_limit = -1 THEN '∞' ELSE properties_limit::TEXT END as properties,
  status_indicator,
  CASE WHEN can_publish THEN '✅' ELSE '🚫' END as publish_status,
  last_sign_in_at
FROM users_with_permissions
ORDER BY role, properties_count DESC;
```

### 2️⃣ **إدارة الترقيات**

```sql
-- ترقية جميع المستخدمين الموثوقين إلى وكلاء
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users au
    JOIN user_permissions up ON au.id = up.user_id
    WHERE up.role = 'publisher' 
      AND up.is_verified = true
      AND up.properties_count >= 3
  LOOP
    PERFORM update_user_role(user_record.id, 'agent');
  END LOOP;
END $$;
```

### 3️⃣ **تنبيهات الحدود**

```sql
-- المستخدمون الذين وصلوا 90% من حدهم
SELECT 
  email,
  full_name,
  role_name_ar,
  properties_count,
  properties_limit,
  ROUND((properties_count::NUMERIC / properties_limit) * 100, 1) as usage_pct
FROM users_with_permissions
WHERE role NOT IN ('admin', 'office')
  AND properties_count >= properties_limit * 0.9
ORDER BY usage_pct DESC;
```

---

## 🚨 استكشاف الأخطاء

### **المشكلة:** المستخدم لا يمكنه إضافة عقار

**الحل:**
```sql
-- فحص حالة المستخدم
SELECT 
  email,
  role_name_ar,
  properties_count,
  properties_limit,
  can_publish,
  is_active,
  status_indicator
FROM users_with_permissions
WHERE email = 'user@example.com';

-- إذا كان محظوراً
SELECT toggle_user_ban(
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  false -- إلغاء الحظر
);

-- إذا وصل للحد - ترقيته
SELECT update_user_role(
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'agent' -- أو 'office' حسب الحاجة
);
```

---

### **المشكلة:** الإحصائيات غير دقيقة

**الحل:**
```sql
-- إعادة حساب الإحصائيات لجميع المستخدمين
UPDATE user_permissions up
SET 
  properties_count = (
    SELECT COUNT(*) FROM properties 
    WHERE user_id = up.user_id AND is_published = true
  ),
  images_count = (
    SELECT COALESCE(SUM(array_length(images, 1)), 0)
    FROM properties 
    WHERE user_id = up.user_id
  ),
  updated_at = now();
```

---

## 📚 الملفات المرجعية

- ✅ `20251017000000_unified_permissions_system.sql` - Migration الرئيسي
- ✅ `MAKE_ADMIN_UNIFIED.sql` - كيفية تعيين مدير
- ✅ `UNIFIED_PERMISSIONS_GUIDE.md` - هذا الدليل
- ✅ `PERMISSIONS_SYSTEM_ANALYSIS.md` - التحليل الكامل

---

## 🎉 المميزات الجديدة

1. ✅ **نظام موحد** - جدول واحد بدلاً من اثنين
2. ✅ **حدود مرنة** - JSONB يسمح بتخصيص غير محدود
3. ✅ **دوال قوية** - 6 دوال مساعدة جاهزة
4. ✅ **View جاهز** - استعلام واحد لكل شيء
5. ✅ **Triggers تلقائية** - تحديث الإحصائيات آلياً
6. ✅ **RLS محكم** - أمان على مستوى الصف
7. ✅ **Audit Trail** - تسجيل التحقق والتعديلات
8. ✅ **Performance** - Indexes محسّنة
9. ✅ **Scalable** - قابل للتوسع بسهولة
10. ✅ **Migration** - نقل البيانات تلقائياً

---

## 🚀 التطبيق

### **الخطوة 1:** تشغيل Migration
```bash
# في Supabase Dashboard → SQL Editor
# انسخ محتوى: 20251017000000_unified_permissions_system.sql
# اضغط Run
```

### **الخطوة 2:** تعيين مدير
```bash
# في Supabase Dashboard → SQL Editor
# انسخ محتوى: MAKE_ADMIN_UNIFIED.sql
# استبدل البريد الإلكتروني
# اضغط Run
```

### **الخطوة 3:** التحقق
```sql
SELECT * FROM users_with_permissions 
WHERE role = 'admin';
```

### **الخطوة 4:** تسجيل دخول جديد
```
1. سجل خروج من التطبيق
2. سجل دخول مرة أخرى
3. افتح Console (F12)
4. يجب أن ترى: isAdmin: true
```

---

## ✨ ما التالي؟

- [ ] تحديث Frontend components
- [ ] إضافة نظام الاشتراكات
- [ ] لوحة تحكم للإحصائيات
- [ ] تنبيهات تلقائية
- [ ] API للمطورين

---

**🎯 النظام الآن جاهز للاستخدام بكامل طاقته!**
