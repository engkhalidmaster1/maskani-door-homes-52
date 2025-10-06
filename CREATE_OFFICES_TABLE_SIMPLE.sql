-- ==================================================
-- كود إنشاء جدول المكاتب العقارية
-- انسخ والصق هذا الكود في Supabase SQL Editor
-- ==================================================

-- إنشاء جدول المكاتب العقارية
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

-- سياسة أمان: أي شخص يمكنه عرض المكاتب النشطة
CREATE POLICY "view_active_offices" ON real_estate_offices
    FOR SELECT USING (status IN ('active', 'pending'));

-- سياسة أمان: المستخدمون يمكنهم إنشاء مكاتبهم
CREATE POLICY "insert_own_office" ON real_estate_offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- سياسة أمان: المستخدمون يمكنهم تحديث مكاتبهم
CREATE POLICY "update_own_office" ON real_estate_offices
    FOR UPDATE USING (user_id = auth.uid());

-- سياسة أمان: المستخدمون يمكنهم حذف مكاتبهم  
CREATE POLICY "delete_own_office" ON real_estate_offices
    FOR DELETE USING (user_id = auth.uid());

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_offices_user_id ON real_estate_offices(user_id);
CREATE INDEX idx_offices_status ON real_estate_offices(status);
CREATE INDEX idx_offices_verified ON real_estate_offices(verified);
CREATE INDEX idx_offices_location ON real_estate_offices(latitude, longitude);

-- إضافة مكتب تجريبي للاختبار
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
    'RE-2024-TEST', 
    'مكتب عقاري متخصص في بيع وشراء العقارات السكنية والتجارية',
    '+966501234567',
    'info@test-realestate.com',
    'الرياض، المملكة العربية السعودية',
    ARRAY['بيع العقارات', 'شراء العقارات', 'تأجير العقارات'],
    'active'
);