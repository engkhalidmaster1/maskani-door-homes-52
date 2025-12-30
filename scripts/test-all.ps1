Write-Host "🧪 Running comprehensive test suite..." -ForegroundColor Cyan

# Run type checking
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Yellow
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type check failed" -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host "🔍 Running ESLint..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed" -ForegroundColor Red
    exit 1
}

# Run unit tests
Write-Host "🧪 Running unit tests..." -ForegroundColor Yellow
npm run test:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Unit tests failed" -ForegroundColor Red
    exit 1
}

# Run build test
Write-Host "🏗️ Testing production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build test failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All tests passed successfully!" -ForegroundColor Green