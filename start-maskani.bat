@echo off
chcp 65001 >nul
title تطبيق سكني - Maskani Real Estate App

echo.
echo ========================================
echo    🏠 تطبيق "سكني" للعقارات 🏠
echo         Maskani Real Estate App
echo ========================================
echo.

REM التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ خطأ: Node.js غير مثبت على النظام
    echo يرجى تثبيت Node.js من: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM عرض إصدار Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% متوفر

REM التحقق من وجود npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ خطأ: npm غير متوفر
    echo.
    pause
    exit /b 1
)

REM عرض إصدار npm
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% متوفر
echo.

REM التحقق من وجود package.json
if not exist "package.json" (
    echo ❌ خطأ: ملف package.json غير موجود
    echo تأكد من أنك في مجلد المشروع الصحيح
    echo.
    pause
    exit /b 1
)

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo 📦 تثبيت التبعيات...
    echo جاري تثبيت الحزم المطلوبة، قد يستغرق هذا بضع دقائق...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت التبعيات
        echo تحقق من اتصال الإنترنت وحاول مرة أخرى
        echo.
        pause
        exit /b 1
    )
    echo ✅ تم تثبيت التبعيات بنجاح
    echo.
) else (
    echo ✅ التبعيات موجودة مسبقاً
    echo.
)

REM عرض معلومات التشغيل
echo 🚀 بدء تشغيل خادم التطوير...
echo.
echo 📱 ستتمكن من الوصول للتطبيق عبر:
echo    🌐 المحلي: http://localhost:8081
echo    🔗 الشبكة: http://[your-ip]:8081
echo.
echo 💡 نصائح هامة:
echo    • اضغط Ctrl+C لإيقاف التطبيق
echo    • اضغط Ctrl+Click على الرابط لفتحه في المتصفح
echo    • أي تغييرات في الكود ستظهر تلقائياً (Hot Reload)
echo.
echo 🆕 الميزات الجديدة المضافة:
echo    ❤️  نظام المفضلة متكامل
echo    🔒 مربوط بقاعدة البيانات والمستخدم
echo    📱 زر مفضلة في كل عقار
echo    📄 صفحة مفضلة منفصلة
echo.
echo ========================================
echo.

REM إنشاء تأخير قصير
timeout /t 2 /nobreak >nul

REM تشغيل التطبيق
call npm run dev

REM في حالة توقف التطبيق
echo.
echo 🛑 تم إيقاف خادم التطوير
echo.
echo شكراً لاستخدام تطبيق "سكني" 🏠
echo.
pause