-- =============================================
-- إنشاء جدول سجل تغييرات كلمات المرور
-- Password Changes Audit Log
-- =============================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS password_changes_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_email TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT,
    CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES auth.users(id),
    CONSTRAINT fk_target_user FOREIGN KEY (target_user_id) REFERENCES auth.users(id)
);

-- إنشاء فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_password_changes_changed_by ON password_changes_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_password_changes_target_user ON password_changes_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_password_changes_date ON password_changes_log(changed_at DESC);

-- تفعيل RLS
ALTER TABLE password_changes_log ENABLE ROW LEVEL SECURITY;

-- السياسة: فقط Super Admin يمكنه القراءة
DROP POLICY IF EXISTS "Super admins can view password changes log" ON password_changes_log;
CREATE POLICY "Super admins can view password changes log" ON password_changes_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
              AND role = 'super_admin' 
              AND active = TRUE
        )
    );

-- السياسة: فقط Super Admin يمكنه الإضافة
DROP POLICY IF EXISTS "Super admins can insert password changes log" ON password_changes_log;
CREATE POLICY "Super admins can insert password changes log" ON password_changes_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
              AND role = 'super_admin' 
              AND active = TRUE
        )
    );

-- إضافة تعليقات توضيحية
COMMENT ON TABLE password_changes_log IS 'سجل تغييرات كلمات المرور - يسجل جميع عمليات تغيير كلمات المرور من قبل المديرين';
COMMENT ON COLUMN password_changes_log.changed_by IS 'معرف المدير الذي قام بالتغيير';
COMMENT ON COLUMN password_changes_log.target_user_id IS 'معرف المستخدم الذي تم تغيير كلمة المرور له';
COMMENT ON COLUMN password_changes_log.target_user_email IS 'البريد الإلكتروني للمستخدم المستهدف';
COMMENT ON COLUMN password_changes_log.changed_at IS 'وقت التغيير';
COMMENT ON COLUMN password_changes_log.ip_address IS 'عنوان IP للمدير';
COMMENT ON COLUMN password_changes_log.user_agent IS 'معلومات المتصفح';
COMMENT ON COLUMN password_changes_log.notes IS 'ملاحظات إضافية';

-- =============================================
-- استعلامات مفيدة
-- =============================================

-- عرض آخر 10 تغييرات لكلمات المرور
-- SELECT 
--     pcl.id,
--     admin_user.email AS admin_email,
--     pcl.target_user_email,
--     pcl.changed_at,
--     pcl.notes
-- FROM password_changes_log pcl
-- LEFT JOIN auth.users admin_user ON pcl.changed_by = admin_user.id
-- ORDER BY pcl.changed_at DESC
-- LIMIT 10;

-- عرض جميع التغييرات لمستخدم معين
-- SELECT 
--     pcl.*,
--     admin_user.email AS changed_by_email
-- FROM password_changes_log pcl
-- LEFT JOIN auth.users admin_user ON pcl.changed_by = admin_user.id
-- WHERE pcl.target_user_email = '[EMAIL]'
-- ORDER BY pcl.changed_at DESC;

-- إحصائيات تغييرات كلمات المرور
-- SELECT 
--     DATE(changed_at) as date,
--     COUNT(*) as total_changes,
--     COUNT(DISTINCT changed_by) as unique_admins,
--     COUNT(DISTINCT target_user_id) as unique_users
-- FROM password_changes_log
-- GROUP BY DATE(changed_at)
-- ORDER BY date DESC;

-- =============================================
-- تم بنجاح ✅
-- =============================================
