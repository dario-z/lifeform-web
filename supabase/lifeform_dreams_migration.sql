create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lifeform_id uuid not null references public.lifeforms(id) on delete cascade,
  dream_date date not null,
  title text not null,
  dream_text text not null,
  random_anchor text not null,
  dominant_emotion text not null,
  emotion_snapshot jsonb not null default '{}'::jsonb,
  source_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists dreams_lifeform_date_unique
  on public.dreams (lifeform_id, dream_date);

create index if not exists dreams_lifeform_created_at_idx
  on public.dreams (lifeform_id, created_at desc);

alter table public.dreams enable row level security;

drop policy if exists "Users can read own dreams"
  on public.dreams;

create policy "Users can read own dreams"
  on public.dreams
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own dreams"
  on public.dreams;

create policy "Users can insert own dreams"
  on public.dreams
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own dreams"
  on public.dreams;

create policy "Users can delete own dreams"
  on public.dreams
  for delete
  using (auth.uid() = user_id);
