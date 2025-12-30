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

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_user_id ON real_estate_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_verified ON real_estate_offices(verified);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_status ON real_estate_offices(status);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_license ON real_estate_offices(license_number);

-- إنشاء trigger للـ updated_at
CREATE OR REPLACE FUNCTION update_real_estate_offices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_real_estate_offices_updated_at ON real_estate_offices;
CREATE TRIGGER update_real_estate_offices_updated_at
    BEFORE UPDATE ON real_estate_offices
    FOR EACH ROW
    EXECUTE FUNCTION update_real_estate_offices_updated_at();

-- إعداد RLS (Row Level Security)
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: الجميع يمكنهم رؤية المكاتب الموثقة، المالكون يمكنهم رؤية مكاتبهم
CREATE POLICY "Users can view verified offices or their own" ON real_estate_offices
    FOR SELECT USING (
        verified = TRUE 
        OR user_id = auth.uid()
    );

-- سياسة للإدراج: المستخدمون المسجلون يمكنهم إنشاء مكتب
CREATE POLICY "Users can insert their own office" ON real_estate_offices
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- سياسة للتحديث: المالكون يمكنهم تحديث مكاتبهم
CREATE POLICY "Users can update their own office" ON real_estate_offices
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- سياسة للحذف: المالكون يمكنهم حذف مكاتبهم
CREATE POLICY "Users can delete their own office" ON real_estate_offices
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- إضافة بعض البيانات التجريبية
INSERT INTO real_estate_offices (
    user_id,
    name,
    license_number,
    description,
    services,
    phone,
    email,
    website,
    address,
    latitude,
    longitude,
    working_hours,
    verified,
    status
) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1), -- أول مستخدم في النظام
    'مكتب العقارات الذهبية',
    'RE001',
    'مكتب عقاري متخصص في بيع وشراء العقارات السكنية والتجارية مع خبرة تزيد عن 10 سنوات',
    ARRAY['بيع العقارات', 'تأجير العقارات', 'إدارة الممتلكات', 'التقييم العقاري'],
    '+964 771 234 5678',
    'info@golden-properties.com',
    'https://golden-properties.com',
    'بغداد، الكرادة داخل، شارع الكرادة الرئيسي، مجمع الكرادة التجاري',
    33.3128,
    44.3615,
    '{"saturday": {"open": "09:00", "close": "17:00", "closed": false}, "sunday": {"open": "09:00", "close": "17:00", "closed": false}, "monday": {"open": "09:00", "close": "17:00", "closed": false}, "tuesday": {"open": "09:00", "close": "17:00", "closed": false}, "wednesday": {"open": "09:00", "close": "17:00", "closed": false}, "thursday": {"open": "09:00", "close": "17:00", "closed": false}, "friday": {"open": "09:00", "close": "17:00", "closed": true}}'::jsonb,
    TRUE,
    'active'
),
(
    (SELECT id FROM auth.users LIMIT 1), -- أول مستخدم في النظام
    'مكتب النجمة للعقارات',
    'RE002',
    'خبرة 15 عام في السوق العقاري العراقي، متخصصون في العقارات الفاخرة والاستثمارية',
    ARRAY['بيع العقارات', 'الاستشارات العقارية', 'التسويق العقاري'],
    '+964 750 123 4567',
    'contact@star-realestate.iq',
    NULL,
    'بغداد، المنصور، شارع الأميرات، برج المنصور',
    33.3095,
    44.3492,
    '{"saturday": {"open": "08:00", "close": "18:00", "closed": false}, "sunday": {"open": "08:00", "close": "18:00", "closed": false}, "monday": {"open": "08:00", "close": "18:00", "closed": false}, "tuesday": {"open": "08:00", "close": "18:00", "closed": false}, "wednesday": {"open": "08:00", "close": "18:00", "closed": false}, "thursday": {"open": "08:00", "close": "18:00", "closed": false}, "friday": {"open": "08:00", "close": "18:00", "closed": true}}'::jsonb,
    FALSE,
    'pending'
);

-- رسالة تأكيد
SELECT 'تم إنشاء جدول المكاتب العقارية بنجاح!' as message;