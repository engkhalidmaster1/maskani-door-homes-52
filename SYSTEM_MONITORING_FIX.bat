@echo off
REM دليل إصلاح نظام المراقبة خطوة بخطوة

echo.
echo ================================================
echo    إصلاح نظام مراقبة حالة النظام
echo ================================================
echo.
echo الخطوات المطلوبة:
echo.
echo 1. اذهب إلى https://supabase.com/dashboard
echo 2. افتح مشروعك (ugefzrktqeyspnzhxzzw)
echo 3. اذهب إلى SQL Editor
echo.
echo 4. شغل هذا الملف أولاً:
echo    CREATE_SYSTEM_TABLES_SIMPLE.sql
echo.
echo 5. ثم شغل هذا الملف:
echo    CREATE_SYSTEM_MONITORING_FUNCTIONS.sql
echo.
echo 6. ثم شغل هذا الملف:
echo    UPDATE_SYSTEM_METRICS.sql
echo.
echo 7. أخيراً شغل هذا الملف للتحقق:
echo    VERIFY_SYSTEM_MONITORING_SETUP.sql
echo.
echo ================================================
echo.
echo بعد الانتهاء:
echo - شغل: npm run dev
echo - اذهب إلى: http://localhost:8083/dashboard
echo - اضغط على "حالة النظام"
echo.
echo ================================================
echo.
pause