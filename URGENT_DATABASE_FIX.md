# 🚨 حل مشكلة عدم ظهور المكاتب العقارية

## السبب:
جدول `real_estate_offices` غير موجود في قاعدة البيانات. 

## الحل (خطوات مطلوبة):

### 1️⃣ افتح Supabase Dashboard
- اذهب إلى [supabase.com](https://supabase.com)
- ادخل على مشروعك
- اختر **SQL Editor** من القائمة الجانبية

### 2️⃣ تنفيذ كود إنشاء الجداول
انسخ والصق الكود التالي في SQL Editor واضغط Run:

```sql
-- إنشاء جدول المكاتب العقارية
CREATE TABLE IF NOT EXISTS real_estate_offices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    description TEXT,
    services TEXT[] DEFAULT '{}',
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    working_hours JSONB DEFAULT '{}',
    social_media JSONB DEFAULT '{}',
    logo_url TEXT,
    license_document_url TEXT,
    registration_certificate_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    documents_verified_count INTEGER DEFAULT 0,
    documents_pending_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بعرض جميع المكاتب النشطة
CREATE POLICY "Anyone can view active offices" ON real_estate_offices
    FOR SELECT USING (status IN ('active', 'pending'));

-- سياسة للسماح للمستخدمين بإنشاء مكاتبهم
CREATE POLICY "Users can insert their own office" ON real_estate_offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- سياسة للسماح للمستخدمين بتحديث مكاتبهم
CREATE POLICY "Users can update their own office" ON real_estate_offices
    FOR UPDATE USING (user_id = auth.uid());

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_user_id ON real_estate_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_status ON real_estate_offices(status);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_verified ON real_estate_offices(verified);
```

### 3️⃣ إضافة بيانات تجريبية (اختيارية)
```sql
-- إضافة مكتب تجريبي لاختبار النظام
INSERT INTO real_estate_offices (
    name, 
    license_number, 
    description, 
    phone, 
    email, 
    address, 
    services,
    status
) VALUES (
    'مكتب العقارات النموذجي', 
    'RE-2024-001', 
    'مكتب عقاري متخصص في بيع وشراء العقارات السكنية والتجارية',
    '+966501234567',
    'info@model-realestate.com',
    'الرياض، المملكة العربية السعودية',
    ARRAY['بيع العقارات', 'شراء العقارات', 'تأجير العقارات', 'إدارة العقارات'],
    'active'
);
```

### 4️⃣ تحديث أنواع TypeScript
في Terminal في مشروعك:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/database.types.ts
```

### 5️⃣ إعادة تشغيل التطبيق
```bash
npm run dev
```

## النتيجة المتوقعة:
✅ ستظهر المكاتب العقارية في الصفحة
✅ ستتمكن من إضافة مكاتب جديدة
✅ ستعمل جميع وظائف النظام

## في حالة استمرار المشكلة:
افتح Developer Console في المتصفح (F12) وشاهد رسائل الـ console للمزيد من التفاصيل.