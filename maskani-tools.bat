@echo off
chcp 65001 >nul
title Maskani - Complete Development Tools

echo.
echo =============================================
echo    🏠 Maskani - Complete Tools Suite 🏠
echo       Development and Maintenance Tools
echo =============================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Show Node.js and npm versions
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo Node.js %NODE_VERSION% and npm %NPM_VERSION% are available
echo.

REM Main menu
:MAIN_MENU
cls
echo.
echo =============================================
echo    🏠 Maskani - Complete Tools Suite 🏠
echo =============================================
echo.
echo Development and Maintenance Tools:
echo.
echo   [1] 🚀 Run Web Application (Development)
echo   [2] 🖥️  Run Desktop Application (Electron)
echo   [3] 📦 Install/Update Dependencies
echo   [4] 🔍 Check and Fix Project
echo   [5] 🏗️  Build for Production
echo   [6] 📱 Build Desktop Applications
echo   [7] 🧹 Clean Project
echo   [8] 🔧 Advanced Maintenance Tools
echo   [9] 📊 System and Project Information
echo   [0] ❌ Exit
echo.
echo =============================================
echo.
set /p choice=Choose operation number: 

if "%choice%"=="1" goto WEB_DEV
if "%choice%"=="2" goto ELECTRON_DEV
if "%choice%"=="3" goto INSTALL_DEPS
if "%choice%"=="4" goto CHECK_PROJECT
if "%choice%"=="5" goto BUILD_PROD
if "%choice%"=="6" goto BUILD_DESKTOP
if "%choice%"=="7" goto CLEAN_PROJECT
if "%choice%"=="8" goto ADVANCED_TOOLS
if "%choice%"=="9" goto SYSTEM_INFO
if "%choice%"=="0" goto EXIT
echo Invalid choice, please try again
pause
goto MAIN_MENU

REM Run web development server
:WEB_DEV
cls
echo.
echo 🚀 Starting Web Development Server...
echo.
echo Application will be available at: http://localhost:8081
echo Press Ctrl+C to stop the server
echo.
call npm run dev
echo.
echo Development server stopped
pause
goto MAIN_MENU

REM Run Electron application
:ELECTRON_DEV
cls
echo.
echo 🖥️ Starting Desktop Application...
echo.
call npm run electron-dev
echo.
echo Desktop application closed
pause
goto MAIN_MENU

REM Install dependencies
:INSTALL_DEPS
cls
echo.
echo 📦 Installing/Updating Dependencies...
echo.
echo Installing packages, this may take a few minutes...
call npm install --legacy-peer-deps
if %errorlevel% equ 0 (
    echo Dependencies installed successfully
) else (
    echo Failed to install dependencies
)
echo.
pause
goto MAIN_MENU

REM Check project
:CHECK_PROJECT
cls
echo.
echo 🔍 Checking and Fixing Project...
echo.
echo 1️⃣ Checking TypeScript...
call npx tsc --noEmit
echo.
echo 2️⃣ Checking ESLint...
call npx eslint src --ext .ts,.tsx
echo.
echo 3️⃣ Checking project structure...
if not exist "src\main.tsx" echo Missing src\main.tsx file
if not exist "package.json" echo Missing package.json file
if not exist "vite.config.ts" echo Missing vite.config.ts file
if not exist "node_modules" echo Missing node_modules folder
echo.
echo Project check completed
pause
goto MAIN_MENU

REM Build for production
:BUILD_PROD
cls
echo.
echo 🏗️ Building for Production...
echo.
call npm run build
if %errorlevel% equ 0 (
    echo Project built successfully in dist folder
    echo Files can be found in: dist\
) else (
    echo Failed to build project
)
echo.
pause
goto MAIN_MENU

REM Build desktop applications
:BUILD_DESKTOP
cls
echo.
echo 📱 Building Desktop Applications...
echo.
echo Choose build type:
echo   [1] Windows only
echo   [2] All platforms
echo.
set /p build_choice=Choose build type: 

if "%build_choice%"=="1" (
    echo Building Windows application...
    call npm run package-win
) else if "%build_choice%"=="2" (
    echo Building for all platforms...
    call npm run dist-all
) else (
    echo Invalid choice
    pause
    goto BUILD_DESKTOP
)

if %errorlevel% equ 0 (
    echo Applications built successfully
    echo Applications in folder: dist-packaged\
) else (
    echo Failed to build applications
)
echo.
pause
goto MAIN_MENU

REM Clean project
:CLEAN_PROJECT
cls
echo.
echo 🧹 Cleaning Project...
echo.
echo Warning: This will delete:
echo   - node_modules folder
echo   - dist folder
echo   - dist-electron folder
echo   - dist-packaged folder
echo   - cache files
echo.
set /p confirm=Are you sure? (y/n): 
if /i not "%confirm%"=="y" goto MAIN_MENU

echo Cleaning...
if exist "node_modules" rmdir /s /q "node_modules" && echo Deleted node_modules
if exist "dist" rmdir /s /q "dist" && echo Deleted dist
if exist "dist-electron" rmdir /s /q "dist-electron" && echo Deleted dist-electron
if exist "dist-packaged" rmdir /s /q "dist-packaged" && echo Deleted dist-packaged
call npm cache clean --force >nul 2>nul && echo Cleaned npm cache

echo.
echo Project cleaned successfully
echo Don't forget to install dependencies again (option 3)
pause
goto MAIN_MENU

REM Advanced tools
:ADVANCED_TOOLS
cls
echo.
echo 🔧 Advanced Maintenance Tools...
echo.
echo   [1] 🔄 Fresh Install Dependencies
echo   [2] 🛠️ Fix npm Issues
echo   [3] 🔍 Security Audit
echo   [4] 📈 Bundle Analysis
echo   [5] 🧪 Run Tests
echo   [6] 🔙 Back to Main Menu
echo.
set /p adv_choice=Choose operation: 

if "%adv_choice%"=="1" goto FRESH_INSTALL
if "%adv_choice%"=="2" goto FIX_NPM
if "%adv_choice%"=="3" goto SECURITY_AUDIT
if "%adv_choice%"=="4" goto BUNDLE_ANALYSIS
if "%adv_choice%"=="5" goto RUN_TESTS
if "%adv_choice%"=="6" goto MAIN_MENU
echo Invalid choice
pause
goto ADVANCED_TOOLS

:FRESH_INSTALL
echo 🔄 Fresh install of dependencies...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
call npm install --legacy-peer-deps
echo Dependencies reinstalled
pause
goto ADVANCED_TOOLS

:FIX_NPM
echo 🛠️ Fixing npm issues...
call npm cache clean --force
call npm audit fix --legacy-peer-deps
echo npm issues fixed
pause
goto ADVANCED_TOOLS

:SECURITY_AUDIT
echo 🔍 Security audit...
call npm audit
pause
goto ADVANCED_TOOLS

:BUNDLE_ANALYSIS
echo 📈 Bundle analysis...
call npm run build
echo Bundle analysis available in dist folder
pause
goto ADVANCED_TOOLS

:RUN_TESTS
echo 🧪 Running tests...
call npm test
pause
goto ADVANCED_TOOLS

REM System information
:SYSTEM_INFO
cls
echo.
echo 📊 System and Project Information...
echo.
echo 🖥️ System Information:
node --version
npm --version
echo.
echo 📁 Project Information:
if exist "package.json" (
    for /f "tokens=2 delims=:" %%a in ('findstr "\"name\"" package.json') do echo Project Name: %%a
    for /f "tokens=2 delims=:" %%a in ('findstr "\"version\"" package.json') do echo Version: %%a
)
echo.
echo 📦 Dependencies Status:
if exist "node_modules" (echo node_modules exists) else (echo node_modules missing)
if exist "package-lock.json" (echo package-lock.json exists) else (echo package-lock.json missing)
echo.
echo 🔧 Configuration Files:
if exist "vite.config.ts" (echo vite.config.ts exists) else (echo vite.config.ts missing)
if exist "tsconfig.json" (echo tsconfig.json exists) else (echo tsconfig.json missing)
if exist "tailwind.config.ts" (echo tailwind.config.ts exists) else (echo tailwind.config.ts missing)
echo.
pause
goto MAIN_MENU

:EXIT
cls
echo.
echo 👋 Thank you for using Maskani Tools
echo 🏠 See you soon!
echo.
timeout /t 2 /nobreak >nul
exit /b 0