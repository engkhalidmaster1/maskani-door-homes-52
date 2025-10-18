# 🔒 تحليل شامل لنظام الصلاحيات والأدوار في Maskani

> **تاريخ التحليل:** 17 أكتوبر 2025  
> **الحالة:** نظام مزدوج - يحتاج إلى توحيد

---

## 📊 الوضع الحالي: نظامان للصلاحيات

### ⚠️ **المشكلة الرئيسية: ازدواجية الأنظمة**

يوجد حالياً **نظامان منفصلان** للصلاحيات يعملان بشكل متوازي:

#### 1️⃣ **نظام `user_roles` (نظام الأدوار الإدارية)**
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role DEFAULT 'user',  -- فقط: admin أو user
  created_at TIMESTAMP
);
```

**الأدوار المتاحة:**
- ✅ `admin` - مدير النظام (صلاحيات كاملة)
- ✅ `user` - مستخدم عادي (صلاحيات محدودة)

**الصلاحيات:**
- المدراء (`admin`):
  - ✅ عرض وتعديل جميع العقارات
  - ✅ حذف أي عقار
  - ✅ إدارة المستخدمين (عرض، تعديل، حظر، حذف)
  - ✅ الوصول إلى Dashboard
  - ✅ تغيير كلمات المرور
  - ✅ تحديث حالات المستخدمين
  
- المستخدمون العاديون (`user`):
  - ✅ عرض ملفهم الشخصي
  - ✅ تعديل معلوماتهم
  - ✅ إدارة عقاراتهم فقط
  - ❌ لا يمكنهم الوصول إلى لوحة التحكم

---

#### 2️⃣ **نظام `user_statuses` (نظام الحالات والحدود)**
```sql
CREATE TYPE public.user_status AS ENUM (
  'publisher',      -- ناشر عادي
  'trusted_owner',  -- مالك موثوق
  'office_agent'    -- وكيل مكتب/دلالية
);

CREATE TABLE public.user_statuses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status user_status DEFAULT 'publisher',
  properties_limit INTEGER DEFAULT 1,  -- حد العقارات
  images_limit INTEGER DEFAULT 2,       -- حد الصور
  can_publish BOOLEAN DEFAULT true,     -- إذن النشر
  is_verified BOOLEAN DEFAULT false,    -- التحقق
  verified_by UUID,                     -- من قام بالتحقق
  verified_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**الحالات المتاحة:**
- ✅ `publisher` (ناشر عادي) - الحالة الافتراضية
  - حد العقارات: **1 عقار**
  - حد الصور: **2 صورة** لكل عقار
  - غير موثوق افتراضياً
  
- ✅ `trusted_owner` (مالك موثوق)
  - حد العقارات: **5 عقارات**
  - حد الصور: **5 صور** لكل عقار
  - موثوق تلقائياً (`is_verified = true`)
  
- ✅ `office_agent` (وكيل مكتب/دلالية)
  - حد العقارات: **999 عقار** (غير محدود عملياً)
  - حد الصور: **7 صور** لكل عقار
  - موثوق تلقائياً (`is_verified = true`)

**حقل `can_publish`:**
- ✅ `true` - يستطيع النشر (افتراضي)
- ❌ `false` - **محظور من النشر** (Ban)

---

## 🎯 كيفية عمل النظامين معاً

### **العلاقة بين النظامين:**

```
المستخدم (auth.users)
    ↓
    ├── user_roles → role (admin/user)          ← يحدد الصلاحيات الإدارية
    └── user_statuses → status + limits         ← يحدد نوع الحساب والحدود
```

### **مثال عملي:**

```sql
-- المستخدم 1: مدير موقع
user_roles.role = 'admin'              -- مدير
user_statuses.status = 'publisher'     -- (لا يهم، المدير له صلاحيات كاملة)
user_statuses.can_publish = true

-- المستخدم 2: مالك موثوق
user_roles.role = 'user'               -- مستخدم عادي
user_statuses.status = 'trusted_owner' -- مالك موثوق
user_statuses.properties_limit = 5     -- 5 عقارات
user_statuses.can_publish = true

-- المستخدم 3: مستخدم محظور
user_roles.role = 'user'               -- مستخدم عادي
user_statuses.status = 'publisher'     -- ناشر عادي
user_statuses.can_publish = false      -- ❌ محظور!
```

---

## 🔐 نظام RLS (Row Level Security)

### **Policies المطبقة:**

#### 1. **جدول `user_roles`:**
```sql
-- المدراء يرون جميع الأدوار
CREATE POLICY "Admins can view all roles" 
ON user_roles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- المستخدمون يرون دورهم فقط
CREATE POLICY "Users can view their own role" 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- المدراء يديرون الأدوار
CREATE POLICY "Admins can manage roles" 
ON user_roles FOR ALL 
USING (has_role(auth.uid(), 'admin'));
```

#### 2. **جدول `user_statuses`:**
```sql
-- المستخدم يرى حالته
CREATE POLICY "Users can view their own status" 
ON user_statuses FOR SELECT 
USING (auth.uid() = user_id);

-- المدراء يرون جميع الحالات
CREATE POLICY "Admins can view all statuses" 
ON user_statuses FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- المدراء يحدثون الحالات
CREATE POLICY "Admins can update statuses" 
ON user_statuses FOR UPDATE 
USING (...);
```

#### 3. **جدول `properties`:**
```sql
-- أي شخص يرى العقارات المنشورة
CREATE POLICY "Anyone can view published properties" 
ON properties FOR SELECT 
USING (is_published = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- المستخدم يدير عقاراته فقط
CREATE POLICY "Users can insert their own properties" 
ON properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- المدراء يحذفون أي عقار
CREATE POLICY "Admins can delete any property" 
ON properties FOR DELETE 
USING (has_role(auth.uid(), 'admin'));
```

---

## 🛠️ الدوال المساعدة

### 1. **فحص الدور:**
```sql
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 2. **الحصول على الدور الحالي:**
```sql
CREATE FUNCTION get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM user_roles 
  WHERE user_id = auth.uid() LIMIT 1
$$;
```

### 3. **تحديث حالة المستخدم:**
```sql
CREATE FUNCTION update_user_status(
  target_user_id UUID,
  new_status user_status,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- التحقق من صلاحيات المدير
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  
  -- تحديث الحالة والحدود
  UPDATE user_statuses SET 
    status = new_status,
    properties_limit = CASE 
      WHEN new_status = 'publisher' THEN 1
      WHEN new_status = 'trusted_owner' THEN 5
      WHEN new_status = 'office_agent' THEN 999
    END,
    images_limit = CASE 
      WHEN new_status = 'publisher' THEN 2
      WHEN new_status = 'trusted_owner' THEN 5
      WHEN new_status = 'office_agent' THEN 7
    END
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;
```

### 4. **الحصول على حالة المستخدم مع الحدود:**
```sql
CREATE FUNCTION get_user_status(user_id_param UUID)
RETURNS TABLE (
  status user_status,
  properties_limit INTEGER,
  images_limit INTEGER,
  can_publish BOOLEAN,
  is_verified BOOLEAN,
  current_properties_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.status,
    us.properties_limit,
    us.images_limit,
    us.can_publish,
    us.is_verified,
    COUNT(p.id)::INTEGER as current_properties_count
  FROM user_statuses us
  LEFT JOIN properties p ON p.user_id = us.user_id AND p.is_published = true
  WHERE us.user_id = user_id_param
  GROUP BY us.status, us.properties_limit, us.images_limit, us.can_publish, us.is_verified;
END;
$$;
```

---

## 💻 كود Frontend

### **useAuth Hook:**
```typescript
// src/hooks/useAuth.tsx
const fetchUserRole = async (userId: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  return data?.role || null;
};

const isAdmin = userRole === 'admin';
```

### **UsersView Component:**
```typescript
// عرض بيانات المستخدم من النظامين
interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';           // من user_roles
  status: string;                    // من user_statuses
  properties_limit: number;          // من user_statuses
  images_limit: number;              // من user_statuses
  can_publish: boolean;              // من user_statuses
  is_verified: boolean;              // من user_statuses
  properties_count: number;
}

// استعلام موحد
const { data: users } = await supabase
  .from('profiles')
  .select(`
    *,
    user_id,
    role:user_roles(role),
    status:user_statuses(
      status,
      properties_limit,
      images_limit,
      can_publish,
      is_verified
    )
  `);
```

---

## 🎨 واجهة إدارة المستخدمين (UsersView)

### **البطاقات الإحصائية (5 بطاقات):**
1. 👥 **إجمالي المستخدمين** (`filteredUsers.length`)
2. 👤 **ناشرون عاديون** (`status = 'publisher'`)
3. 🏆 **ملاك موثوقون** (`status = 'trusted_owner'`)
4. 🏢 **مكاتب دلالية** (`status = 'office_agent'`)
5. 🚫 **محظورون** (`can_publish = false`)

### **الفلاتر المتاحة:**
```typescript
// فلتر الدور (user_roles)
<Select value={roleFilter}>
  <SelectItem value="all">كل الأدوار</SelectItem>
  <SelectItem value="admin">مدراء فقط</SelectItem>
  <SelectItem value="user">مستخدمون عاديون</SelectItem>
</Select>

// فلتر الحالة (user_statuses)
<Select value={statusFilter}>
  <SelectItem value="all">كل الحالات</SelectItem>
  <SelectItem value="publisher">👤 ناشر عادي</SelectItem>
  <SelectItem value="trusted_owner">🏆 مالك موثوق</SelectItem>
  <SelectItem value="office_agent">🏢 مكتب دلالية</SelectItem>
  <SelectItem value="banned">🚫 محظور من النشر</SelectItem>
</Select>
```

### **الإجراءات المتاحة:**
```typescript
// 1. عرض التفاصيل (Eye icon)
handleViewUser(user) → يفتح Dialog بكل المعلومات

// 2. تعديل البيانات (Edit3 icon)
handleEditUser(user) → تعديل الاسم، الهاتف، العنوان، الدور

// 3. حظر/إلغاء حظر (Ban/UserCheck icon)
handleBanUser() → يغير can_publish = false
handleUnbanUser() → يغير can_publish = true

// 4. حذف المستخدم (Trash2 icon)
handleDeleteUser() → حذف دائم من auth.users
```

---

## 🔧 نظام RBAC المتقدم (غير مفعل)

يوجد نظام صلاحيات متقدم في `src/services/rbacManager.ts` لكنه **غير مستخدم** حالياً:

### **المميزات:**
- ✅ إدارة صلاحيات دقيقة (Permissions)
- ✅ أدوار مخصصة (Custom Roles)
- ✅ Context-based access control
- ✅ Navigation based on permissions
- ✅ Permission inheritance
- ✅ Audit logging

### **الصلاحيات المحددة:**
```typescript
DEFAULT_PERMISSIONS = [
  'property:read',
  'property:create',
  'property:update',
  'property:delete',
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'admin:dashboard',
  'admin:settings',
  'admin:reports',
  'admin:audit'
];
```

### **الأدوار المحددة:**
```typescript
DEFAULT_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    permissions: ['*'] // All permissions
  },
  {
    id: 'admin',
    name: 'Administrator',
    permissions: ['user:*', 'property:*', 'admin:dashboard']
  },
  {
    id: 'moderator',
    name: 'Moderator',
    permissions: ['property:read', 'property:update', 'user:read']
  },
  {
    id: 'user',
    name: 'User',
    permissions: ['property:read', 'property:create']
  }
];
```

**⚠️ ملاحظة:** هذا النظام موجود في الكود لكنه **غير متصل بـ Supabase** ويعمل على `localStorage` فقط.

---

## 📈 إمكانيات التطوير

### 1️⃣ **توحيد النظامين** (مُوصى به بشدة) ⭐⭐⭐⭐⭐
```sql
-- دمج user_roles و user_statuses في جدول واحد
CREATE TABLE unified_user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- الدور الإداري
  role app_role DEFAULT 'user',
  
  -- نوع الحساب
  account_type user_status DEFAULT 'publisher',
  
  -- الحدود
  properties_limit INTEGER DEFAULT 1,
  images_limit INTEGER DEFAULT 2,
  
  -- الحالة
  can_publish BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP,
  
  -- الإعدادات المتقدمة
  max_featured INTEGER DEFAULT 0,
  storage_mb INTEGER DEFAULT 100,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**المميزات:**
- ✅ استعلام واحد للحصول على جميع الصلاحيات
- ✅ تقليل التعقيد
- ✅ سهولة الصيانة
- ✅ أداء أفضل

---

### 2️⃣ **إضافة أدوار جديدة** ⭐⭐⭐⭐
```sql
-- تحديث enum لإضافة أدوار جديدة
ALTER TYPE app_role ADD VALUE 'moderator';
ALTER TYPE app_role ADD VALUE 'support';
ALTER TYPE app_role ADD VALUE 'content_manager';

-- مثال: مدير محتوى
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'content_manager');
```

**الأدوار المقترحة:**
- ✅ `moderator` - مشرف (يراجع العقارات، يحذف المخالف)
- ✅ `support` - دعم فني (يساعد المستخدمين)
- ✅ `content_manager` - مدير محتوى (يدير المقالات والأخبار)
- ✅ `finance` - مالية (يدير الاشتراكات والمدفوعات)

---

### 3️⃣ **حالات حساب إضافية** ⭐⭐⭐
```sql
ALTER TYPE user_status ADD VALUE 'premium_user';
ALTER TYPE user_status ADD VALUE 'business';
ALTER TYPE user_status ADD VALUE 'developer';

-- مثال: حساب Developer
UPDATE user_statuses SET
  status = 'developer',
  properties_limit = 9999,
  images_limit = 15
WHERE user_id = 'developer-uuid';
```

**الحالات المقترحة:**
- ✅ `premium_user` - مستخدم مميز (20 عقار، 10 صور)
- ✅ `business` - شركة (100 عقار، 10 صور)
- ✅ `developer` - مطور عقاري (9999 عقار، 15 صورة)

---

### 4️⃣ **نظام الاشتراكات (Subscriptions)** ⭐⭐⭐⭐⭐
```sql
CREATE TYPE subscription_tier AS ENUM (
  'free',
  'basic',
  'pro',
  'enterprise'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tier subscription_tier DEFAULT 'free',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  properties_limit INTEGER,
  images_limit INTEGER,
  featured_limit INTEGER,
  price DECIMAL(10,2),
  created_at TIMESTAMP
);
```

**الباقات المقترحة:**

| الباقة | العقارات | الصور | مميز | السعر/شهر |
|--------|----------|-------|------|-----------|
| Free | 1 | 2 | 0 | 0 ريال |
| Basic | 10 | 5 | 2 | 49 ريال |
| Pro | 50 | 10 | 10 | 199 ريال |
| Enterprise | غير محدود | 15 | 50 | 999 ريال |

---

### 5️⃣ **صلاحيات دقيقة (Granular Permissions)** ⭐⭐⭐⭐
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  permission_name TEXT NOT NULL,
  resource TEXT,
  action TEXT,
  is_granted BOOLEAN DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- مثال: منح صلاحية تعديل عقار معين
INSERT INTO user_permissions (user_id, permission_name, resource, action)
VALUES ('user-uuid', 'property:update', 'property-123', 'update');
```

**الصلاحيات المقترحة:**
- ✅ `property:publish` - نشر عقار
- ✅ `property:feature` - ترويج عقار
- ✅ `property:export` - تصدير بيانات
- ✅ `user:ban` - حظر مستخدم
- ✅ `chat:admin` - إدارة المحادثات
- ✅ `reports:view` - عرض التقارير

---

### 6️⃣ **Audit Logging (سجل التدقيق)** ⭐⭐⭐⭐⭐
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Trigger لتسجيل جميع التغييرات
CREATE TRIGGER log_user_status_changes
AFTER UPDATE ON user_statuses
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

**الأحداث المسجلة:**
- ✅ تسجيل الدخول/الخروج
- ✅ تغيير الدور
- ✅ تحديث الحالة
- ✅ حظر/إلغاء حظر
- ✅ حذف عقار
- ✅ تغيير كلمة المرور

---

### 7️⃣ **نظام التحقق متعدد المستويات** ⭐⭐⭐⭐
```sql
CREATE TYPE verification_level AS ENUM (
  'none',
  'email',
  'phone',
  'identity',
  'full'
);

ALTER TABLE user_statuses ADD COLUMN verification_level verification_level DEFAULT 'none';

-- مثال: التحقق الكامل
UPDATE user_statuses SET
  verification_level = 'full',
  is_verified = true,
  verified_by = 'admin-uuid',
  verified_at = now()
WHERE user_id = 'user-uuid';
```

**مستويات التحقق:**
- ✅ `none` - بدون تحقق
- ✅ `email` - البريد الإلكتروني فقط
- ✅ `phone` - الهاتف فقط
- ✅ `identity` - الهوية الشخصية
- ✅ `full` - تحقق كامل (هوية + صور + مستندات)

---

### 8️⃣ **حدود ديناميكية بناءً على النشاط** ⭐⭐⭐
```sql
-- زيادة الحدود تلقائياً حسب النشاط
CREATE FUNCTION auto_upgrade_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا وصل المستخدم لـ 90% من حده ولديه تقييم جيد
  IF (SELECT COUNT(*) FROM properties WHERE user_id = NEW.user_id) >= NEW.properties_limit * 0.9
     AND (SELECT AVG(rating) FROM user_reviews WHERE user_id = NEW.user_id) >= 4.5
  THEN
    UPDATE user_statuses SET
      properties_limit = properties_limit + 5
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

### 9️⃣ **Team/Organization Support** ⭐⭐⭐⭐
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  subscription_tier subscription_tier,
  created_at TIMESTAMP
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT, -- 'owner', 'admin', 'member'
  permissions JSONB,
  joined_at TIMESTAMP
);
```

**المميزات:**
- ✅ إدارة الفرق
- ✅ مشاركة الحدود
- ✅ أدوار داخل الفريق
- ✅ إحصائيات جماعية

---

### 🔟 **API Keys للمطورين** ⭐⭐⭐⭐
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  key_hash TEXT NOT NULL,
  name TEXT,
  permissions JSONB,
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 🎯 التوصيات حسب الأولوية

### **عاجل (الآن):**
1. ✅ توثيق النظام الحالي (تم ✓)
2. ✅ توحيد استعلامات المستخدمين
3. ✅ إصلاح تناقض العرض بين role و status

### **قريب (خلال أسبوع):**
1. ⭐ توحيد `user_roles` و `user_statuses` في جدول واحد
2. ⭐ إضافة Audit Logging
3. ⭐ تحسين RLS policies

### **متوسط الأجل (خلال شهر):**
1. ⭐ إضافة نظام الاشتراكات
2. ⭐ صلاحيات دقيقة (Granular Permissions)
3. ⭐ نظام التحقق متعدد المستويات

### **طويل الأجل (3-6 شهور):**
1. ⭐ دعم المؤسسات والفرق
2. ⭐ API Keys للمطورين
3. ⭐ تكامل RBAC Manager الكامل

---

## 📝 ملاحظات مهمة

### ⚠️ **المشاكل الحالية:**

1. **ازدواجية البيانات:**
   - `user_roles.role` و `user_statuses.status` منفصلان
   - يتطلب JOIN في كل استعلام
   - إمكانية عدم تطابق البيانات

2. **عدم استخدام RBAC Manager:**
   - نظام متقدم موجود لكن غير مفعل
   - يعمل على localStorage فقط
   - غير متزامن مع Supabase

3. **حدود ثابتة:**
   - لا توجد مرونة في تخصيص الحدود
   - كل status له حدود محددة مسبقاً
   - لا يوجد نظام اشتراكات

### ✅ **النقاط القوية:**

1. **RLS محكم:**
   - Policies واضحة ومحددة
   - حماية جيدة للبيانات
   - فصل صلاحيات المدراء والمستخدمين

2. **واجهة إدارة ممتازة:**
   - UsersView منظم وواضح
   - Grid/Table view
   - Pagination فعال
   - فلاتر شاملة

3. **توثيق جيد:**
   - MAKE_ADMIN.sql واضح
   - تعليقات في الكود
   - Migrations منظمة

---

## 🚀 خطة التطوير الموصى بها

### **المرحلة 1: التوحيد (أسبوع واحد)**
```sql
-- 1. إنشاء جدول موحد
-- 2. نقل البيانات
-- 3. تحديث Policies
-- 4. تحديث Frontend
```

### **المرحلة 2: التحسينات (أسبوعان)**
```sql
-- 1. Audit Logging
-- 2. مستويات التحقق
-- 3. حدود مخصصة
```

### **المرحلة 3: الاشتراكات (شهر)**
```sql
-- 1. جدول Subscriptions
-- 2. نظام الدفع
-- 3. إدارة الباقات
```

### **المرحلة 4: المميزات المتقدمة (2-3 أشهر)**
```sql
-- 1. المؤسسات والفرق
-- 2. API Keys
-- 3. RBAC كامل
```

---

## 📚 المراجع

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL ENUM Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

---

**تم إعداد هذا التقرير بواسطة:** GitHub Copilot  
**التاريخ:** 17 أكتوبر 2025  
**الحالة:** شامل ومحدث ✅
