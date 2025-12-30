@echo off
echo 🚀 Starting deployment process...

REM Check if environment variables are set
if "%VITE_SUPABASE_URL%"=="" (
    echo ❌ Error: VITE_SUPABASE_URL is not set
    exit /b 1
)

if "%VITE_SUPABASE_ANON_KEY%"=="" (
    echo ❌ Error: VITE_SUPABASE_ANON_KEY is not set
    exit /b 1
)

echo ✅ Environment variables are set

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Run quality checks
echo 🔍 Running quality checks...
call npm run quality-check
if %errorlevel% neq 0 (
    echo ❌ Quality checks failed
    exit /b 1
)

REM Build application
echo 🏗️ Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Build completed successfully

REM Optional: Deploy to hosting service
echo 📤 Ready for deployment
echo Run one of the following commands to deploy:
echo - Web: Upload the 'dist' folder to your hosting provider
echo - Desktop: npm run dist-all

echo 🎉 Deployment preparation complete!