-- ==================================================
-- نظام إدارة وموافقة المكاتب العقارية
-- يتم تشغيل هذا في Supabase SQL Editor
-- ==================================================

-- 1. إنشاء جدول المديرين
-- ==================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions JSONB DEFAULT '{"approve_offices": true, "manage_users": false, "view_reports": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    active BOOLEAN DEFAULT TRUE
);

-- 2. إنشاء جدول الإشعارات
-- ==================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    related_office_id UUID REFERENCES real_estate_offices(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جدول سجل أنشطة الإدارة
-- ==================================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES admin_users(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'approve', 'reject', 'suspend', 'activate'
    target_office_id UUID REFERENCES real_estate_offices(id) ON DELETE CASCADE,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. تفعيل Row Level Security للجداول الجديدة
-- ==================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء سياسات الأمان للمديرين
-- ==================================================
-- سياسة عرض بيانات المديرين للمديرين فقط
CREATE POLICY "Admins can view admin users" ON admin_users
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- سياسة إضافة مديرين جدد للمديرين الكبار فقط
CREATE POLICY "Super admins can insert admin users" ON admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND active = TRUE
        )
    );

-- 6. سياسات الأمان للإشعارات
-- ==================================================
-- المستخدمون يمكنهم عرض إشعاراتهم فقط
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- المديرون يمكنهم إنشاء إشعارات
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- المستخدمون يمكنهم تحديث إشعاراتهم (تحديد كمقروءة)
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 7. سياسات سجل الأنشطة
-- ==================================================
-- المديرون يمكنهم عرض سجل الأنشطة
CREATE POLICY "Admins can view activity log" ON admin_activity_log
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- المديرون يمكنهم إضافة إلى سجل الأنشطة
CREATE POLICY "Admins can insert activity log" ON admin_activity_log
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- 8. تعديل سياسات المكاتب العقارية لدعم المديرين
-- ==================================================
-- حذف السياسة الحالية إذا كانت موجودة
DROP POLICY IF EXISTS "view_active_offices" ON real_estate_offices;

-- إنشاء سياسة جديدة تسمح للمديرين برؤية جميع المكاتب
CREATE POLICY "View offices based on role" ON real_estate_offices
    FOR SELECT USING (
        -- المكاتب النشطة يمكن لأي شخص رؤيتها
        status = 'active' 
        -- أو المالكون يمكنهم رؤية مكاتبهم
        OR user_id = auth.uid()
        -- أو المديرون يمكنهم رؤية جميع المكاتب
        OR auth.uid() IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- سياسة تحديث المكاتب للمالكين والمديرين
DROP POLICY IF EXISTS "update_own_office" ON real_estate_offices;
CREATE POLICY "Update offices policy" ON real_estate_offices
    FOR UPDATE USING (
        -- المالكون يمكنهم تحديث مكاتبهم
        user_id = auth.uid()
        -- أو المديرون يمكنهم تحديث أي مكتب
        OR auth.uid() IN (SELECT user_id FROM admin_users WHERE active = TRUE)
    );

-- 9. إنشاء فهارس للأداء
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_office ON admin_activity_log(target_office_id);

-- 10. إضافة مدير تجريبي (يجب تغيير هذا للبريد الإلكتروني الحقيقي)
-- ==================================================
-- ملاحظة: يجب استبدال 'admin@maskani.com' ببريد إلكتروني حقيقي
-- INSERT INTO admin_users (user_id, role, created_by)
-- SELECT id, 'super_admin', id 
-- FROM auth.users 
-- WHERE email = 'admin@maskani.com'
-- LIMIT 1;

-- 11. تحديث المكاتب الموجودة لتصبح في حالة الانتظار
-- ==================================================
UPDATE real_estate_offices 
SET status = 'pending' 
WHERE status = 'active' AND verified = FALSE;

-- 12. إنشاء دالة لإرسال إشعار عند تغيير حالة المكتب
-- ==================================================
CREATE OR REPLACE FUNCTION notify_office_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- إشعار صاحب المكتب عند تغيير الحالة
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, title, message, type, related_office_id)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.status = 'active' THEN 'تم قبول مكتبك العقاري'
                WHEN NEW.status = 'suspended' THEN 'تم تعليق مكتبك العقاري'
                WHEN NEW.status = 'inactive' THEN 'تم إلغاء تفعيل مكتبك العقاري'
                ELSE 'تم تحديث حالة مكتبك العقاري'
            END,
            CASE 
                WHEN NEW.status = 'active' THEN 'مبروك! تم قبول مكتبك العقاري وأصبح مفعلاً الآن'
                WHEN NEW.status = 'suspended' THEN 'تم تعليق مكتبك العقاري مؤقتاً. يرجى التواصل مع الإدارة'
                WHEN NEW.status = 'inactive' THEN 'تم إلغاء تفعيل مكتبك العقاري. يرجى التواصل مع الإدارة'
                ELSE 'تم تحديث حالة مكتبك العقاري إلى: ' || NEW.status
            END,
            CASE 
                WHEN NEW.status = 'active' THEN 'success'
                WHEN NEW.status IN ('suspended', 'inactive') THEN 'warning'
                ELSE 'info'
            END,
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. إنشاء Trigger للإشعارات
-- ==================================================
DROP TRIGGER IF EXISTS office_status_notification ON real_estate_offices;
CREATE TRIGGER office_status_notification
    AFTER UPDATE ON real_estate_offices
    FOR EACH ROW
    EXECUTE FUNCTION notify_office_status_change();

-- ==================================================
-- انتهى إعداد نظام الإدارة
-- ==================================================