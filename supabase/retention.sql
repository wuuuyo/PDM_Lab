-- 容量与留存：同步包大小限制 + 埋点清理
-- 在 Supabase SQL Editor 执行本文件（可重复执行）

-- ========== 1. 个人同步包上限 512KB ==========
create or replace function public.enforce_pdm_sync_payload_size()
returns trigger
language plpgsql
as $$
declare
  v_bytes int;
  v_limit int := 524288; -- 512 KB
begin
  v_bytes := pg_column_size(new.payload);
  if v_bytes > v_limit then
    raise exception 'sync_payload_too_large'
      using errcode = 'P0001',
            hint = format('Cloud sync payload is %s bytes; limit is %s bytes (512KB).', v_bytes, v_limit);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pdm_sync_payload_size on public.pdm_sync;
create trigger trg_pdm_sync_payload_size
  before insert or update of payload on public.pdm_sync
  for each row execute function public.enforce_pdm_sync_payload_size();

comment on function public.enforce_pdm_sync_payload_size() is
  '限制 pdm_sync.payload 不超过 512KB，防止单用户拖垮库容量';

-- ========== 2. 清理旧 usage_events（默认保留 90 天） ==========
create or replace function public.cleanup_usage_events(p_days integer default 90)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int := 0;
  v_days int := greatest(coalesce(p_days, 90), 7);
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.usage_events
  where created_at < (timezone('utc', now()) - make_interval(days => v_days));

  get diagnostics v_deleted = row_count;

  return json_build_object(
    'deleted', v_deleted,
    'retain_days', v_days,
    'ran_at', timezone('utc', now())
  );
end;
$$;

revoke all on function public.cleanup_usage_events(integer) from public;
grant execute on function public.cleanup_usage_events(integer) to authenticated;

comment on function public.cleanup_usage_events(integer) is
  '管理员清理早于 N 天的 usage_events；默认 90 天。建议每周在 SQL Editor 执行，或配置 pg_cron。';

-- 一次性手动清理示例（也可在后台点「清理旧埋点」）：
-- select public.cleanup_usage_events(90);

-- 若项目已开通 pg_cron（多为 Pro），可自行取消注释：
-- select cron.schedule(
--   'cleanup-usage-events-weekly',
--   '0 3 * * 1',
--   $$select public.cleanup_usage_events(90)$$
-- );
