-- Extensions (normalment ja hi són, però és segur)
create extension if not exists pgcrypto;

-- ==============
-- level_catalog
-- ==============
create table if not exists public.level_catalog (
  level_id text primary key,
  difficulty text not null check (difficulty in ('easy','normal','hard')),
  level_number int not null,
  width int not null,
  height int not null,
  memorize_time_default int not null,

  optimal_path_len int not null,
  optimal_turns int not null,
  intersection_density numeric not null,
  dead_ends int not null,
  maze_rating numeric not null,

  analysis_json jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_level_catalog_diff_num
  on public.level_catalog (difficulty, level_number);

create index if not exists idx_level_catalog_rating
  on public.level_catalog (maze_rating);

-- updated_at auto
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_level_catalog_updated_at on public.level_catalog;
create trigger trg_level_catalog_updated_at
before update on public.level_catalog
for each row execute function public.set_updated_at();

-- ==============
-- level_attempts
-- ==============
create table if not exists public.level_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  mode text not null check (mode in ('campaign','practice_ia','practice_free','practice_normal','other')),

  level_id text not null references public.level_catalog(level_id) on delete cascade,
  difficulty text not null check (difficulty in ('easy','normal','hard')),
  level_number int not null,

  width int not null,
  height int not null,
  memorize_time int not null,

  started_at timestamptz not null,
  ended_at timestamptz not null,

  completed boolean not null,
  fail_reason text,

  time_seconds int not null default 0,
  points_final int not null default 0,
  stars int not null default 0,

  moves int not null default 0,
  crashes int not null default 0,
  revisits int not null default 0,

  reveal_used int not null default 0,
  path_help_seconds int not null default 0,
  crash_help_used int not null default 0,
  skipped_memorize boolean not null default false,

  optimal_path_len int not null,
  optimal_turns int not null,
  maze_rating numeric not null,

  settings_snapshot jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_level_attempts_user_time
  on public.level_attempts (user_id, ended_at desc);

create index if not exists idx_level_attempts_user_mode_time
  on public.level_attempts (user_id, mode, ended_at desc);

create index if not exists idx_level_attempts_level
  on public.level_attempts (level_id);

-- ==========
-- user_skill
-- ==========
create table if not exists public.user_skill (
  user_id uuid primary key references auth.users(id) on delete cascade,

  skill_mu numeric not null default 0.5,
  skill_sigma numeric not null default 1.0,
  sample_count int not null default 0,

  last_success_rate numeric,
  last_efficiency numeric,
  last_crash_rate numeric,
  last_help_rate numeric,
  last_time_per_step numeric,
  last_maze_rating numeric,

  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_skill_updated_at on public.user_skill;
create trigger trg_user_skill_updated_at
before update on public.user_skill
for each row execute function public.set_updated_at();

-- =========================
-- RLS + Policies
-- =========================
alter table public.level_catalog enable row level security;
alter table public.level_attempts enable row level security;
alter table public.user_skill enable row level security;

-- level_catalog: lectura per tothom (anon/auth), insert/update per auth (per fer upsert des del client)
drop policy if exists "level_catalog_select_all" on public.level_catalog;
create policy "level_catalog_select_all"
on public.level_catalog for select
using (true);

drop policy if exists "level_catalog_write_auth" on public.level_catalog;
create policy "level_catalog_write_auth"
on public.level_catalog for insert
with check (auth.uid() is not null);

drop policy if exists "level_catalog_update_auth" on public.level_catalog;
create policy "level_catalog_update_auth"
on public.level_catalog for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

-- level_attempts: cada usuari només veu/escriu les seves files
drop policy if exists "attempts_select_own" on public.level_attempts;
create policy "attempts_select_own"
on public.level_attempts for select
using (auth.uid() = user_id);

drop policy if exists "attempts_insert_own" on public.level_attempts;
create policy "attempts_insert_own"
on public.level_attempts for insert
with check (auth.uid() = user_id);

drop policy if exists "attempts_update_own" on public.level_attempts;
create policy "attempts_update_own"
on public.level_attempts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "attempts_delete_own" on public.level_attempts;
create policy "attempts_delete_own"
on public.level_attempts for delete
using (auth.uid() = user_id);

-- user_skill: cada usuari només veu/escriu el seu skill
drop policy if exists "skill_select_own" on public.user_skill;
create policy "skill_select_own"
on public.user_skill for select
using (auth.uid() = user_id);

drop policy if exists "skill_upsert_own" on public.user_skill;
create policy "skill_upsert_own"
on public.user_skill for insert
with check (auth.uid() = user_id);

drop policy if exists "skill_update_own" on public.user_skill;
create policy "skill_update_own"
on public.user_skill for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
