-- 可配置角色（系统角色 + 自定义角色）
-- 依赖：profiles.role、is_admin()、is_super_admin()（见 rbac.sql）
-- 在 Supabase SQL Editor 执行本文件

-- 1) 角色主表
create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_system boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_roles is
  '应用角色：系统角色（user/admin/super_admin）+ 自定义角色；账号绑定 code，功能权限存于 permissions';

-- 2) 允许 profiles.role 绑定任意角色 code
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add column if not exists is_disabled boolean not null default false;

comment on column public.profiles.is_disabled is
  '账号软删除/禁用：仅超级管理员可操作；登录后客户端应拒绝进入';

-- 3) is_admin 同步：仅系统 admin / super_admin 进后台
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

-- 4) 从旧 role_permissions 迁入 / 种子
insert into public.app_roles (code, name, is_system, permissions)
values
  ('user', '用户', true, '{}'::jsonb),
  ('admin', '管理员', true, '{}'::jsonb),
  ('super_admin', '超级管理员', true, '{}'::jsonb)
on conflict (code) do nothing;

insert into public.app_roles (code, name, is_system, permissions, updated_at)
select
  rp.role,
  case rp.role
    when 'user' then '用户'
    when 'admin' then '管理员'
    when 'super_admin' then '超级管理员'
    else rp.role
  end,
  true,
  coalesce(rp.permissions, '{}'::jsonb),
  coalesce(rp.updated_at, now())
from public.role_permissions rp
on conflict (code) do update
set
  permissions = excluded.permissions,
  updated_at = excluded.updated_at
where public.app_roles.permissions = '{}'::jsonb
  and excluded.permissions is distinct from '{}'::jsonb;

-- 5) RLS
alter table public.app_roles enable row level security;

drop policy if exists "app_roles_select_authenticated" on public.app_roles;
create policy "app_roles_select_authenticated"
  on public.app_roles for select
  using (auth.uid() is not null);

drop policy if exists "app_roles_insert_super" on public.app_roles;
create policy "app_roles_insert_super"
  on public.app_roles for insert
  with check (public.is_super_admin());

drop policy if exists "app_roles_update_super" on public.app_roles;
create policy "app_roles_update_super"
  on public.app_roles for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "app_roles_delete_super" on public.app_roles;
create policy "app_roles_delete_super"
  on public.app_roles for delete
  using (public.is_super_admin() and is_system = false);

-- 6) 禁用：仅超管可禁用他人；禁止禁用超管；不可自禁
create or replace function public.guard_profile_disable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_disabled is distinct from old.is_disabled then
    if not public.is_super_admin() then
      raise exception 'only super admin can disable accounts';
    end if;
    if old.role = 'super_admin' then
      raise exception 'cannot disable super admin';
    end if;
    if old.id = auth.uid() then
      raise exception 'cannot disable yourself';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_disable on public.profiles;
create trigger trg_guard_profile_disable
  before update of is_disabled on public.profiles
  for each row execute function public.guard_profile_disable();
