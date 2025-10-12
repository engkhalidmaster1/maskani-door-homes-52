-- Dynamic roles limits by name and user verification

create table if not exists public.role_limits_by_name (
  role_name text primary key,
  max_properties int not null default 10,
  max_images int not null default 50,
  max_featured int not null default 0,
  storage_mb int not null default 200,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.role_limits_by_name(role_name, max_properties, max_images, max_featured, storage_mb)
values 
  ('admin', 999999, 999999, 999999, 999999),
  ('agency', 500, 5000, 100, 100000),
  ('pro', 100, 2000, 20, 20000),
  ('user', 20, 200, 0, 2000)
on conflict (role_name) do nothing;

create table if not exists public.user_verifications (
  user_id uuid primary key,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid,
  constraint fk_verified_by foreign key (verified_by) references auth.users(id) on delete set null
);

-- Helpers based on user_roles (role text)
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_user_id and ur.role = 'admin'
  );
$$;

create or replace function public.get_role_name(p_user_id uuid)
returns text
language sql
stable
as $$
  select coalesce(
    (select ur.role from public.user_roles ur where ur.user_id = p_user_id limit 1),
    'user'
  );
$$;

create or replace function public.get_user_limits(p_user_id uuid)
returns public.role_limits_by_name
language sql
stable
as $$
  select rln.* 
  from public.role_limits_by_name rln
  where rln.role_name = public.get_role_name(p_user_id);
$$;

-- Quota enforcement for properties
create or replace function public.enforce_property_quota()
returns trigger
language plpgsql
as $$
declare
  limits public.role_limits_by_name;
  current_count int;
begin
  if public.is_admin(new.user_id) then
    return new;
  end if;

  select * into limits from public.get_user_limits(new.user_id);

  if limits.max_properties is null then
    return new;
  end if;

  select count(*) into current_count
  from public.properties p
  where p.user_id = new.user_id;

  if current_count >= limits.max_properties then
    raise exception 'Property quota exceeded for user % (limit: %)', new.user_id, limits.max_properties
      using errcode = '23514';
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_enforce_property_quota'
  ) then
    create trigger trg_enforce_property_quota
    before insert on public.properties
    for each row execute function public.enforce_property_quota();
  end if;
end$$;

-- Admin RPCs (SECURITY DEFINER)
create or replace function public.admin_verify_user(p_user_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.user_verifications(user_id, verified, verified_at, verified_by)
  values (p_user_id, p_verified, case when p_verified then now() else null end, auth.uid())
  on conflict(user_id) do update
    set verified = excluded.verified,
        verified_at = excluded.verified_at,
        verified_by = excluded.verified_by;
end;
$$;

create or replace function public.admin_set_role_limit(
  p_role_name text,
  p_max_properties int,
  p_max_images int,
  p_max_featured int,
  p_storage_mb int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.role_limits_by_name(role_name, max_properties, max_images, max_featured, storage_mb)
  values (p_role_name, p_max_properties, p_max_images, p_max_featured, p_storage_mb)
  on conflict(role_name) do update
    set max_properties = excluded.max_properties,
        max_images = excluded.max_images,
        max_featured = excluded.max_featured,
        storage_mb = excluded.storage_mb,
        updated_at = now();
end;
$$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.user_roles(user_id, role)
  values (p_user_id, p_role)
  on conflict(user_id) do update set role = excluded.role;
end;
$$;
