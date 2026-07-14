-- 账号功能权限（管理员可配置）
-- 在 Supabase SQL Editor 中执行本文件

alter table public.profiles
  add column if not exists permissions jsonb default null;

comment on column public.profiles.permissions is
  '功能权限 JSON。null=默认全开。例：{"forum":{"view":true,"edit":false},"myKnowledge":{"view":true,"edit":true}}';

-- 管理员可更新任意账号（含权限）；本人仍可更新自己的非权限字段（已有 profiles_update_own）
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
