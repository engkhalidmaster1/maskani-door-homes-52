-- إنشاء جدول audit_logs لتسجيل العمليات المهمة في النظام
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'login', 'logout')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('property', 'user', 'banner', 'auth', 'office')),
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- إنشاء فهرس مركب للاستعلامات الشائعة
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON public.audit_logs(user_id, action, created_at DESC);

-- سياسات الأمان (Row Level Security)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- السماح للمدراء بقراءة جميع السجلات
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- السماح للمستخدمين بقراءة سجلاتهم الخاصة فقط
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- السماح لجميع المستخدمين المسجلين بإدراج سجلات جديدة
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- منع التعديل والحذف (للحفاظ على سلامة السجلات)
-- لا توجد سياسات للتعديل أو الحذف، مما يعني أن السجلات لا يمكن تعديلها أو حذفها

-- دالة مساعدة للحصول على IP address
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS INET AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
        NULLIF(current_setting('request.headers', true)::json->>'x-real-ip', ''),
        inet_client_addr()
    )::INET;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على User Agent
CREATE OR REPLACE FUNCTION get_user_agent()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.headers', true)::json->>'user-agent';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة مساعدة لإدراج سجل audit
CREATE OR REPLACE FUNCTION log_audit_entry(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        COALESCE(p_user_id, auth.uid()),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        get_client_ip(),
        get_user_agent()
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers لتسجيل العمليات تلقائياً على العقارات
CREATE OR REPLACE FUNCTION audit_properties_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_entry('create', 'property', NEW.id::TEXT, to_jsonb(NEW), NEW.user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_entry('update', 'property', NEW.id::TEXT, 
            jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW),
                'changed_fields', (
                    SELECT array_agg(key)
                    FROM jsonb_each(to_jsonb(NEW)) 
                    WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
                )
            ), 
            NEW.user_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_entry('delete', 'property', OLD.id::TEXT, to_jsonb(OLD), OLD.user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الـ triggers
DROP TRIGGER IF EXISTS audit_properties_trigger ON public.properties;
CREATE TRIGGER audit_properties_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION audit_properties_changes();

-- Trigger لتسجيل عمليات تسجيل الدخول
CREATE OR REPLACE FUNCTION audit_auth_events()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
        PERFORM log_audit_entry('login', 'auth', NEW.id::TEXT, 
            jsonb_build_object('email', NEW.email, 'last_sign_in_at', NEW.last_sign_in_at),
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق trigger على جدول المستخدمين في auth
-- ملاحظة: هذا يتطلب صلاحيات خاصة في Supabase
-- CREATE TRIGGER audit_auth_trigger
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION audit_auth_events();

-- إنشاء view لعرض سجلات Audit بشكل مفصل
CREATE OR REPLACE VIEW audit_logs_detailed AS
SELECT 
    al.id,
    al.user_id,
    COALESCE(p.email, 'System') as user_email,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.created_at,
    -- إضافة معلومات إضافية بناءً على نوع المورد
    CASE 
        WHEN al.resource_type = 'property' AND al.resource_id IS NOT NULL THEN
            (SELECT title FROM public.properties WHERE id::TEXT = al.resource_id)
        ELSE NULL
    END as resource_title
FROM public.audit_logs al
LEFT JOIN auth.users p ON al.user_id = p.id
ORDER BY al.created_at DESC;

-- منح الصلاحيات المناسبة
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON audit_logs_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_entry TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_ip TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_agent TO authenticated;

-- إضافة تعليقات توضيحية
COMMENT ON TABLE public.audit_logs IS 'جدول تسجيل العمليات المهمة في النظام';
COMMENT ON COLUMN public.audit_logs.action IS 'نوع العملية: create, update, delete, view, login, logout';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'نوع المورد: property, user, banner, auth, office';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'معرف المورد المتأثر';
COMMENT ON COLUMN public.audit_logs.details IS 'تفاصيل إضافية عن العملية بصيغة JSON';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'عنوان IP الخاص بالمستخدم';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'معلومات المتصفح/التطبيق';

-- إضافة قيود إضافية لضمان جودة البيانات
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_not_empty 
    CHECK (length(trim(action)) > 0);
    
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_resource_type_not_empty 
    CHECK (length(trim(resource_type)) > 0);

-- رسالة نجاح
SELECT 'تم إنشاء جدول audit_logs ونظام تسجيل العمليات بنجاح! ✅' as message;