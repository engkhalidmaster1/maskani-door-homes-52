# ========================================
# Deploy Edge Function - نشر Edge Function
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 نشر Edge Function لمشروع Maskani" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# الخطوة 1: تثبيت Supabase CLI
Write-Host "📦 الخطوة 1: تثبيت Supabase CLI..." -ForegroundColor Green
npm install -g supabase

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل التثبيت! جرب يدوياً: npm install -g supabase" -ForegroundColor Red
    exit 1
}

Write-Host "✅ تم التثبيت بنجاح!" -ForegroundColor Green
Write-Host ""

# الخطوة 2: تسجيل الدخول
Write-Host "🔐 الخطوة 2: تسجيل الدخول إلى Supabase..." -ForegroundColor Green
Write-Host "⚠️  سيفتح المتصفح - اضغط 'Allow access' للموافقة" -ForegroundColor Yellow
Write-Host ""

supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل تسجيل الدخول!" -ForegroundColor Red
    Write-Host "جرب يدوياً: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ تم تسجيل الدخول بنجاح!" -ForegroundColor Green
Write-Host ""

# الخطوة 3: طلب Project ID
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 الخطوة 3: ربط المشروع" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "احصل على Project Reference ID من:" -ForegroundColor Yellow
Write-Host "https://supabase.com/dashboard/project/_/settings/general" -ForegroundColor Cyan
Write-Host ""

# فتح الصفحة تلقائياً
Start-Process "https://supabase.com/dashboard/project/_/settings/general"
Start-Sleep -Seconds 2

$projectId = Read-Host "الصق Reference ID هنا"

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "❌ لم تدخل Project ID!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 ربط المشروع: $projectId" -ForegroundColor Green
supabase link --project-ref $projectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل ربط المشروع!" -ForegroundColor Red
    Write-Host "تأكد من Project ID وجرب مرة أخرى" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ تم ربط المشروع بنجاح!" -ForegroundColor Green
Write-Host ""

# الخطوة 4: نشر Edge Function
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 الخطوة 4: نشر Edge Function" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

supabase functions deploy create-user

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل نشر Edge Function!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ تم نشر Edge Function بنجاح! 🎉" -ForegroundColor Green
Write-Host ""

# الخطوة 5: التحقق
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ التحقق من النشر" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

supabase functions list

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 تم بنجاح! النظام جاهز للاستخدام" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الآن يمكنك:" -ForegroundColor Yellow
Write-Host "1. فتح: http://localhost:8082/admin/add-user" -ForegroundColor Cyan
Write-Host "2. إضافة مستخدم جديد" -ForegroundColor Cyan
Write-Host "3. التحقق من نجاح الإنشاء" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط أي مفتاح للخروج..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
