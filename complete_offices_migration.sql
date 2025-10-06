-- ==================================================
-- هجرة قاعدة البيانات الشاملة لنظام المكاتب العقارية
-- يجب تشغيل هذا الملف في Supabase SQL Editor
-- ==================================================

-- 1. إنشاء جدول المكاتب العقارية
-- ==================================================
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

-- 2. إنشاء جدول مراجعات المكاتب العقارية
-- ==================================================
CREATE TABLE IF NOT EXISTS office_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_id UUID NOT NULL REFERENCES real_estate_offices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    reviewer_phone TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جدول مستندات العقارات (إذا لم يكن موجود)
-- ==================================================
CREATE TABLE IF NOT EXISTS property_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    office_id UUID REFERENCES real_estate_offices(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'ownership_deed', 'id_copy', 'property_survey', 'building_permit',
        'electricity_bill', 'water_bill', 'tax_clearance', 'other'
    )),
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES real_estate_offices(id),
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. إنشاء جدول طلبات التواصل مع المكاتب
-- ==================================================
CREATE TABLE IF NOT EXISTS office_contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_id UUID NOT NULL REFERENCES real_estate_offices(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_email TEXT,
    message TEXT NOT NULL,
    contact_method TEXT DEFAULT 'whatsapp' CHECK (contact_method IN ('whatsapp', 'phone', 'email')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- إنشاء الفهارس لتحسين الأداء
-- ==================================================

-- فهارس جدول المكاتب العقارية
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_user_id ON real_estate_offices(user_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_verified ON real_estate_offices(verified);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_status ON real_estate_offices(status);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_license ON real_estate_offices(license_number);
CREATE INDEX IF NOT EXISTS idx_real_estate_offices_location ON real_estate_offices(latitude, longitude);

-- فهارس جدول المراجعات
CREATE INDEX IF NOT EXISTS idx_office_reviews_office_id ON office_reviews(office_id);
CREATE INDEX IF NOT EXISTS idx_office_reviews_user_id ON office_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_office_reviews_approved ON office_reviews(approved);
CREATE INDEX IF NOT EXISTS idx_office_reviews_rating ON office_reviews(rating);

-- فهارس جدول المستندات
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_office_id ON property_documents(office_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_uploaded_by ON property_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_property_documents_verified ON property_documents(verified);

-- فهارس جدول طلبات التواصل
CREATE INDEX IF NOT EXISTS idx_office_contact_requests_office_id ON office_contact_requests(office_id);
CREATE INDEX IF NOT EXISTS idx_office_contact_requests_status ON office_contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_office_contact_requests_created_at ON office_contact_requests(created_at);

-- ==================================================
-- إنشاء Triggers للتحديث التلقائي
-- ==================================================

-- Trigger لجدول المكاتب العقارية
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

-- Trigger لجدول المراجعات
CREATE OR REPLACE FUNCTION update_office_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_office_reviews_updated_at ON office_reviews;
CREATE TRIGGER update_office_reviews_updated_at
    BEFORE UPDATE ON office_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_office_reviews_updated_at();

-- Trigger لجدول المستندات
CREATE OR REPLACE FUNCTION update_property_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_property_documents_updated_at ON property_documents;
CREATE TRIGGER update_property_documents_updated_at
    BEFORE UPDATE ON property_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_property_documents_updated_at();

-- ==================================================
-- إعداد Row Level Security (RLS)
-- ==================================================

-- تفعيل RLS للجداول
ALTER TABLE real_estate_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_contact_requests ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول المكاتب العقارية
CREATE POLICY "Users can view verified offices or their own" ON real_estate_offices
    FOR SELECT USING (verified = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can insert their own office" ON real_estate_offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own office" ON real_estate_offices
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own office" ON real_estate_offices
    FOR DELETE USING (user_id = auth.uid());

-- سياسات الأمان لجدول المراجعات
CREATE POLICY "Anyone can view approved reviews" ON office_reviews
    FOR SELECT USING (approved = TRUE);

CREATE POLICY "Users can insert reviews" ON office_reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reviews" ON office_reviews
    FOR UPDATE USING (user_id = auth.uid() OR approved = FALSE);

-- سياسات الأمان لجدول المستندات
CREATE POLICY "Users can view their own documents or verified ones" ON property_documents
    FOR SELECT USING (uploaded_by = auth.uid() OR verified = TRUE);

CREATE POLICY "Users can insert their own documents" ON property_documents
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents" ON property_documents
    FOR UPDATE USING (uploaded_by = auth.uid());

-- سياسات الأمان لجدول طلبات التواصل
CREATE POLICY "Office owners can view their contact requests" ON office_contact_requests
    FOR SELECT USING (
        office_id IN (SELECT id FROM real_estate_offices WHERE user_id = auth.uid())
    );

CREATE POLICY "Anyone can insert contact requests" ON office_contact_requests
    FOR INSERT WITH CHECK (true);

-- ==================================================
-- إدراج بيانات تجريبية (اختياري)
-- ==================================================

-- إدراج مكاتب تجريبية (فقط إذا لم تكن موجودة)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM real_estate_offices WHERE license_number = 'RE001') THEN
        INSERT INTO real_estate_offices (
            user_id, name, license_number, description, services, phone, email, website,
            address, latitude, longitude, working_hours, verified, status
        ) VALUES 
        (
            (SELECT id FROM auth.users LIMIT 1),
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
            '{"saturday": {"open": "09:00", "close": "17:00", "closed": false}}'::jsonb,
            TRUE,
            'active'
        );
    END IF;
END $$;

-- ==================================================
-- رسالة تأكيد الإنجاز
-- ==================================================
SELECT 'تم إنشاء جميع جداول نظام المكاتب العقارية بنجاح! ✅' as message,
       'الجداول المنشأة: real_estate_offices, office_reviews, property_documents, office_contact_requests' as tables_created;