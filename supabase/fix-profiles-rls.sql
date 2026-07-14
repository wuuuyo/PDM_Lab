-- 修复 profiles RLS 无限递归
-- 在 Supabase SQL Editor 中整段执行

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles：去掉会递归查自己的 admin 策略
drop policy if exists "profiles_select_admin" on public.profiles;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select using (auth.uid() is not null);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- 其他表的 admin 判断改用 is_admin()，避免再触发 profiles 策略递归
drop policy if exists "usage_select_admin" on public.usage_events;
create policy "usage_select_admin"
  on public.usage_events for select using (public.is_admin());

drop policy if exists "daily_activity_select_admin" on public.user_daily_activity;
create policy "daily_activity_select_admin"
  on public.user_daily_activity for select using (public.is_admin());

drop policy if exists "daily_activity_insert_own" on public.user_daily_activity;
create policy "daily_activity_insert_own"
  on public.user_daily_activity for insert with check (auth.uid() = user_id);

drop policy if exists "shared_knowledge_select_admin" on public.shared_knowledge;
create policy "shared_knowledge_select_admin"
  on public.shared_knowledge for select using (public.is_admin());

drop policy if exists "shared_knowledge_insert_admin" on public.shared_knowledge;
create policy "shared_knowledge_insert_admin"
  on public.shared_knowledge for insert with check (public.is_admin());

drop policy if exists "shared_knowledge_update_admin" on public.shared_knowledge;
create policy "shared_knowledge_update_admin"
  on public.shared_knowledge for update using (public.is_admin());

drop policy if exists "shared_knowledge_delete_admin" on public.shared_knowledge;
create policy "shared_knowledge_delete_admin"
  on public.shared_knowledge for delete using (public.is_admin());

-- 设你为管理员（按需，邮箱已是你的）
update public.profiles set is_admin = true where email = 'wuuuyo0527@gmail.com';
