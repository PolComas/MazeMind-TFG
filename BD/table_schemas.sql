create table public.profiles (
  id uuid not null,
  email text not null,
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_progress (
  user_id uuid not null,
  easy integer not null default 1,
  normal integer not null default 1,
  hard integer not null default 1,
  updated_at timestamp with time zone not null default now(),
  constraint user_progress_pkey primary key (user_id),
  constraint user_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_settings (
  user_id uuid not null,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now(),
  constraint user_settings_pkey primary key (user_id),
  constraint user_settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_skill (
  user_id uuid not null,
  skill_mu numeric not null default 0.5,
  skill_sigma numeric not null default 1.0,
  sample_count integer not null default 0,
  last_success_rate numeric null,
  last_efficiency numeric null,
  last_crash_rate numeric null,
  last_help_rate numeric null,
  last_time_per_step numeric null,
  last_maze_rating numeric null,
  updated_at timestamp with time zone not null default now(),
  constraint user_skill_pkey primary key (user_id),
  constraint user_skill_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_user_skill_updated_at BEFORE
update on user_skill for EACH row
execute FUNCTION set_updated_at ();

create table public.level_progress (
  user_id uuid not null,
  difficulty public.difficulty not null,
  level_number integer not null,
  stars integer not null,
  best_time integer null,
  best_points integer null,
  updated_at timestamp with time zone not null default now(),
  constraint level_progress_pkey primary key (user_id, difficulty, level_number),
  constraint level_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint level_progress_level_number_check check (
    (
      (level_number >= 1)
      and (level_number <= 15)
    )
  ),
  constraint level_progress_stars_check check (
    (
      (stars >= 0)
      and (stars <= 3)
    )
  )
) TABLESPACE pg_default;

create table public.level_catalog (
  level_id text not null,
  difficulty text not null,
  level_number integer not null,
  width integer not null,
  height integer not null,
  memorize_time_default integer not null,
  optimal_path_len integer not null,
  optimal_turns integer not null,
  intersection_density numeric not null,
  dead_ends integer not null,
  maze_rating numeric not null,
  analysis_json jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint level_catalog_pkey primary key (level_id),
  constraint level_catalog_difficulty_check check (
    (
      difficulty = any (array['easy'::text, 'normal'::text, 'hard'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_level_catalog_diff_num on public.level_catalog using btree (difficulty, level_number) TABLESPACE pg_default;

create index IF not exists idx_level_catalog_rating on public.level_catalog using btree (maze_rating) TABLESPACE pg_default;

create trigger trg_level_catalog_updated_at BEFORE
update on level_catalog for EACH row
execute FUNCTION set_updated_at ();

create table public.level_attempts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  mode text not null,
  level_id text not null,
  difficulty text not null,
  level_number integer not null,
  width integer not null,
  height integer not null,
  memorize_time integer not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  completed boolean not null,
  fail_reason text null,
  time_seconds integer not null default 0,
  points_final integer not null default 0,
  stars integer not null default 0,
  moves integer not null default 0,
  crashes integer not null default 0,
  revisits integer not null default 0,
  reveal_used integer not null default 0,
  path_help_seconds integer not null default 0,
  crash_help_used integer not null default 0,
  skipped_memorize boolean not null default false,
  optimal_path_len integer not null,
  optimal_turns integer not null,
  maze_rating numeric not null,
  settings_snapshot jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint level_attempts_pkey primary key (id),
  constraint level_attempts_level_id_fkey foreign KEY (level_id) references level_catalog (level_id) on delete CASCADE,
  constraint level_attempts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint level_attempts_difficulty_check check (
    (
      difficulty = any (array['easy'::text, 'normal'::text, 'hard'::text])
    )
  ),
  constraint level_attempts_mode_check check (
    (
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
  )
) TABLESPACE pg_default;

create index IF not exists idx_level_attempts_user_time on public.level_attempts using btree (user_id, ended_at desc) TABLESPACE pg_default;

create index IF not exists idx_level_attempts_user_mode_time on public.level_attempts using btree (user_id, mode, ended_at desc) TABLESPACE pg_default;

create index IF not exists idx_level_attempts_level on public.level_attempts using btree (level_id) TABLESPACE pg_default;

create table public.practice_best (
  user_id uuid not null,
  max_score integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint practice_best_pkey primary key (user_id),
  constraint practice_best_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.daily_streak (
  user_id uuid not null,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_completed_date text null,
  last_stars integer null default 0,
  last_time_seconds real null,
  updated_at timestamp with time zone not null default now(),
  constraint daily_streak_pkey primary key (user_id),
  constraint daily_streak_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.dda_config (
  id text not null,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now(),
  constraint dda_config_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_dda_config_updated_at BEFORE
update on dda_config for EACH row
execute FUNCTION set_updated_at ();

create table public.multiplayer_matches (
  id uuid not null default gen_random_uuid (),
  host_id uuid not null,
  code text not null,
  is_public boolean not null default false,
  status text not null default 'waiting'::text,
  rounds_count integer not null default 3,
  current_round integer not null default 0,
  seeds text[] not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  phase text not null default 'waiting'::text,
  phase_until timestamp with time zone null,
  constraint multiplayer_matches_pkey primary key (id),
  constraint multiplayer_matches_code_key unique (code),
  constraint multiplayer_matches_phase_check check (
    (
      phase = any (
        array[
          'waiting'::text,
          'countdown'::text,
          'playing'::text,
          'results'::text,
          'finished'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint multiplayer_matches_status_check check (
    (
      status = any (
        array[
          'waiting'::text,
          'active'::text,
          'finished'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_multiplayer_matches_status on public.multiplayer_matches using btree (status, is_public) TABLESPACE pg_default;

create trigger trg_multiplayer_matches_updated_at BEFORE
update on multiplayer_matches for EACH row
execute FUNCTION set_updated_at ();

create table public.multiplayer_matches (
  id uuid not null default gen_random_uuid (),
  host_id uuid not null,
  code text not null,
  is_public boolean not null default false,
  status text not null default 'waiting'::text,
  rounds_count integer not null default 3,
  current_round integer not null default 0,
  seeds text[] not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  phase text not null default 'waiting'::text,
  phase_until timestamp with time zone null,
  constraint multiplayer_matches_pkey primary key (id),
  constraint multiplayer_matches_code_key unique (code),
  constraint multiplayer_matches_phase_check check (
    (
      phase = any (
        array[
          'waiting'::text,
          'countdown'::text,
          'playing'::text,
          'results'::text,
          'finished'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint multiplayer_matches_status_check check (
    (
      status = any (
        array[
          'waiting'::text,
          'active'::text,
          'finished'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_multiplayer_matches_status on public.multiplayer_matches using btree (status, is_public) TABLESPACE pg_default;

create trigger trg_multiplayer_matches_updated_at BEFORE
update on multiplayer_matches for EACH row
execute FUNCTION set_updated_at ();

create table public.multiplayer_round_results (
  match_id uuid not null,
  round_index integer not null,
  user_id uuid not null,
  completed boolean not null,
  time_seconds integer not null default 0,
  points integer not null default 0,
  finished_at timestamp with time zone not null,
  constraint multiplayer_round_results_pkey primary key (match_id, round_index, user_id),
  constraint multiplayer_round_results_match_id_fkey foreign KEY (match_id) references multiplayer_matches (id) on delete CASCADE,
  constraint multiplayer_round_results_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_multiplayer_round_results_match on public.multiplayer_round_results using btree (match_id, round_index) TABLESPACE pg_default;