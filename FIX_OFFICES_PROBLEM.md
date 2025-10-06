# 🔧 مشكلة عدم ظهور المكاتب العقارية - التشخيص والحل

## 🔍 التشخيص:
تم اكتشاف أن جدول `real_estate_offices` **غير موجود** في قاعدة البيانات.

هذا يفسر:
- ❌ عدم ظهور المكاتب المضافة
- ❌ أخطاء TypeScript في استعلامات Supabase
- ❌ رسائل خطأ في وحدة تحكم المتصفح

## ⚡ الحل العاجل:

### الخطوة 1: انسخ هذا الكود
```sql
CREATE TABLE real_estate_offices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_active_offices" ON real_estate_offices
    FOR SELECT USING (status IN ('active', 'pending'));

CREATE POLICY "manage_own_office" ON real_estate_offices
    FOR ALL USING (user_id = auth.uid());

INSERT INTO real_estate_offices (
    name, license_number, description, phone, address, services, status
) VALUES (
    'مكتب العقارات التجريبي', 
    'RE-TEST-001', 
    'مكتب تجريبي للاختبار',
    '+966501234567',
    'الرياض، السعودية',
    ARRAY['بيع العقارات', 'شراء العقارات'],
    'active'
);
```

### الخطوة 2: تنفيذ الكود
1. اذهب إلى [supabase.com](https://supabase.com)
2. افتح مشروعك
3. اختر **SQL Editor**
4. الصق الكود أعلاه
5. اضغط **Run**

### الخطوة 3: إعادة تحميل التطبيق
بعد تنفيذ SQL، أعد تحميل صفحة المتصفح بـ `Ctrl + F5`

## 📱 النتيجة المتوقعة:
✅ ستظهر رسالة "تم العثور على 1 مكتب عقاري"
✅ ستتمكن من إضافة مكاتب جديدة 
✅ ستعمل جميع وظائف البحث والعرض

## 🐛 في حالة استمرار المشكلة:
افتح Developer Tools في المتصفح (F12) وتحقق من:
- تبويب Console للأخطاء
- تبويب Network لاستعلامات قاعدة البيانات

---
💡 **ملاحظة**: هذه مشكلة في إعداد قاعدة البيانات وليس في الكود.