<#
run-migrations.ps1

Safely run SQL migration files from supabase/migrations in lexicographical order.

Usage (recommended):
  # Preferred: provide DATABASE_URL (psql must be installed on runner)
  $env:DATABASE_URL = 'postgres://user:pass@host:5432/db'
  ./scripts/run-migrations.ps1

  # Alternative: provide SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF
  $env:SUPABASE_ACCESS_TOKEN = '...'
  $env:SUPABASE_PROJECT_REF = 'your-project-ref'
  ./scripts/run-migrations.ps1

The script will detect potentially destructive migration files (DROP ... CASCADE)
and require interactive confirmation before running them.
#>

param(
  [switch]$DryRun
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$migrationsDir = Join-Path (Join-Path $scriptRoot '..') 'supabase\migrations'

if (-not (Test-Path $migrationsDir)) {
  Write-Error "Migrations directory not found: $migrationsDir"
  exit 1
}

$migrations = Get-ChildItem -Path $migrationsDir -Filter '*.sql' -File | Sort-Object Name
if ($migrations.Count -eq 0) {
  Write-Host "No migration files found in $migrationsDir"
  exit 0
}

Write-Host "Found $($migrations.Count) migration(s) in $migrationsDir"

# Detect destructive migrations
$destructivePatterns = @('DROP FUNCTION', 'DROP TYPE', 'CASCADE', 'DROP TRIGGER', 'DROP VIEW')
$destructive = @()
foreach ($m in $migrations) {
  $content = Get-Content -Raw -Path $m.FullName
  foreach ($pat in $destructivePatterns) {
    if ($content -match [regex]::Escape($pat)) {
      $destructive += $m
      break
    }
  }
}

if ($destructive.Count -gt 0) {
  Write-Host "⚠️  Detected potentially destructive migrations:"
  $destructive | ForEach-Object { Write-Host "  - $($_.Name)" }
  $confirm = Read-Host "Proceed with applying destructive migrations? (y/N)"
  if ($confirm.ToLower() -ne 'y') {
    Write-Host "Aborting before destructive migrations. You can run with -DryRun to preview or re-run after manual review."
    exit 0
  }
}

# Prefer psql if DATABASE_URL is available
if ($env:DATABASE_URL) {
  if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql not found. Install PostgreSQL client or provide SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF to use supabase CLI."
    exit 1
  }

  foreach ($m in $migrations) {
    Write-Host "Applying: $($m.Name)"
    if ($DryRun) { continue }
    & psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $m.FullName
    if ($LASTEXITCODE -ne 0) { Write-Error "psql returned exit code $LASTEXITCODE"; exit $LASTEXITCODE }
  }
  Write-Host "All migrations applied via psql."
  exit 0
}

# Fallback: supabase CLI using project ref and token (will push schema/migrations)
if ($env:SUPABASE_ACCESS_TOKEN -and $env:SUPABASE_PROJECT_REF) {
  Write-Host "Using supabase CLI to push migrations (requires supabase CLI installed via npm)
"
  if ($DryRun) { Write-Host "Dry run: would run 'npx supabase db push'"; exit 0 }
  # Login and link
  npx supabase login --token $env:SUPABASE_ACCESS_TOKEN
  npx supabase link --project-ref $env:SUPABASE_PROJECT_REF
  npx supabase db push
  if ($LASTEXITCODE -ne 0) { Write-Error "supabase db push failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
  Write-Host "Supabase db push completed."
  exit 0
}

Write-Error "No DATABASE_URL or SUPABASE_ACCESS_TOKEN+SUPABASE_PROJECT_REF found. Set one of these to run migrations."
exit 1
