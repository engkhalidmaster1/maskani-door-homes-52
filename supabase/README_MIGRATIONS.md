# Supabase Migrations - Safe workflow

This repository contains Postgres / Supabase migration files under `supabase/migrations/`.
Some migrations are destructive (drop/rename) and must be applied with care.

What this folder contains (important files):

- `20251018120000_set_user_role_and_remove_featured.sql` - creates `set_user_role` RPC and removes `featured_properties` keys from `user_permissions`.
- `20251018000000_restore_and_fix_super_admin.sql` - ensures the protected super-admin exists and hardens triggers.
- `20251018005000_ensure_super_admin_status.sql` - ensures super-admin `user_statuses` row with unlimited limits.
- `20251019090000_create_get_users_for_admin_v2_and_list_dependents.sql` - **safe** migration that creates `get_users_for_admin_v2()` and provides helper queries to list DB dependents.
- `20251019100000_retire_get_users_for_admin_if_safe.sql` - **conditional** migration that drops/renames the old function only if there are no DB dependents.

Scripts in `scripts/`:

- `run-migrations.ps1` - PowerShell helper that runs SQL files in order. Prefers `psql` via `DATABASE_URL`, falls back to supabase CLI when `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` provided. Detects destructive migrations and asks for confirmation.
 - `run-test-migration.ps1` - PowerShell helper that runs a smoke-test SQL file (`supabase/migrations/20251115000100_test_set_app_settings_fix.sql`) to verify `set_app_settings` and `set_maintenance_mode` behaviors. Requires `DATABASE_URL` to be set in CI or locally.
- `list-dependents.ps1` - run this to list DB objects that depend on `get_users_for_admin()`.
- `generate-suggested-ddl.ps1` - produce suggested DDL updates for DB functions that call `get_users_for_admin()` by replacing the call with `get_users_for_admin_v2()` (manual review required).

CI integration:

There is a manual GitHub Actions workflow `.github/workflows/apply-migrations.yml` that will run `npx supabase db push` when manually dispatched and when `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are configured in repository secrets.

Safety checklist before applying migrations:

1. Take a full database backup or snapshot.
2. Run `scripts/list-dependents.ps1` (or run the SQL from `20251019090000_*`) and inspect the dependent objects.
3. Use `scripts/generate-suggested-ddl.ps1` to produce suggested DDL for dependent functions/views. Edit and review them.
4. Update DB functions/views and test in staging.
5. After dependents are migrated, run `20251019100000_retire_get_users_for_admin_if_safe.sql` which will retire the old function only when it is safe.

Extra: Test `set_app_settings` and `set_maintenance_mode` locally

- Run `npm run db:test-migration` (requires `DATABASE_URL` env and `psql` client). This executes `supabase/migrations/20251115000100_test_set_app_settings_fix.sql` which will print notices with before/after values and toggle maintenance mode.

Note: After applying `20251020010000_create_app_settings_table.sql` which adds safer WHERE/UPSERT behavior,
the client-side fallback that updated `app_settings` directly has been removed to avoid bypassing RLS.
If you have automation dependent on the fallback, please update to call the RPCs instead.

CI: You can configure `DATABASE_URL` as a secret and use the `Test Supabase Migrations` workflow provided in `.github/workflows/test-migrations.yml` to automatically run the smoke-test after migrations.

If you want assistance updating DB functions or migrating dependents, open a PR with the suggested DDL changes and request a review.
