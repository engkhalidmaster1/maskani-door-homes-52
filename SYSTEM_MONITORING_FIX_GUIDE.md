# دليل إصلاح أخطاء نظام المراقبة

## المشاكل التي واجهتها:

1. **خطأ في عمود `profiles.role`** - العمود غير موجود
2. **خطأ في syntax** - مشاكل في RLS policies
3. **خطأ في `ON CONFLICT`** - غير مدعوم في بعض إصدارات PostgreSQL

## الحل خطوة بخطوة:

### الخطوة 1: إنشاء الجداول الأساسية
```sql
-- انسخ محتوى ملف CREATE_SYSTEM_TABLES_SIMPLE.sql والصقه في SQL Editor
-- اضغط Run
```

### الخطوة 2: إنشاء الدوال
```sql
-- انسخ محتوى ملف CREATE_SYSTEM_MONITORING_FUNCTIONS.sql والصقه في SQL Editor
-- اضغط Run
```

### الخطوة 3: إدراج بيانات تجريبية إضافية
```sql
-- انسخ محتوى ملف UPDATE_SYSTEM_METRICS.sql والصقه في SQL Editor
-- اضغط Run
```

### الخطوة 4: التحقق من الإعداد
```sql
-- انسخ محتوى ملف VERIFY_SYSTEM_MONITORING_SETUP.sql والصقه في SQL Editor
-- اضغط Run
```

## إذا كان هناك خطأ في RLS:

### إعداد RLS لاحقاً (اختياري):
```sql
-- تفعيل RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- سياسات بسيطة
CREATE POLICY "metrics_select" ON system_metrics FOR SELECT USING (true);
CREATE POLICY "alerts_all" ON system_alerts FOR ALL USING (true);
CREATE POLICY "backups_select" ON backup_logs FOR SELECT USING (true);
```

## اختبار النظام:

بعد الانتهاء من جميع الخطوات:
1. شغل `npm run dev`
2. اذهب إلى `http://localhost:8083/dashboard`
3. اضغط على تبويب "حالة النظام"
4. يجب أن ترى البيانات الحقيقية من قاعدة البيانات

## استكشاف الأخطاء:

### إذا ظهرت أخطاء:
1. تأكد من تشغيل الملفات بالترتيب المحدد
2. تحقق من وجود أخطاء في console
3. جرب تشغيل `VERIFY_SYSTEM_MONITORING_SETUP.sql` للتحقق

### إعادة تشغيل من البداية:
```sql
-- حذف الجداول إذا لزم الأمر
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS backup_logs CASCADE;

-- ثم أعد تشغيل الخطوات من البداية
```