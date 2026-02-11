@echo off
echo ========================================
echo    تشغيل تطبيق سكني - النسخة السريعة
echo ========================================

REM فحص إذا كان السيرفر يعمل على المنفذ 8083 (Vite)
netstat -an | find "8083" >nul 2>&1
if %errorlevel%==0 (
    echo السيرفر يعمل بالفعل على المنفذ 8083
    echo سيتم فتح التطبيق في المتصفح...
    start http://localhost:8083
    goto :end
)

REM فحص إذا كان السيرفر يعمل على المنفذ 5173
netstat -an | find "5173" >nul 2>&1
if %errorlevel%==0 (
    echo السيرفر يعمل بالفعل على المنفذ 5173
    echo سيتم تشغيل نسخة إضافية على المنفذ 8083 لتجنب التداخل...
    npm run dev -- --port 8083 --open
    goto :end
)

REM فحص إذا كان السيرفر يعمل على المنفذ 3000
netstat -an | find "3000" >nul 2>&1
if %errorlevel%==0 (
    echo السيرفر يعمل بالفعل على المنفذ 3000
    echo سيتم تشغيل نسخة إضافية على المنفذ 8083 لتجنب التداخل...
    npm run dev -- --port 8083 --open
    goto :end
)

echo بدء تشغيل السيرفر على المنفذ 8083...
echo.

REM تشغيل npm run dev على المنفذ 8083
npm run dev -- --port 8083 --open

:end
echo.
echo تم الانتهاء من العملية.
pause