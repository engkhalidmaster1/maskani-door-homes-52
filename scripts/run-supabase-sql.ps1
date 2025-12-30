<#
PowerShell helper: run the cleaned Supabase SQL setup script with psql.
Usage examples:
  $env:DATABASE_URL = 'postgres://user:password@host:5432/dbname'
  .\scripts\run-supabase-sql.ps1

  Or pass the URL directly:
  .\scripts\run-supabase-sql.ps1 -DatabaseUrl 'postgres://user:password@host:5432/dbname'

Requirements:
  - psql (PostgreSQL client) in PATH, or run the SQL inside Supabase SQL Editor.
#>

param(
  [Parameter(Mandatory=$false)]
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [Parameter(Mandatory=$false)]
  [string]$SqlFile = (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) '..\supabase\clean_supabase_setup.sql')
)

if (-not (Test-Path $SqlFile)) {
  Write-Error "SQL file not found: $SqlFile"
  exit 2
}

if (-not $DatabaseUrl) {
  Write-Host "DATABASE_URL not provided. To run the script set the environment variable or pass -DatabaseUrl."
  Write-Host "Example: $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'; .\scripts\run-supabase-sql.ps1"
  exit 0
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error "psql not found in PATH. Install PostgreSQL client tools or run the SQL in Supabase SQL Editor."
  exit 3
}

Write-Host "Executing $SqlFile against the database..."
& psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $SqlFile
if ($LASTEXITCODE -ne 0) {
  Write-Error "psql exited with code $LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host "Execution completed successfully."