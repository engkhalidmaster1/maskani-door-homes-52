# 🔧 دليل إصلاح قاعدة البيانات - خطوة بخطوة

## 📋 المشكلة الحالية

المستخدم `eng.khalid.work@gmail.com` (ID: `85c5601e-d99e-4daa-90c6-515f5accff06`) موجود في Supabase Auth ولكن **مفقود من الجداول المطلوبة**:

- ❌ غير موجود في جدول `user_roles`
- ❌ غير موجود في جدول `profiles` 
- ❌ غير موجود في جدول `user_statuses`

## 🎯 الحل النهائي (خطوات بسيطة)

### الخطوة 1: فتح Supabase Dashboard

1. اذهب إلى: https://supabase.com/dashboard
2. سجل دخولك إلى حسابك
3. اختر المشروع: `maskani`
4. اذهب إلى: **SQL Editor** من الشريط الجانبي

### الخطوة 2: تشغيل السكريپت الأساسي

انسخ والصق هذا السكريپت في SQL Editor:

```sql
-- 🔧 إصلاح المستخدم الحالي
-- إضافة المستخدم إلى جدول user_roles
INSERT INTO user_roles (user_id, role, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'admin', 
    NOW(), 
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

-- إضافة المستخدم إلى جدول profiles  
INSERT INTO profiles (user_id, email, first_name, last_name, full_name, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'eng.khalid.work@gmail.com',
    'Khalid',
    'Engineer',
    'Khalid Engineer',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    email = 'eng.khalid.work@gmail.com',
    first_name = 'Khalid',
    last_name = 'Engineer',
    full_name = 'Khalid Engineer',
    updated_at = NOW();

-- إضافة المستخدم إلى جدول user_statuses
INSERT INTO user_statuses (user_id, status, created_at, updated_at)
VALUES (
    '85c5601e-d99e-4daa-90c6-515f5accff06', 
    'active', 
    NOW(), 
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET 
    status = 'active',
    updated_at = NOW();

-- التحقق من النجاح
SELECT 
    'تم الإصلاح بنجاح ✅' as status,
    ur.role as user_role,
    p.email as profile_email,
    p.full_name as full_name,
    us.status as user_status
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.user_id  
JOIN user_statuses us ON ur.user_id = us.user_id
WHERE ur.user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
```

### الخطوة 3: تشغيل السكريپت

1. الصق السكريپت في SQL Editor
2. اضغط على زر **"Run"** أو **"Execute"**
3. انتظر ظهور رسالة النجاح

### الخطوة 4: التحقق من النجاح

يجب أن ترى نتيجة مثل:
```
status: تم الإصلاح بنجاح ✅
user_role: admin
profile_email: eng.khalid.work@gmail.com
full_name: Khalid Engineer
user_status: active
```

## 🔄 إعداد نظام تلقائي للمستقبل

بعد إصلاح المستخدم الحالي، أضف هذا trigger لإضافة المستخدمين الجدد تلقائياً:

```sql
-- إنشاء function لإضافة المستخدمين الجدد تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إضافة المستخدم إلى user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, 'user', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- إضافة المستخدم إلى profiles
  INSERT INTO public.profiles (user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- إضافة المستخدم إلى user_statuses
  INSERT INTO public.user_statuses (user_id, status, created_at, updated_at)
  VALUES (NEW.id, 'active', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🧪 اختبار الإصلاح

### الخطوة 5: اختبار النظام

1. **أعد تحميل التطبيق**: 
   - اذهب إلى http://localhost:8082
   - اضغط Ctrl+F5 لإعادة تحميل قوية

2. **افحص الكونسول**:
   - يجب أن ترى: `userRole: 'admin'` بدلاً من `null`
   - لا توجد أخطاء 406 أو 403

3. **اختبر الصفحات**:
   - لوحة التحكم: http://localhost:8082/dashboard
   - إدارة المستخدمين: http://localhost:8082/admin/users
   - إضافة مستخدم: http://localhost:8082/admin/add-user

## ✅ النتائج المتوقعة

بعد تطبيق الإصلاح:

### في المتصفح:
```javascript
// في console المتصفح
useAuth.tsx: Auth state: {
  user: 'eng.khalid.work@gmail.com', 
  userRole: 'admin',           // ✅ بدلاً من null
  isAdmin: true,               // ✅ بدلاً من false
  isLoading: false
}
```

### في قاعدة البيانات:
- ✅ المستخدم موجود في `user_roles` بدور `admin`
- ✅ المستخدم موجود في `profiles` مع البيانات الكاملة
- ✅ المستخدم موجود في `user_statuses` بحالة `active`

## 🗑️ إزالة الحل المؤقت (اختيارية)

بعد نجاح الإصلاح، يمكنك إزالة الحل المؤقت من الكود:

### في `useAuth.tsx`:
احذف هذا الجزء:
```typescript
// حل مؤقت للمستخدم المحدد حتى يتم إصلاح قاعدة البيانات
if (userId === '85c5601e-d99e-4daa-90c6-515f5accff06') {
  console.log('Setting temporary admin role for known user');
  setUserRole('admin');
  setIsAdmin(true);
  return;
}
```

### في `useProfile.tsx`:
احذف هذا الجزء:
```typescript
// حل مؤقت للمستخدم المحدد حتى يتم إصلاح قاعدة البيانات
if (user.id === '85c5601e-d99e-4daa-90c6-515f5accff06') {
  setProfileData({
    full_name: 'Khalid Engineer',
    phone: '',
    address: ''
  });
  setIsLoading(false);
  return;
}
```

## ⚠️ ملاحظات مهمة

1. **لا تحذف الحل المؤقت قبل اختبار الإصلاح**
2. **تأكد من تشغيل السكريپت بنجاح**
3. **اختبر النظام قبل إزالة الكود المؤقت**
4. **احتفظ بنسخة احتياطية قبل التعديل**

## 🆘 في حالة المشاكل

إذا لم يعمل الإصلاح:

### التحقق من الجداول:
```sql
-- فحص وجود الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'profiles', 'user_statuses');

-- فحص بيانات المستخدم
SELECT * FROM user_roles WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
SELECT * FROM profiles WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
SELECT * FROM user_statuses WHERE user_id = '85c5601e-d99e-4daa-90c6-515f5accff06';
```

### إنشاء الجداول إذا لم توجد:
```sql
-- إنشاء جدول user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول user_statuses
CREATE TABLE IF NOT EXISTS user_statuses (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 الخلاصة

1. **انسخ السكريپت الأول** والصقه في Supabase SQL Editor
2. **شغل السكريپت** واضغط Run
3. **تأكد من ظهور رسالة النجاح**
4. **أعد تحميل التطبيق** واختبر النظام
5. **إذا نجح الإصلاح**، يمكنك إزالة الحل المؤقت

**بعد هذا الإصلاح، النظام سيعمل بثبات وبدون أي أخطاء!** ✨