-- التحقق من صحة إعداد نظام المراقبة
-- شغل هذا الملف بعد إعداد الجداول والدوال

SELECT '=== فحص الجداول ===' as section;

-- التحقق من وجود الجداول
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('system_metrics', 'system_alerts', 'backup_logs')
ORDER BY tablename;

SELECT '=== فحص الدوال ===' as section;

-- التحقق من وجود الدوال
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
    'get_system_metrics',
    'get_active_alerts',
    'resolve_alert',
    'create_system_alert',
    'update_system_metrics',
    'get_alerts_stats'
)
ORDER BY proname;

SELECT '=== فحص البيانات ===' as section;

-- التحقق من البيانات التجريبية
SELECT 'system_metrics count' as table_name, COUNT(*) as record_count FROM system_metrics
UNION ALL
SELECT 'system_alerts count', COUNT(*) FROM system_alerts
UNION ALL
SELECT 'backup_logs count', COUNT(*) FROM backup_logs;

SELECT '=== اختبار الدوال ===' as section;

-- اختبار الدوال
SELECT 'Testing get_system_metrics...' as test;
SELECT * FROM get_system_metrics();

SELECT 'Testing get_active_alerts...' as test;
SELECT * FROM get_active_alerts();

SELECT 'Testing get_alerts_stats...' as test;
SELECT * FROM get_alerts_stats();

SELECT '=== فحص الصلاحيات ===' as section;

-- التحقق من الصلاحيات
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('system_metrics', 'system_alerts', 'backup_logs')
ORDER BY tablename;

SELECT '=== النتيجة النهائية ===' as section;
SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM system_metrics) > 0 THEN '✅ مؤشرات النظام: جاهز'
        ELSE '❌ مؤشرات النظام: غير جاهز'
    END as system_metrics_status,
    CASE
        WHEN (SELECT COUNT(*) FROM system_alerts) > 0 THEN '✅ التنبيهات: جاهزة'
        ELSE '❌ التنبيهات: غير جاهزة'
    END as alerts_status,
    CASE
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_system_metrics') > 0 THEN '✅ الدوال: جاهزة'
        ELSE '❌ الدوال: غير جاهزة'
    END as functions_status;