-- SPRINT 07 — Separate Goals and Beliefs

create table if not exists public.lifeform_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 500),
  importance smallint not null check (importance between 0 and 100),
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'archived')
  ),
  source text not null default 'proposal' check (
    source in ('proposal', 'manual', 'migrated')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists public.lifeform_beliefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 500),
  importance smallint not null check (importance between 0 and 100),
  status text not null default 'active' check (
    status in ('active', 'archived')
  ),
  source text not null default 'proposal' check (
    source in ('proposal', 'manual', 'migrated')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lifeform_goals_lifeform_status_idx
on public.lifeform_goals (lifeform_id, status, updated_at desc);

create index if not exists lifeform_beliefs_lifeform_status_idx
on public.lifeform_beliefs (lifeform_id, status, updated_at desc);

alter table public.lifeform_goals enable row level security;
alter table public.lifeform_beliefs enable row level security;

drop policy if exists "Users manage own lifeform goals"
on public.lifeform_goals;

create policy "Users manage own lifeform goals"
on public.lifeform_goals
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.lifeforms
    where lifeforms.id = lifeform_goals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.lifeforms
    where lifeforms.id = lifeform_goals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

drop policy if exists "Users manage own lifeform beliefs"
on public.lifeform_beliefs;

create policy "Users manage own lifeform beliefs"
on public.lifeform_beliefs
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.lifeforms
    where lifeforms.id = lifeform_beliefs.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.lifeforms
    where lifeforms.id = lifeform_beliefs.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

insert into public.lifeform_goals (
  user_id, lifeform_id, content, importance,
  status, source, created_at, updated_at
)
select
  km.user_id, km.lifeform_id, km.content, km.importance,
  'active', 'migrated', km.created_at, km.updated_at
from public.key_memories as km
where km.category = 'long_term_goal'
and not exists (
  select 1 from public.lifeform_goals as goal
  where goal.lifeform_id = km.lifeform_id
  and lower(trim(goal.content)) =
      lower(trim(km.content))
);

insert into public.lifeform_beliefs (
  user_id, lifeform_id, content, importance,
  status, source, created_at, updated_at
)
select
  km.user_id, km.lifeform_id, km.content, km.importance,
  'active', 'migrated', km.created_at, km.updated_at
from public.key_memories as km
where km.category = 'lifeform_belief'
and not exists (
  select 1 from public.lifeform_beliefs as belief
  where belief.lifeform_id = km.lifeform_id
  and lower(trim(belief.content)) =
      lower(trim(km.content))
);

delete from public.key_memories
where category in (
  'long_term_goal',
  'lifeform_belief'
);

notify pgrst, 'reload schema';
