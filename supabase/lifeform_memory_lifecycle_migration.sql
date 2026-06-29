-- SPRINT 11 — Memory lifecycle foundation
-- Non-destructive migration:
-- expands lifecycle statuses and adds metadata required for reconciliation.

begin;

------------------------------------------------------------
-- THREADS
------------------------------------------------------------

alter table public.lifeform_threads
  add column if not exists status_reason text not null default '',
  add column if not exists resolved_at timestamptz null,
  add column if not exists abandoned_at timestamptz null,
  add column if not exists archived_at timestamptz null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.lifeform_threads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.lifeform_threads drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.lifeform_threads
  add constraint lifeform_threads_status_lifecycle_check
  check (
    status in (
      'active',
      'paused',
      'resolved',
      'abandoned',
      'archived'
    )
  );

update public.lifeform_threads
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived'
  and archived_at is null;

create index if not exists
  lifeform_threads_lifecycle_status_idx
on public.lifeform_threads (
  lifeform_id,
  status,
  last_activity_at desc
);

------------------------------------------------------------
-- GOALS
------------------------------------------------------------

alter table public.lifeform_goals
  add column if not exists progress smallint not null default 0,
  add column if not exists next_step text not null default '',
  add column if not exists blocked_reason text not null default '',
  add column if not exists status_reason text not null default '',
  add column if not exists archived_at timestamptz null;

alter table public.lifeform_goals
  drop constraint if exists lifeform_goals_progress_check;

alter table public.lifeform_goals
  add constraint lifeform_goals_progress_check
  check (progress between 0 and 100);

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.lifeform_goals'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.lifeform_goals drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.lifeform_goals
  add constraint lifeform_goals_status_lifecycle_check
  check (
    status in (
      'active',
      'paused',
      'blocked',
      'completed',
      'abandoned',
      'archived'
    )
  );

update public.lifeform_goals
set
  progress = 100,
  completed_at = coalesce(completed_at, updated_at)
where status = 'completed';

update public.lifeform_goals
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived'
  and archived_at is null;

create index if not exists
  lifeform_goals_lifecycle_status_idx
on public.lifeform_goals (
  lifeform_id,
  status,
  updated_at desc
);

------------------------------------------------------------
-- BELIEFS
------------------------------------------------------------

alter table public.lifeform_beliefs
  add column if not exists status_reason text not null default '',
  add column if not exists last_confirmed_at timestamptz null,
  add column if not exists superseded_by_id uuid null,
  add column if not exists archived_at timestamptz null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.lifeform_beliefs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.lifeform_beliefs drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.lifeform_beliefs
  add constraint lifeform_beliefs_status_lifecycle_check
  check (
    status in (
      'active',
      'superseded',
      'retracted',
      'archived'
    )
  );

alter table public.lifeform_beliefs
  drop constraint if exists
    lifeform_beliefs_superseded_by_id_fkey;

alter table public.lifeform_beliefs
  add constraint lifeform_beliefs_superseded_by_id_fkey
  foreign key (superseded_by_id)
  references public.lifeform_beliefs(id)
  on delete set null;

update public.lifeform_beliefs
set last_confirmed_at = coalesce(
  last_confirmed_at,
  updated_at,
  created_at
)
where last_confirmed_at is null;

update public.lifeform_beliefs
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived'
  and archived_at is null;

create index if not exists
  lifeform_beliefs_lifecycle_status_idx
on public.lifeform_beliefs (
  lifeform_id,
  status,
  updated_at desc
);

------------------------------------------------------------
-- KEY MEMORIES
------------------------------------------------------------

alter table public.key_memories
  add column if not exists status text not null default 'active',
  add column if not exists status_reason text not null default '',
  add column if not exists superseded_by_id uuid null,
  add column if not exists archived_at timestamptz null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.key_memories'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.key_memories drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.key_memories
  add constraint key_memories_status_lifecycle_check
  check (
    status in (
      'active',
      'temporary',
      'superseded',
      'archived'
    )
  );

alter table public.key_memories
  drop constraint if exists
    key_memories_superseded_by_id_fkey;

alter table public.key_memories
  add constraint key_memories_superseded_by_id_fkey
  foreign key (superseded_by_id)
  references public.key_memories(id)
  on delete set null;

update public.key_memories
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived'
  and archived_at is null;

create index if not exists
  key_memories_lifecycle_status_idx
on public.key_memories (
  lifeform_id,
  status,
  updated_at desc
);

commit;

notify pgrst, 'reload schema';
