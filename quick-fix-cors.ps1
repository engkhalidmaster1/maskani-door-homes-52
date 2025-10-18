# ========================================
# حل سريع لمشكلة CORS
# Quick Fix for CORS Error
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "🔴 خطأ CORS - Edge Function غير منشور!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "سأقوم بنشر Edge Function الآن..." -ForegroundColor Cyan
Write-Host ""

# المعلومات المكتشفة من الخطأ
$projectId = "ugefzrktqeyspnzhxzzw"

Write-Host "✅ Project ID المكتشف: $projectId" -ForegroundColor Green
Write-Host ""

# الخطوة 1: تثبيت Supabase CLI
Write-Host "📦 [1/4] تثبيت Supabase CLI..." -ForegroundColor Cyan
npm install -g supabase

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ فشل التثبيت! جرب يدوياً:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "أو استخدم npx بدلاً:" -ForegroundColor Yellow
    Write-Host "npx supabase login" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ تم التثبيت!" -ForegroundColor Green
Write-Host ""

# الخطوة 2: تسجيل الدخول
Write-Host "🔐 [2/4] تسجيل الدخول..." -ForegroundColor Cyan
Write-Host "⚠️  سيفتح المتصفح - اضغط 'Allow access'" -ForegroundColor Yellow
Write-Host ""

supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ فشل تسجيل الدخول!" -ForegroundColor Red
    Write-Host "جرب يدوياً: supabase login" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ تم تسجيل الدخول!" -ForegroundColor Green
Write-Host ""

# الخطوة 3: ربط المشروع
Write-Host "🔗 [3/4] ربط المشروع..." -ForegroundColor Cyan
Write-Host "Project ID: $projectId" -ForegroundColor Gray
Write-Host ""

supabase link --project-ref $projectId

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ فشل ربط المشروع!" -ForegroundColor Red
    Write-Host ""
    Write-Host "جرب الحصول على Project ID يدوياً من:" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard/project/$projectId/settings/general" -ForegroundColor Cyan
    Write-Host ""
    $manualId = Read-Host "الصق Reference ID هنا (أو اضغط Enter للمحاولة مرة أخرى)"
    
    if (![string]::IsNullOrWhiteSpace($manualId)) {
        supabase link --project-ref $manualId
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ فشل مرة أخرى!" -ForegroundColor Red
            pause
            exit 1
        }
    } else {
        pause
        exit 1
    }
}

Write-Host "✅ تم ربط المشروع!" -ForegroundColor Green
Write-Host ""

# الخطوة 4: نشر Edge Function
Write-Host "🚀 [4/4] نشر Edge Function..." -ForegroundColor Cyan
Write-Host ""

supabase functions deploy create-user

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ فشل نشر Edge Function!" -ForegroundColor Red
    Write-Host ""
    Write-Host "جرب التحقق من المجلد:" -ForegroundColor Yellow
    Write-Host "d:\projects\sakani\‏‏sakani\supabase\functions\create-user\" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ تم نشر Edge Function بنجاح! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# التحقق النهائي
Write-Host "🔍 التحقق من النشر..." -ForegroundColor Cyan
Write-Host ""

supabase functions list

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. افتح: http://localhost:8082/admin/add-user" -ForegroundColor White
Write-Host "2. جرب إضافة مستخدم جديد" -ForegroundColor White
Write-Host "3. يجب أن يعمل الآن بدون خطأ CORS!" -ForegroundColor White
Write-Host ""
Write-Host "✅ Edge Function URL:" -ForegroundColor Green
Write-Host "https://$projectId.supabase.co/functions/v1/create-user" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط أي مفتاح للخروج..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
