-- ملف لتحديث مؤشرات النظام (مصحح لـ PostgreSQL)
-- شغل هذا الملف بعد CREATE_SYSTEM_MONITORING_FUNCTIONS_FINAL.sql

-- إدراج بيانات تجريبية للمؤشرات
INSERT INTO system_metrics (active_connections, total_requests, failed_requests, avg_response_time, cpu_usage, memory_usage, disk_usage, uptime_hours)
VALUES
    (45, 1250, 12, 245.5, 52.3, 48.7, 32.1, 168),
    (52, 1380, 8, 238.2, 48.9, 45.3, 31.8, 169),
    (38, 1120, 15, 252.8, 55.1, 51.2, 33.5, 170),
    (61, 1450, 6, 231.9, 47.2, 43.8, 30.9, 171),
    (49, 1320, 10, 241.3, 50.8, 47.5, 32.7, 172);

-- إدراج تنبيهات تجريبية
INSERT INTO system_alerts (alert_type, title, description, action_required) VALUES
    ('warning', 'ارتفاع استخدام الذاكرة', 'استخدام الذاكرة تجاوز 80%', 'تحقق من العمليات النشطة'),
    ('error', 'فشل في الاتصال بقاعدة البيانات', 'تم اكتشاف فشل في الاتصال', 'إعادة تشغيل الخدمة'),
    ('info', 'تحديث النظام مطلوب', 'يتوفر تحديث أمان جديد', 'جدولة التحديث'),
    ('critical', 'مساحة القرص منخفضة', 'مساحة القرص المتبقية أقل من 10%', 'حذف الملفات غير الضرورية');

-- إدراج سجلات النسخ الاحتياطي
INSERT INTO backup_logs (backup_type, status, file_size_mb, duration_seconds) VALUES
    ('full', 'completed', 1250.5, 1800),
    ('incremental', 'completed', 450.2, 600),
    ('full', 'completed', 1248.8, 1750),
    ('incremental', 'failed', NULL, NULL);

-- تحديث آخر تنبيه ليبدو قديمًا
UPDATE system_alerts
SET created_at = NOW() - INTERVAL '2 days'
WHERE id = (SELECT id FROM system_alerts LIMIT 1);

-- حل أحد التنبيهات
UPDATE system_alerts
SET resolved = TRUE, resolved_at = NOW() - INTERVAL '1 day'
WHERE alert_type = 'info';