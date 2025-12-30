-- إصلاح قيد التحقق لجدول system_alerts
-- شغل هذا الملف قبل UPDATE_SYSTEM_METRICS_FINAL.sql

-- إزالة القيد القديم
ALTER TABLE system_alerts DROP CONSTRAINT IF EXISTS system_alerts_alert_type_check;

-- إضافة القيد الجديد مع 'critical'
ALTER TABLE system_alerts ADD CONSTRAINT system_alerts_alert_type_check
CHECK (alert_type IN ('info', 'warning', 'error', 'critical'));