-- SPRINT 10 — Active Threads
-- Threads are optional ongoing work contexts, distinct from Goals.
-- They have no task list, deadline or autonomous completion behavior.

create table if not exists public.lifeform_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  title text not null check (
    char_length(trim(title)) between 2 and 120
  ),
  current_context text not null default '' check (
    char_length(trim(current_context)) between 1 and 900
  ),
  last_progress text not null default '' check (
    char_length(trim(last_progress)) between 1 and 700
  ),
  open_direction text not null default '' check (
    char_length(trim(open_direction)) between 1 and 700
  ),
  linked_goal_id uuid null references public.lifeform_goals(id) on delete set null,
  status text not null default 'active' check (
    status in ('active', 'archived')
  ),
  source text not null default 'proposal' check (
    source in ('proposal', 'manual')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index if not exists lifeform_threads_lifeform_status_idx
on public.lifeform_threads (
  lifeform_id,
  status,
  last_activity_at desc
);

create table if not exists public.lifeform_thread_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  action text not null check (
    action in ('create', 'update')
  ),
  target_thread_id uuid null references public.lifeform_threads(id) on delete set null,
  title text not null check (
    char_length(trim(title)) between 2 and 120
  ),
  current_context text not null check (
    char_length(trim(current_context)) between 1 and 900
  ),
  last_progress text not null check (
    char_length(trim(last_progress)) between 1 and 700
  ),
  open_direction text not null check (
    char_length(trim(open_direction)) between 1 and 700
  ),
  linked_goal_id uuid null references public.lifeform_goals(id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'dismissed')
  ),
  reason text not null default '' check (
    char_length(reason) <= 280
  ),
  created_at timestamptz not null default now(),
  decided_at timestamptz null
);

create unique index if not exists
  lifeform_thread_proposals_one_pending_per_lifeform_idx
on public.lifeform_thread_proposals (
  lifeform_id
)
where status = 'pending';

create index if not exists
  lifeform_thread_proposals_lifeform_status_idx
on public.lifeform_thread_proposals (
  lifeform_id,
  status,
  created_at desc
);

alter table public.lifeform_threads
  enable row level security;

alter table public.lifeform_thread_proposals
  enable row level security;

drop policy if exists
  "Users manage own lifeform threads"
on public.lifeform_threads;

create policy
  "Users manage own lifeform threads"
on public.lifeform_threads
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id = lifeform_threads.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id = lifeform_threads.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

drop policy if exists
  "Users manage own lifeform thread proposals"
on public.lifeform_thread_proposals;

create policy
  "Users manage own lifeform thread proposals"
on public.lifeform_thread_proposals
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id =
      lifeform_thread_proposals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id =
      lifeform_thread_proposals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
