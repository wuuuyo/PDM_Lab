-- 角色功能权限（旧版，固定三角色）
-- 推荐改用 supabase/app-roles.sql（支持自定义角色、关联用户、软删除账号）
-- 若已执行过本文件，再执行 app-roles.sql 会自动迁入数据
-- 在 Supabase SQL Editor 执行；需先有 public.is_admin()

create table if not exists public.role_permissions (
  role text primary key check (role in ('user', 'admin', 'super_admin')),
  permissions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.role_permissions is
  '按角色配置功能权限。账号只绑定角色，权限以本表为准。';

alter table public.role_permissions enable row level security;

drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
create policy "role_permissions_select_authenticated"
  on public.role_permissions for select
  using (auth.uid() is not null);

drop policy if exists "role_permissions_update_admin" on public.role_permissions;
create policy "role_permissions_update_admin"
  on public.role_permissions for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "role_permissions_insert_admin" on public.role_permissions;
create policy "role_permissions_insert_admin"
  on public.role_permissions for insert
  with check (public.is_admin());

-- 种子：全开默认（JSON 为空对象时前端按「全开」理解）
insert into public.role_permissions (role, permissions)
values
  ('user', '{}'::jsonb),
  ('admin', '{}'::jsonb),
  ('super_admin', '{}'::jsonb)
on conflict (role) do nothing;
