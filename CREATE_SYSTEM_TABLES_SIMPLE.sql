-- ملف مبسط لإنشاء جداول المراقبة بدون RLS
-- شغل هذا أولاً، ثم SETUP_RLS_POLICIES.sql

-- جدول مؤشرات النظام
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    active_connections INTEGER DEFAULT 0,
    total_requests BIGINT DEFAULT 0,
    failed_requests BIGINT DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    memory_usage DECIMAL(5,2) DEFAULT 0,
    disk_usage DECIMAL(5,2) DEFAULT 0,
    uptime_hours INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التنبيهات
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(20) CHECK (alert_type IN ('info', 'warning', 'error')),
    title TEXT NOT NULL,
    description TEXT,
    action_required VARCHAR(50),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول سجل النسخ الاحتياطية
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type VARCHAR(20) DEFAULT 'automatic',
    status VARCHAR(20) DEFAULT 'completed',
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);

-- إدراج بيانات تجريبية
INSERT INTO system_metrics (active_connections, total_requests, failed_requests, avg_response_time, cpu_usage, memory_usage, disk_usage, uptime_hours)
VALUES (45, 125000, 1250, 245.50, 52.3, 48.7, 35.2, 168);

INSERT INTO system_metrics (active_connections, total_requests, failed_requests, avg_response_time, cpu_usage, memory_usage, disk_usage, uptime_hours)
VALUES (52, 128000, 1180, 267.80, 58.9, 52.1, 36.8, 172);

INSERT INTO system_alerts (alert_type, title, description, action_required, resolved)
VALUES ('warning', 'ارتفاع في عدد الاتصالات', 'عدد الاتصالات النشطة تجاوز 60% من الحد المسموح', 'monitor', false);

INSERT INTO system_alerts (alert_type, title, description, action_required, resolved)
VALUES ('info', 'تحديث تلقائي مكتمل', 'تم تحديث النظام إلى الإصدار الأحدث بنجاح', NULL, true);