-- DDA v2: skill per mode+difficulty, config table, i view d'estadístiques

-- 1) user_skill_v2
create table if not exists public.user_skill_v2 (
  user_id uuid not null,
  mode text not null,
  difficulty text not null,
  skill_mu numeric not null default 0.5,
  skill_sigma numeric not null default 0.5,
  sample_count integer not null default 0,
  last_success_rate numeric null,
  last_efficiency numeric null,
  last_crash_rate numeric null,
  last_help_rate numeric null,
  last_time_per_step numeric null,
  last_maze_rating numeric null,
  streak_signed integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint user_skill_v2_pkey primary key (user_id, mode, difficulty),
  constraint user_skill_v2_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint user_skill_v2_difficulty_check check (
    difficulty = any (array['easy'::text, 'normal'::text, 'hard'::text])
  ),
  constraint user_skill_v2_mode_check check (
    mode = any (
      array[
        'campaign'::text,
        'practice_ia'::text,
        'practice_free'::text,
        'practice_normal'::text,
        'other'::text
      ]
    )
  )
) tablespace pg_default;

create index if not exists idx_user_skill_v2_user_mode
  on public.user_skill_v2 (user_id, mode);

create trigger trg_user_skill_v2_updated_at before update on public.user_skill_v2
for each row execute function set_updated_at();

alter table public.user_skill_v2 enable row level security;

drop policy if exists "skill_v2_select_own" on public.user_skill_v2;
create policy "skill_v2_select_own"
  on public.user_skill_v2 for select
  using (auth.uid() = user_id);

drop policy if exists "skill_v2_upsert_own" on public.user_skill_v2;
create policy "skill_v2_upsert_own"
  on public.user_skill_v2 for insert
  with check (auth.uid() = user_id);

drop policy if exists "skill_v2_update_own" on public.user_skill_v2;
create policy "skill_v2_update_own"
  on public.user_skill_v2 for update
  using (auth.uid() = user_id);

-- 2) DDA config
create table if not exists public.dda_config (
  id text not null,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now(),
  constraint dda_config_pkey primary key (id)
) tablespace pg_default;

create trigger trg_dda_config_updated_at before update on public.dda_config
for each row execute function set_updated_at();

alter table public.dda_config enable row level security;

drop policy if exists "dda_config_select_all" on public.dda_config;
create policy "dda_config_select_all"
  on public.dda_config for select
  using (true);

drop policy if exists "dda_config_write_auth" on public.dda_config;
create policy "dda_config_write_auth"
  on public.dda_config for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "dda_config_update_auth" on public.dda_config;
create policy "dda_config_update_auth"
  on public.dda_config for update
  using (auth.role() = 'authenticated');

insert into public.dda_config (id, config)
values (
  'maze_rating',
  '{"weights":{"pathLen":0.55,"turns":2.0,"intersectionDensity":40,"deadEnds":0.35},"scale":{"min":20,"max":140}}'::jsonb
)
on conflict (id) do update set config = excluded.config;

-- 3) View agregada per calibratge
create or replace view public.level_stats as
select
  level_id,
  difficulty,
  mode,
  count(*) as attempts,
  avg((completed)::int)::numeric(10,4) as success_rate,
  avg(time_seconds)::numeric(10,2) as avg_time_seconds,
  avg(moves)::numeric(10,2) as avg_moves,
  avg(crashes)::numeric(10,2) as avg_crashes,
  avg(revisits)::numeric(10,2) as avg_revisits,
  avg(reveal_used)::numeric(10,2) as avg_reveal_used,
  avg(path_help_seconds)::numeric(10,2) as avg_path_help_seconds,
  avg(crash_help_used)::numeric(10,2) as avg_crash_help_used,
  avg(maze_rating)::numeric(10,3) as avg_maze_rating
from public.level_attempts
group by level_id, difficulty, mode;
