-- إعداد سياسات RLS بعد إنشاء الجداول
-- شغل هذا الملف بعد CREATE_SYSTEM_MONITORING_TABLES.sql

-- تفعيل RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS بسيطة للمستخدمين المعتمدين
DROP POLICY IF EXISTS "system_metrics_policy" ON system_metrics;
CREATE POLICY "system_metrics_policy" ON system_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "system_alerts_policy" ON system_alerts;
CREATE POLICY "system_alerts_policy" ON system_alerts
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "backup_logs_policy" ON backup_logs;
CREATE POLICY "backup_logs_policy" ON backup_logs
    FOR SELECT USING (auth.role() = 'authenticated');