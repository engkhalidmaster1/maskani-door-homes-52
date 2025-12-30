-- RLS and grants for dynamic roles and verification

alter table public.role_limits_by_name enable row level security;

drop policy if exists rl_read_role_limits on public.role_limits_by_name;
create policy rl_read_role_limits
on public.role_limits_by_name
for select
to authenticated
using (true);

drop policy if exists rl_write_role_limits on public.role_limits_by_name;
create policy rl_write_role_limits
on public.role_limits_by_name
for all
to authenticated
using ( public.is_admin(auth.uid()) )
with check ( public.is_admin(auth.uid()) );

alter table public.user_verifications enable row level security;

drop policy if exists rl_user_verify_read_self on public.user_verifications;
create policy rl_user_verify_read_self
on public.user_verifications
for select
to authenticated
using ( user_id = auth.uid() );

drop policy if exists rl_user_verify_read_admin on public.user_verifications;
create policy rl_user_verify_read_admin
on public.user_verifications
for select
to authenticated
using ( public.is_admin(auth.uid()) );

drop policy if exists rl_user_verify_write_admin on public.user_verifications;
create policy rl_user_verify_write_admin
on public.user_verifications
for all
to authenticated
using ( public.is_admin(auth.uid()) )
with check ( public.is_admin(auth.uid()) );

grant execute on function public.admin_verify_user(uuid, boolean) to authenticated;
grant execute on function public.admin_set_role_limit(text, int, int, int, int) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;