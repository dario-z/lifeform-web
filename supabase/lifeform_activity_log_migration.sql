-- SPRINT 12 — Lifeform activity ledger
-- Stores meaningful internal and manual state changes.
-- Does not store full chat transcripts.

begin;

create table if not exists public.lifeform_activity_log (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  lifeform_id uuid not null
    references public.lifeforms(id)
    on delete cascade,

  actor text not null check (
    actor in (
      'user',
      'lifeform',
      'reconciliation',
      'system'
    )
  ),

  entity_type text not null check (
    entity_type in (
      'goal',
      'belief',
      'thread',
      'key_memory',
      'dream',
      'emotion',
      'proposal',
      'capability'
    )
  ),

  action text not null check (
    char_length(trim(action)) between 1 and 80
  ),

  target_id uuid null,

  summary text not null default '' check (
    char_length(summary) <= 600
  ),

  reason text not null default '' check (
    char_length(reason) <= 1200
  ),

  before_snapshot jsonb not null
    default '{}'::jsonb,

  after_snapshot jsonb not null
    default '{}'::jsonb,

  metadata jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists
  lifeform_activity_log_lifeform_created_idx
on public.lifeform_activity_log (
  lifeform_id,
  created_at desc
);

create index if not exists
  lifeform_activity_log_target_idx
on public.lifeform_activity_log (
  lifeform_id,
  entity_type,
  target_id,
  created_at desc
);

alter table public.lifeform_activity_log
  enable row level security;

drop policy if exists
  "Users can read their own Lifeform activity"
on public.lifeform_activity_log;

drop policy if exists
  "Users can create their own Lifeform activity"
on public.lifeform_activity_log;

create policy
  "Users can read their own Lifeform activity"
on public.lifeform_activity_log
for select
using (
  auth.uid() = user_id
);

create policy
  "Users can create their own Lifeform activity"
on public.lifeform_activity_log
for insert
with check (
  auth.uid() = user_id
);

commit;

notify pgrst, 'reload schema';
