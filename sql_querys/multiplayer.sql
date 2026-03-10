-- Multiplayer (sense servidor real) - taules i policies

create table if not exists public.multiplayer_matches (
  id uuid not null default gen_random_uuid(),
  host_id uuid not null,
  code text not null,
  is_public boolean not null default false,
  status text not null default 'waiting',
  rounds_count integer not null default 3,
  current_round integer not null default 0,
  seeds text[] not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint multiplayer_matches_pkey primary key (id),
  constraint multiplayer_matches_code_key unique (code),
  constraint multiplayer_matches_status_check check (
    status = any (array['waiting'::text, 'active'::text, 'finished'::text, 'cancelled'::text])
  )
) tablespace pg_default;

create index if not exists idx_multiplayer_matches_status on public.multiplayer_matches (status, is_public);

create trigger trg_multiplayer_matches_updated_at before update on public.multiplayer_matches
for each row execute function set_updated_at();

create table if not exists public.multiplayer_players (
  match_id uuid not null,
  user_id uuid not null,
  display_name text null,
  joined_at timestamp with time zone not null default now(),
  ready boolean not null default false,
  total_points integer not null default 0,
  total_time integer not null default 0,
  rounds_won integer not null default 0,
  status text not null default 'joined',
  constraint multiplayer_players_pkey primary key (match_id, user_id),
  constraint multiplayer_players_match_id_fkey foreign key (match_id) references public.multiplayer_matches (id) on delete cascade,
  constraint multiplayer_players_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint multiplayer_players_status_check check (
    status = any (array['joined'::text, 'left'::text, 'finished'::text])
  )
) tablespace pg_default;

create index if not exists idx_multiplayer_players_match on public.multiplayer_players (match_id);
create index if not exists idx_multiplayer_players_user on public.multiplayer_players (user_id);

create table if not exists public.multiplayer_round_results (
  match_id uuid not null,
  round_index integer not null,
  user_id uuid not null,
  completed boolean not null,
  time_seconds integer not null default 0,
  points integer not null default 0,
  finished_at timestamp with time zone not null,
  constraint multiplayer_round_results_pkey primary key (match_id, round_index, user_id),
  constraint multiplayer_round_results_match_id_fkey foreign key (match_id) references public.multiplayer_matches (id) on delete cascade,
  constraint multiplayer_round_results_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

create index if not exists idx_multiplayer_round_results_match on public.multiplayer_round_results (match_id, round_index);

alter table public.multiplayer_matches enable row level security;
alter table public.multiplayer_players enable row level security;
alter table public.multiplayer_round_results enable row level security;

-- Matches: lectura per participants o partides públiques

drop policy if exists "mp_matches_select" on public.multiplayer_matches;
create policy "mp_matches_select"
  on public.multiplayer_matches for select
  using (
    is_public
    or auth.uid() = host_id
    or exists (
      select 1 from public.multiplayer_players p
      where p.match_id = id and p.user_id = auth.uid()
    )
  );

-- Matches: només el host pot crear

drop policy if exists "mp_matches_insert" on public.multiplayer_matches;
create policy "mp_matches_insert"
  on public.multiplayer_matches for insert
  with check (auth.uid() = host_id);

-- Matches: poden actualitzar els participants

drop policy if exists "mp_matches_update" on public.multiplayer_matches;
create policy "mp_matches_update"
  on public.multiplayer_matches for update
  using (
    auth.uid() = host_id
    or exists (
      select 1 from public.multiplayer_players p
      where p.match_id = id and p.user_id = auth.uid()
    )
  );

-- Matches: esborrar només pel host (neteja)
drop policy if exists "mp_matches_delete" on public.multiplayer_matches;
create policy "mp_matches_delete"
  on public.multiplayer_matches for delete
  using (auth.uid() = host_id);

-- Players: lectura per participants

drop policy if exists "mp_players_select" on public.multiplayer_players;
create policy "mp_players_select"
  on public.multiplayer_players for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.multiplayer_players p
      where p.match_id = match_id and p.user_id = auth.uid()
    )
  );

-- Players: un jugador només pot inserir-se ell mateix

drop policy if exists "mp_players_insert" on public.multiplayer_players;
create policy "mp_players_insert"
  on public.multiplayer_players for insert
  with check (auth.uid() = user_id);

-- Players: un jugador només pot actualitzar-se ell mateix

drop policy if exists "mp_players_update" on public.multiplayer_players;
create policy "mp_players_update"
  on public.multiplayer_players for update
  using (auth.uid() = user_id);

-- Round results: lectura per participants

drop policy if exists "mp_round_select" on public.multiplayer_round_results;
create policy "mp_round_select"
  on public.multiplayer_round_results for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.multiplayer_players p
      where p.match_id = match_id and p.user_id = auth.uid()
    )
  );

-- Round results: un jugador només pot inserir els seus resultats

drop policy if exists "mp_round_insert" on public.multiplayer_round_results;
create policy "mp_round_insert"
  on public.multiplayer_round_results for insert
  with check (auth.uid() = user_id);

-- Round results: actualitzacions només del propietari

drop policy if exists "mp_round_update" on public.multiplayer_round_results;
create policy "mp_round_update"
  on public.multiplayer_round_results for update
  using (auth.uid() = user_id);
