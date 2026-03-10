-- 1) Perfil d'usuari (link a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- 2) Progrés per nivell
create type difficulty as enum ('easy','normal','hard');

create table if not exists public.level_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  difficulty difficulty not null,
  level_number int not null check (level_number between 1 and 15),
  stars int not null check (stars between 0 and 3),
  best_time int,         -- segons (null si no n'hi ha)
  best_points int,       -- null si no n'hi ha
  updated_at timestamptz not null default now(),
  primary key (user_id, difficulty, level_number)
);

-- 3) Resum "highest unlocked" per dificultat (opcional, ràpid per al teu UI)
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  easy int not null default 1,
  normal int not null default 1,
  hard int not null default 1,
  updated_at timestamptz not null default now()
);

-- 4) Millor puntuació de pràctica
create table if not exists public.practice_best (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_score int not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.level_progress enable row level security;
alter table public.user_progress enable row level security;
alter table public.practice_best enable row level security;

-- Polítiques: cada usuari només pot veure i escriure el seu
create policy "profiles self access" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "level_progress self select" on public.level_progress
  for select using (auth.uid() = user_id);
create policy "level_progress self upsert" on public.level_progress
  for insert with check (auth.uid() = user_id);
create policy "level_progress self update" on public.level_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_progress self select" on public.user_progress
  for select using (auth.uid() = user_id);
create policy "user_progress self upsert" on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy "user_progress self update" on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "practice_best self select" on public.practice_best
  for select using (auth.uid() = user_id);
create policy "practice_best self upsert" on public.practice_best
  for insert with check (auth.uid() = user_id);
create policy "practice_best self update" on public.practice_best
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
