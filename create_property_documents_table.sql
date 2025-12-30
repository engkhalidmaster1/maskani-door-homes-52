-- إضافة جدول مستندات العقارات
CREATE TABLE IF NOT EXISTS property_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    document_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ownership', 'identity', 'permit', 'survey', 'contract', 'other')),
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_user_id ON property_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_verified ON property_documents(verified);
CREATE INDEX IF NOT EXISTS idx_property_documents_type ON property_documents(type);
CREATE INDEX IF NOT EXISTS idx_property_documents_document_id ON property_documents(document_id);

-- تحديث trigger لـ updated_at
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

-- إعداد RLS (Row Level Security)
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: يمكن للجميع رؤية المستندات الموثقة، والمالكون يمكنهم رؤية مستنداتهم
CREATE POLICY "Users can view verified documents or their own documents" ON property_documents
    FOR SELECT USING (
        verified = TRUE 
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = property_documents.property_id 
            AND p.user_id = auth.uid()
        )
    );

-- سياسة للإدراج: المستخدمون المسجلون يمكنهم رفع مستندات لعقاراتهم
CREATE POLICY "Users can insert documents for their properties" ON property_documents
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM properties p 
                WHERE p.id = property_documents.property_id 
                AND p.user_id = auth.uid()
            )
        )
    );

-- سياسة للتحديث: المالكون والمكاتب العقارية يمكنهم تحديث المستندات
CREATE POLICY "Users can update their own documents or office staff can verify" ON property_documents
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = property_documents.property_id 
            AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM real_estate_offices o
            WHERE o.user_id = auth.uid()
            AND o.verified = TRUE
            AND o.status = 'active'
        )
    );

-- سياسة للحذف: المالكون فقط يمكنهم حذف مستنداتهم
CREATE POLICY "Users can delete their own documents" ON property_documents
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = property_documents.property_id 
            AND p.user_id = auth.uid()
        )
    );

-- إنشاء bucket للمستندات في Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- سياسات Storage للمستندات
CREATE POLICY "Users can view verified documents or their own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-documents' AND (
            auth.uid() IS NOT NULL
            -- يمكن إضافة منطق إضافي للتحكم في الوصول للملفات
        )
    );

CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-documents' 
        AND auth.uid() IS NOT NULL
        -- المسار يجب أن يبدأ بمعرف المستخدم أو العقار
    );

CREATE POLICY "Users can update their documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-documents'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-documents'
        AND auth.uid() IS NOT NULL
    );

-- إضافة عمود لحفظ معرف المكتب العقاري في جدول العقارات (إذا لم يكن موجوداً)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES real_estate_offices(id) ON DELETE SET NULL;

-- فهرس للمكاتب العقارية
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON properties(office_id);

-- تحديث جدول المكاتب العقارية لإضافة حقل إحصائيات المستندات
ALTER TABLE real_estate_offices 
ADD COLUMN IF NOT EXISTS documents_verified_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS documents_pending_count INTEGER DEFAULT 0;

-- دالة لتحديث إحصائيات المستندات للمكاتب العقارية
CREATE OR REPLACE FUNCTION update_office_document_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إحصائيات المكتب العقاري المرتبط بالعقار
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE real_estate_offices 
        SET 
            documents_verified_count = (
                SELECT COUNT(*) FROM property_documents pd
                JOIN properties p ON p.id = pd.property_id
                WHERE p.office_id = real_estate_offices.id
                AND pd.verified = TRUE
            ),
            documents_pending_count = (
                SELECT COUNT(*) FROM property_documents pd
                JOIN properties p ON p.id = pd.property_id
                WHERE p.office_id = real_estate_offices.id
                AND pd.verified = FALSE
            )
        WHERE id = (
            SELECT p.office_id FROM properties p 
            WHERE p.id = NEW.property_id
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE real_estate_offices 
        SET 
            documents_verified_count = (
                SELECT COUNT(*) FROM property_documents pd
                JOIN properties p ON p.id = pd.property_id
                WHERE p.office_id = real_estate_offices.id
                AND pd.verified = TRUE
            ),
            documents_pending_count = (
                SELECT COUNT(*) FROM property_documents pd
                JOIN properties p ON p.id = pd.property_id
                WHERE p.office_id = real_estate_offices.id
                AND pd.verified = FALSE
            )
        WHERE id = (
            SELECT p.office_id FROM properties p 
            WHERE p.id = OLD.property_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث الإحصائيات
DROP TRIGGER IF EXISTS update_office_document_stats ON property_documents;
CREATE TRIGGER update_office_document_stats
    AFTER INSERT OR UPDATE OR DELETE ON property_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_office_document_stats();