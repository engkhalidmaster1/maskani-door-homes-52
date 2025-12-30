@echo off
REM Script لإعداد جداول ودوال مراقبة النظام في Supabase
REM تأكد من تسجيل الدخول إلى Supabase CLI أولاً

echo إنشاء جداول مراقبة النظام...
supabase db push --file CREATE_SYSTEM_MONITORING_TABLES.sql

echo.
echo إنشاء دوال RPC...
supabase db push --file CREATE_SYSTEM_MONITORING_FUNCTIONS.sql

echo.
echo تحديث البيانات الأولية...
supabase db push --file UPDATE_SYSTEM_METRICS.sql

echo.
echo تم إعداد نظام المراقبة بنجاح!
echo يمكنك الآن تشغيل UPDATE_SYSTEM_METRICS.sql دورياً لتحديث البيانات

pause