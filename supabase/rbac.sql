-- RBAC：账号角色（user / admin / super_admin）
-- 在 Supabase SQL Editor 中执行本文件

alter table public.profiles
  add column if not exists role text;

update public.profiles
set role = case
  when email = 'wuuuyo0527@gmail.com' then 'super_admin'
  when coalesce(is_admin, false) then 'admin'
  else 'user'
end
where role is null or role = '';

alter table public.profiles
  alter column role set default 'user';

update public.profiles set role = 'user' where role is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin', 'super_admin'));
  end if;
end $$;

comment on column public.profiles.role is
  'RBAC 角色：user=普通用户，admin=管理员，super_admin=超级管理员';

-- 同步 is_admin，兼容既有 RLS（is_admin()）
create or replace function public.sync_profile_admin_flag()
returns trigger
language plpgsql
as $$
begin
  new.is_admin := coalesce(new.role in ('admin', 'super_admin'), false);
  return new;
end;
$$;

drop trigger if exists trg_sync_profile_admin_flag on public.profiles;
create trigger trg_sync_profile_admin_flag
  before insert or update of role on public.profiles
  for each row execute function public.sync_profile_admin_flag();

update public.profiles
set is_admin = (role in ('admin', 'super_admin'));

-- is_admin()：按角色或遗留 is_admin 字段判定
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (role in ('admin', 'super_admin')) or is_admin
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 仅超级管理员可改他人角色 / 管理员标记（本人仍可更新自己的非敏感字段）
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
