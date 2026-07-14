-- 用户反馈（建议 + 满意度评分）
-- 在 Supabase SQL Editor 执行本文件

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  rating smallint not null check (rating >= 1 and rating <= 5),
  content text not null,
  status text not null default 'new' check (status in ('new', 'read', 'done')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);
create index if not exists user_feedback_status_idx on public.user_feedback (status);
create index if not exists user_feedback_user_id_idx on public.user_feedback (user_id);

alter table public.user_feedback enable row level security;

-- 登录用户可提交自己的反馈
drop policy if exists "feedback_insert_own" on public.user_feedback;
create policy "feedback_insert_own"
  on public.user_feedback for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- 用户可查看自己提交的反馈
drop policy if exists "feedback_select_own" on public.user_feedback;
create policy "feedback_select_own"
  on public.user_feedback for select
  using (auth.uid() = user_id);

-- 管理员可查看全部
drop policy if exists "feedback_select_admin" on public.user_feedback;
create policy "feedback_select_admin"
  on public.user_feedback for select
  using (public.is_admin());

-- 管理员可更新状态 / 备注
drop policy if exists "feedback_update_admin" on public.user_feedback;
create policy "feedback_update_admin"
  on public.user_feedback for update
  using (public.is_admin())
  with check (public.is_admin());
