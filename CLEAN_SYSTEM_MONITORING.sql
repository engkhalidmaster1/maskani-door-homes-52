-- تنظيف نظام المراقبة (استخدم بحذر)
-- شغل هذا الملف إذا كنت تريد إعادة البدء من الصفر

-- حذف الجداول والدوال
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS backup_logs CASCADE;

DROP FUNCTION IF EXISTS get_system_metrics() CASCADE;
DROP FUNCTION IF EXISTS get_active_alerts() CASCADE;
DROP FUNCTION IF EXISTS resolve_alert(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_system_alert(VARCHAR, TEXT, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_system_metrics(INTEGER, BIGINT, BIGINT, DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_alerts_stats() CASCADE;

-- حذف الفهارس (إذا كانت موجودة)
DROP INDEX IF EXISTS idx_system_metrics_timestamp;
DROP INDEX IF EXISTS idx_system_alerts_resolved;
DROP INDEX IF EXISTS idx_backup_logs_created_at;

SELECT 'تم تنظيف نظام المراقبة بنجاح. يمكنك الآن إعادة إنشائه.' as status;