<#
generate-suggested-ddl.ps1

Produces suggested DDL updates for DB functions/views that call
`get_users_for_admin()` by replacing that call with `get_users_for_admin_v2()`.

Requires DATABASE_URL and psql. Output files are written to
supabase/migrations/suggested-ddl/
#>

param()

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputDir = Join-Path (Join-Path $scriptRoot '..') 'supabase\migrations\suggested-ddl'
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

if (-not $env:DATABASE_URL) { Write-Error 'Please set $env:DATABASE_URL'; exit 1 }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { Write-Error 'psql not found in PATH'; exit 1 }

$sql = @'
SELECT n.nspname || '.' || p.proname AS function_qualname,
       pg_get_functiondef(p.oid) AS current_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%get_users_for_admin%'
ORDER BY n.nspname, p.proname;
'@

$rows = psql $env:DATABASE_URL -At -F '|||' -c $sql | ConvertFrom-String -Delimiter '|||' | ForEach-Object {
  $fn = $_.P1; $def = $_.P2; [PSCustomObject]@{ Function = $fn; Definition = $def }
}

foreach ($r in $rows) {
  $suggested = $r.Definition -replace 'get_users_for_admin\(', 'get_users_for_admin_v2('
  $safeName = $r.Function -replace '[^a-zA-Z0-9_.-]', '_'
  $outPath = Join-Path $outputDir "$($safeName)_suggested.sql"
  $header = "-- Suggested DDL for $($r.Function)\n-- Replace calls to get_users_for_admin() with get_users_for_admin_v2() and review the results before applying.\n\n"
  Set-Content -Path $outPath -Value ($header + $suggested) -Encoding UTF8
  Write-Host "Wrote suggested DDL: $outPath"
}
