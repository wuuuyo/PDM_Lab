-- PDM Learn 多用户账号与数据统计
-- 在 Supabase SQL Editor 中执行（可重复执行，已存在的会跳过）

-- ========== 用户资料 ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  is_admin boolean not null default false,
  login_count int not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select using (auth.uid() is not null);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- ========== 个人数据同步 ==========
create table if not exists public.pdm_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"memories":[],"reviews":[],"customKnowledge":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pdm_sync enable row level security;

drop policy if exists "pdm_sync_select_own" on public.pdm_sync;
create policy "pdm_sync_select_own"
  on public.pdm_sync for select using (auth.uid() = user_id);

drop policy if exists "pdm_sync_insert_own" on public.pdm_sync;
create policy "pdm_sync_insert_own"
  on public.pdm_sync for insert with check (auth.uid() = user_id);

drop policy if exists "pdm_sync_update_own" on public.pdm_sync;
create policy "pdm_sync_update_own"
  on public.pdm_sync for update using (auth.uid() = user_id);

-- ========== 使用行为统计 ==========
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  page text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_created_at_idx on public.usage_events (created_at desc);
create index if not exists usage_events_user_id_idx on public.usage_events (user_id);
create index if not exists usage_events_event_type_idx on public.usage_events (event_type);

alter table public.usage_events enable row level security;

drop policy if exists "usage_insert_own" on public.usage_events;
create policy "usage_insert_own"
  on public.usage_events for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "usage_select_admin" on public.usage_events;
create policy "usage_select_admin"
  on public.usage_events for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ========== DAU / MAU 日活表（每用户每天最多一条） ==========
create table if not exists public.user_daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default (timezone('utc', now()))::date,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index if not exists user_daily_activity_date_idx
  on public.user_daily_activity (activity_date desc);

alter table public.user_daily_activity enable row level security;

drop policy if exists "daily_activity_select_admin" on public.user_daily_activity;
create policy "daily_activity_select_admin"
  on public.user_daily_activity for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 记录当日活跃（客户端每日调用一次）
create or replace function public.record_daily_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.user_daily_activity (user_id, activity_date)
  values (auth.uid(), (timezone('utc', now()))::date)
  on conflict (user_id, activity_date) do nothing;
end;
$$;

-- 管理员读取 DAU / MAU 汇总
create or replace function public.get_dau_mau_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_today date := (timezone('utc', now()))::date;
begin
  select p.is_admin into v_is_admin
  from public.profiles p where p.id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'forbidden';
  end if;

  return json_build_object(
    'dau', (
      select count(*)::int from public.user_daily_activity
      where activity_date = v_today
    ),
    'mau', (
      select count(distinct user_id)::int from public.user_daily_activity
      where activity_date >= v_today - 29
    ),
    'dau_trend', (
      select coalesce(json_agg(row_to_json(t) order by t.date asc), '[]'::json)
      from (
        select activity_date as date, count(*)::int as count
        from public.user_daily_activity
        where activity_date >= v_today - 6
        group by activity_date
      ) t
    )
  );
end;
$$;

grant execute on function public.record_daily_activity() to authenticated;
grant execute on function public.get_dau_mau_stats() to authenticated;

-- ========== 全站共享知识（管理员从 Skill 库发布） ==========
create table if not exists public.shared_knowledge (
  id text primary key,
  category_id text not null,
  title text not null,
  summary text not null default '',
  tags jsonb not null default '[]'::jsonb,
  content jsonb not null default '[]'::jsonb,
  source_skill text,
  source_key text unique,
  section text not null default '',
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_knowledge_category_idx on public.shared_knowledge (category_id);
create index if not exists shared_knowledge_source_key_idx on public.shared_knowledge (source_key);

alter table public.shared_knowledge add column if not exists section text not null default '';

alter table public.shared_knowledge enable row level security;

drop policy if exists "shared_knowledge_select_published" on public.shared_knowledge;
create policy "shared_knowledge_select_published"
  on public.shared_knowledge for select using (published = true);

drop policy if exists "shared_knowledge_select_admin" on public.shared_knowledge;
create policy "shared_knowledge_select_admin"
  on public.shared_knowledge for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "shared_knowledge_insert_admin" on public.shared_knowledge;
create policy "shared_knowledge_insert_admin"
  on public.shared_knowledge for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "shared_knowledge_update_admin" on public.shared_knowledge;
create policy "shared_knowledge_update_admin"
  on public.shared_knowledge for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "shared_knowledge_delete_admin" on public.shared_knowledge;
create policy "shared_knowledge_delete_admin"
  on public.shared_knowledge for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ========== 学习论坛 ==========
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  author_email text,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists forum_posts_created_at_idx on public.forum_posts (created_at desc);
create index if not exists forum_comments_post_id_idx on public.forum_comments (post_id);

alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;

drop policy if exists "forum_posts_select_all" on public.forum_posts;
create policy "forum_posts_select_all" on public.forum_posts for select using (true);

drop policy if exists "forum_posts_insert_auth" on public.forum_posts;
create policy "forum_posts_insert_auth" on public.forum_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "forum_posts_delete_own" on public.forum_posts;
create policy "forum_posts_delete_own" on public.forum_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "forum_comments_select_all" on public.forum_comments;
create policy "forum_comments_select_all" on public.forum_comments for select using (true);

drop policy if exists "forum_comments_insert_auth" on public.forum_comments;
create policy "forum_comments_insert_auth" on public.forum_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "forum_comments_delete_own" on public.forum_comments;
create policy "forum_comments_delete_own" on public.forum_comments for delete
  using (auth.uid() = user_id);

-- 评论数自动更新
create or replace function public.forum_comment_count_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set comment_count = comment_count + 1, updated_at = now()
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.forum_posts set comment_count = greatest(comment_count - 1, 0), updated_at = now()
    where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists forum_comments_count on public.forum_comments;
create trigger forum_comments_count
  after insert or delete on public.forum_comments
  for each row execute function public.forum_comment_count_trigger();

-- ========== 新用户自动创建资料 ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== 设置管理员（把邮箱改成你的） ==========
-- update public.profiles set is_admin = true where email = 'your@email.com';

-- 关闭邮箱确认（个人/内测）：Authentication → Providers → Email → 关闭 Confirm email
