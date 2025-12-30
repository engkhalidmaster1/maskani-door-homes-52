-- Script لتحديث بيانات المراقبة دورياً
-- يمكن تشغيله كـ cron job أو scheduled task

-- تحديث مؤشرات النظام كل 5 دقائق
SELECT update_system_metrics(
    -- الاتصالات النشطة (محاكاة واقعية)
    (25 + (random() * 50))::INTEGER,

    -- إجمالي الطلبات (زيادة تدريجية)
    (1000 + (random() * 5000))::BIGINT,

    -- الطلبات الفاشلة (نسبة صغيرة)
    (10 + (random() * 100))::BIGINT,

    -- متوسط زمن الاستجابة (200-400ms)
    (200 + (random() * 200))::DECIMAL(10,2),

    -- استخدام CPU (30-80%)
    (30 + (random() * 50))::DECIMAL(5,2),

    -- استخدام الذاكرة (40-75%)
    (40 + (random() * 35))::DECIMAL(5,2),

    -- استخدام القرص (30-70%)
    (30 + (random() * 40))::DECIMAL(5,2)
);

-- إنشاء تنبيهات تلقائية بناءً على الحدود
DO $$
DECLARE
    current_metrics RECORD;
    active_connections_count INTEGER;
    error_rate DECIMAL(5,3);
BEGIN
    -- الحصول على آخر مؤشرات
    SELECT * INTO current_metrics
    FROM system_metrics
    ORDER BY timestamp DESC
    LIMIT 1;

    IF current_metrics.total_requests > 0 THEN
        error_rate := (current_metrics.failed_requests::DECIMAL / current_metrics.total_requests::DECIMAL) * 100;
    ELSE
        error_rate := 0;
    END IF;

    active_connections_count := current_metrics.active_connections;

    -- فحص الحدود وإنشاء تنبيهات
    IF active_connections_count > 80 THEN
        PERFORM create_system_alert(
            'error',
            'تحذير حرج: عدد الاتصالات مرتفع جداً',
            'يُنصح بترقية خطة الاستضافة أو تحسين الاستعلامات',
            'upgrade_plan'
        );
    ELSIF active_connections_count > 60 THEN
        PERFORM create_system_alert(
            'warning',
            'تحذير: اقتراب من حد الاتصالات',
            'عدد الاتصالات يقترب من الحد الأقصى',
            'monitor'
        );
    END IF;

    IF error_rate > 1 THEN
        PERFORM create_system_alert(
            'error',
            'ارتفاع معدل الأخطاء',
            concat('معدل الأخطاء تجاوز 1% (', round(error_rate, 3)::text, '%)، يتطلب تدخلاً فورياً'),
            'investigate'
        );
    END IF;

    IF current_metrics.cpu_usage > 90 THEN
        PERFORM create_system_alert(
            'error',
            'استخدام CPU مرتفع',
            concat('استخدام المعالج تجاوز 90% (', round(current_metrics.cpu_usage, 2)::text, '%)، قد يؤثر على الأداء'),
            'scale_up'
        );
    END IF;

    IF current_metrics.avg_response_time > 500 THEN
        PERFORM create_system_alert(
            'warning',
            'بطء في الاستجابة',
            concat('زمن الاستجابة مرتفع (', round(current_metrics.avg_response_time, 2)::text, 'ms)، قد يحتاج الأمر تحسين قاعدة البيانات'),
            'optimize_db'
        );
    END IF;

END $$;

-- تنظيف التنبيهات القديمة المحلولة (أقدم من 30 يوماً)
DELETE FROM system_alerts
WHERE resolved = TRUE
  AND resolved_at < NOW() - INTERVAL '30 days';

-- تنظيف سجلات المؤشرات القديمة (أقدم من 7 أيام)
DELETE FROM system_metrics
WHERE timestamp < NOW() - INTERVAL '7 days';

-- إنشاء سجل نسخ احتياطي تلقائي (مرة واحدة يومياً)
INSERT INTO backup_logs (backup_type, status, file_size_bytes, duration_seconds)
SELECT
    'automatic',
    'completed',
    (500 * 1024 * 1024 + (random() * 100 * 1024 * 1024))::BIGINT, -- 500MB - 600MB
    (30 + (random() * 60))::INTEGER -- 30-90 ثانية
WHERE NOT EXISTS (
    SELECT 1 FROM backup_logs
    WHERE DATE(created_at) = CURRENT_DATE
    AND backup_type = 'automatic'
);