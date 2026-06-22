-- SPRINT 04 — Offline Emotional Drift + Loneliness
-- Adds explicit timestamps used by the browser client to calculate
-- time-based emotion decay and automatic loneliness.

alter table public.lifeforms
  add column if not exists emotion_decay_at timestamptz;

alter table public.lifeforms
  add column if not exists last_connection_at timestamptz;

update public.lifeforms
set
  emotion_decay_at = coalesce(
    emotion_decay_at,
    last_seen_at,
    now()
  ),
  last_connection_at = coalesce(
    last_connection_at,
    last_seen_at,
    now()
  )
where
  emotion_decay_at is null
  or last_connection_at is null;
