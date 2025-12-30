<#
list-dependents.ps1

Runs a query that lists objects depending on public.get_users_for_admin
and saves output to supabase/migrations/dependents_get_users_for_admin.txt

Requires DATABASE_URL environment variable (psql client).
#>

param()

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outFile = Join-Path (Join-Path $scriptRoot '..') 'supabase\migrations\dependents_get_users_for_admin.txt'

if (-not $env:DATABASE_URL) {
  Write-Error 'Please set $env:DATABASE_URL to your Postgres connection string (psql required)'
  exit 1
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error 'psql client is not installed or not in PATH.'
  exit 1
}

$sql = @'
SELECT
  d.deptype AS dependency_type,
  CASE
    WHEN d.classid = 'pg_proc'::regclass THEN 'function'
    WHEN d.classid = 'pg_class'::regclass THEN 'relation'
    WHEN d.classid = 'pg_type'::regclass THEN 'type'
    ELSE d.classid::regclass::text
  END AS object_kind,
  COALESCE(p.proname, c.relname, t.typname, d.objid::text) AS object_name,
  COALESCE(ns.nspname, 'public') AS schema_name
FROM pg_depend d
LEFT JOIN pg_proc p ON p.oid = d.objid
LEFT JOIN pg_class c ON c.oid = d.objid
LEFT JOIN pg_type t ON t.oid = d.objid
LEFT JOIN pg_namespace ns ON ns.oid = COALESCE(p.pronamespace, c.relnamespace, t.typnamespace)
WHERE d.refobjid = (
  SELECT oid FROM pg_proc WHERE proname = 'get_users_for_admin' AND pronamespace = 'public'::regnamespace
)
ORDER BY object_kind, schema_name, object_name;
'@

Write-Host "Running dependents query and saving to $outFile"
psql $env:DATABASE_URL -At -F '|' -c $sql > $outFile
if ($LASTEXITCODE -ne 0) { Write-Error "psql failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
Write-Host "Saved dependents to: $outFile"
