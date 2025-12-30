param(
  [switch]$DryRun
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$testFile = Join-Path (Join-Path $scriptRoot '..') 'supabase\migrations\20251115000100_test_set_app_settings_fix.sql'

if (-not (Test-Path $testFile)) {
  Write-Error "Test SQL file not found: $testFile"
  exit 1
}

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is not set. Set this env var to run the test SQL via psql (recommended for CI)."
  exit 1
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql is not installed on this runner. Install PostgreSQL client or configure DATABASE_URL locally."
  exit 1
}

Write-Host "Running test migration: $testFile"
if ($DryRun) { Write-Host "Dry run: would run psql -f $testFile"; exit 0 }

& psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $testFile
if ($LASTEXITCODE -ne 0) { Write-Error "psql returned exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "Test migration executed successfully."