@echo off
chcp 65001 >nul
color 0A
title تشغيل مسكني - Maskani على المنفذ 8080

echo ==========================================
echo    تشغيل تطبيق مسكني - Maskani
echo    المنفذ: 8080
echo ==========================================
echo.

REM التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت!
    echo يرجى تثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

echo [✓] Node.js متاح
echo.

REM التحقق من وجود المجلد
if not exist "%~dp0package.json" (
    echo [خطأ] ملف package.json غير موجود!
    pause
    exit /b 1
)

echo [✓] المشروع موجود
echo.

REM التحقق من وجود node_modules
if not exist "%~dp0node_modules" (
    echo [!] تثبيت الحزم للمرة الأولى...
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل تثبيت الحزم!
        pause
        exit /b 1
    )
    echo [✓] تم تثبيت الحزم بنجاح
    echo.
)

REM إيقاف أي عملية تعمل على المنفذ 8080
echo [i] التحقق من المنفذ 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo [i] إيقاف العملية %%a على المنفذ 8080...
    taskkill /F /PID %%a >nul 2>nul
)
echo.

echo ==========================================
echo    بدء تشغيل التطبيق...
echo ==========================================
echo.
echo [i] الرجاء الانتظار حتى يبدأ التطبيق...
echo [i] سيفتح المتصفح تلقائياً على:
echo     http://localhost:8080
echo.
echo [!] للإيقاف: اضغط Ctrl+C
echo ==========================================
echo.

REM فتح المتصفح بعد 5 ثواني من بدء التشغيل
start /B cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:8080"

REM تشغيل التطبيق على المنفذ 8080
set PORT=8080
npm run dev -- --port 8080 --host

pause
