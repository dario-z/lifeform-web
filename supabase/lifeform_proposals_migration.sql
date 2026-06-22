-- SPRINT 06 — Confirmed Lifeform Proposals
-- Pending proposals are never saved as Key Memories automatically.
-- The user must explicitly accept a proposal before it becomes a manual Key Memory.

create table if not exists public.lifeform_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  kind text not null check (
    kind in ('memory', 'goal', 'belief')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'dismissed')
  ),
  action text not null check (
    action in ('create', 'update')
  ),
  target_memory_id uuid null references public.key_memories(id) on delete set null,
  category text not null check (
    category in (
      'conversation_memory',
      'user_preference',
      'important_person',
      'important_place',
      'important_project',
      'long_term_goal',
      'conversation_summary',
      'key_event',
      'lifeform_belief',
      'other'
    )
  ),
  content text not null check (
    char_length(trim(content)) between 1 and 500
  ),
  importance smallint not null check (
    importance between 0 and 100
  ),
  reason text not null default '' check (
    char_length(reason) <= 240
  ),
  created_at timestamptz not null default now(),
  decided_at timestamptz null
);

create unique index if not exists
  lifeform_proposals_one_pending_per_lifeform_idx
on public.lifeform_proposals (
  lifeform_id
)
where status = 'pending';

create index if not exists
  lifeform_proposals_lifeform_status_idx
on public.lifeform_proposals (
  lifeform_id,
  status,
  created_at desc
);

alter table public.lifeform_proposals
  enable row level security;

drop policy if exists
  "Users can read own lifeform proposals"
on public.lifeform_proposals;

create policy
  "Users can read own lifeform proposals"
on public.lifeform_proposals
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id = lifeform_proposals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

drop policy if exists
  "Users can create own lifeform proposals"
on public.lifeform_proposals;

create policy
  "Users can create own lifeform proposals"
on public.lifeform_proposals
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id = lifeform_proposals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

drop policy if exists
  "Users can update own lifeform proposals"
on public.lifeform_proposals;

create policy
  "Users can update own lifeform proposals"
on public.lifeform_proposals
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lifeforms
    where lifeforms.id = lifeform_proposals.lifeform_id
      and lifeforms.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
