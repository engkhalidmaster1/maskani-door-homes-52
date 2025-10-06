## تعليمات إعداد قاعدة البيانات

### 1. افتح Supabase Dashboard
- اذهب إلى مشروعك في Supabase
- انقر على "SQL Editor" من القائمة الجانبية

### 2. نسخ والصق كود SQL التالي:

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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    documents_verified_count INTEGER DEFAULT 0,
    documents_pending_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_user_id ON real_estate_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_verified ON real_estate_offices(verified);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_status ON real_estate_offices(status);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_license ON real_estate_offices(license_number);

-- RLS
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view verified offices or their own" ON real_estate_offices
    FOR SELECT USING (verified = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can insert their own office" ON real_estate_offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own office" ON real_estate_offices
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own office" ON real_estate_offices
    FOR DELETE USING (user_id = auth.uid());
```

### 3. تشغيل الكود
- انقر على زر "Run" أو اضغط Ctrl+Enter

### 4. تحديث Types
بعد إنشاء الجدول، قم بتشغيل:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### 5. حالة النظام الحالية
- ✅ النظام يعمل حالياً بالبيانات التجريبية
- ✅ جميع المزايا متاحة ومختبرة  
- ✅ يعمل على المنفذ: http://localhost:8083
- 🔄 بعد إنشاء الجدول في Supabase، سيتم ربط البيانات الحقيقية

### المزايا المتاحة حالياً:
- تسجيل المكاتب العقارية
- عرض قائمة المكاتب
- البحث في المكاتب
- نظام التوثيق والمستندات
- خرائط تفاعلية لاختيار المواقع