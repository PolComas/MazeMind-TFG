-- TFG validation evidence extracts (Tables A / B / C from documentacio.md 7.5.2)
-- Usage:
-- 1) Replace REPLACE_WITH_USER_UUID (and optional match id) in params CTE.
-- 2) Run each block independently in Supabase SQL editor.

-- ============================================================================
-- A) TABLE A - DDA EVOLUTION (last N attempts, with reconstructed mu/sigma)
-- ============================================================================
with params as (
  select
    'REPLACE_WITH_USER_UUID'::uuid as user_id,
    'practice_ia'::text as mode_filter,      -- 'practice_ia' or 'campaign'
    'normal'::text as difficulty_filter,      -- 'easy' | 'normal' | 'hard'
    12::int as window_size,                   -- same as code
    0.85::numeric as alpha,                   -- same as code
    12::int as max_rows
),
attempts_base as (
  select
    la.id,
    la.ended_at,
    greatest(1, la.moves)::numeric as moves_n,
    greatest(1, la.optimal_path_len)::numeric as opt_n,
    greatest(0, la.crashes)::numeric as crashes_n,
    greatest(0, la.revisits)::numeric as revisits_n,
    greatest(0, la.reveal_used)::numeric as reveal_n,
    greatest(0, la.path_help_seconds)::numeric as path_n,
    greatest(0, la.crash_help_used)::numeric as crash_help_n,
    greatest(0, la.time_seconds)::numeric as time_n,
    case when la.completed then 1::numeric else 0::numeric end as success_n,
    la.settings_snapshot
  from public.level_attempts la
  join params p on la.user_id = p.user_id
  where la.mode = p.mode_filter
    and la.difficulty = p.difficulty_filter
),
attempts as (
  select
    ab.*,
    row_number() over (order by ab.ended_at asc, ab.id asc) as rn
  from attempts_base ab
),
metrics as (
  select
    a.*,
    least(greatest(a.opt_n / a.moves_n, 0), 1) as efficiency,
    least(greatest(a.crashes_n / a.moves_n, 0), 1) as crash_rate,
    least(greatest(a.revisits_n / a.moves_n, 0), 1) as revisit_rate,
    least(greatest((a.reveal_n + a.path_n / 10.0 + a.crash_help_n / 2.0) / a.moves_n, 0), 1) as help_rate,
    (a.time_n / a.opt_n) as time_per_step
  from attempts a
),
perf as (
  select
    m.*,
    least(greatest(m.crash_rate * 6.0, 0), 1) as crash_pen,
    least(greatest(m.help_rate * 3.0, 0), 1) as help_pen,
    least(greatest(m.revisit_rate * 2.0, 0), 1) as revisit_pen,
    least(greatest(m.time_per_step / 2.2, 0), 1) as time_pen,
    least(
      greatest(
        0.40 * m.success_n
        + 0.22 * m.efficiency
        + 0.14 * (1 - least(greatest(m.crash_rate * 6.0, 0), 1))
        + 0.10 * (1 - least(greatest(m.help_rate * 3.0, 0), 1))
        + 0.07 * (1 - least(greatest(m.revisit_rate * 2.0, 0), 1))
        + 0.07 * (1 - least(greatest(m.time_per_step / 2.2, 0), 1)),
        0
      ),
      1
    ) as perf_score
  from metrics m
),
windowed as (
  select
    curr.rn as current_rn,
    hist.perf_score,
    power((select alpha from params), (curr.rn - hist.rn))::numeric as w
  from perf curr
  join perf hist
    on hist.rn <= curr.rn
   and hist.rn > curr.rn - (select window_size from params)
),
mu_calc as (
  select
    current_rn,
    sum(perf_score * w) / nullif(sum(w), 0) as skill_mu,
    count(*) as sample_count
  from windowed
  group by current_rn
),
sigma_calc as (
  select
    w.current_rn,
    sqrt(greatest(sum(w.w * power(w.perf_score - m.skill_mu, 2)) / nullif(sum(w.w), 0), 1e-4)) as raw_sigma
  from windowed w
  join mu_calc m on m.current_rn = w.current_rn
  group by w.current_rn
),
evolution as (
  select
    p.rn as intent,
    p.ended_at,
    p.success_n::int as success,
    round(p.crashes_n, 0)::int as crashes,
    round(p.help_rate, 4) as help_rate,
    round(m.skill_mu, 4) as skill_mu,
    round(
      least(
        greatest(
          s.raw_sigma * least(m.sample_count::numeric / 12.0, 1)
          + 0.45 * (1 - least(m.sample_count::numeric / 12.0, 1)),
          0.12
        ),
        0.70
      ),
      4
    ) as skill_sigma,
    nullif((p.settings_snapshot -> 'dda' ->> 'memorizeTime'), '')::numeric as memorize_time,
    nullif((p.settings_snapshot -> 'dda' ->> 'pointsLossPerSecond'), '')::numeric as points_loss_per_second,
    nullif((p.settings_snapshot -> 'dda' ->> 'pointsCostReveal'), '')::numeric as points_cost_reveal
  from perf p
  join mu_calc m on m.current_rn = p.rn
  join sigma_calc s on s.current_rn = p.rn
),
latest_n as (
  select *
  from evolution
  order by intent desc
  limit (select max_rows from params)
)
select
  intent,
  ended_at,
  success,
  crashes,
  help_rate,
  skill_mu,
  skill_sigma,
  round(memorize_time, 2) as memorize_time,
  round(points_loss_per_second, 3) as points_loss_per_second,
  round(points_cost_reveal, 2) as points_cost_reveal
from latest_n
order by intent asc;


-- ============================================================================
-- B) TABLE B - MULTIPLAYER ROUND RESULTS (latest match or forced match id)
-- ============================================================================
with params as (
  select
    'REPLACE_WITH_USER_UUID'::uuid as user_id,
    null::uuid as forced_match_id           -- optional: set a specific match id
),
chosen_match as (
  select coalesce(
    (select forced_match_id from params),
    (
      select m.id
      from public.multiplayer_matches m
      join public.multiplayer_players mp on mp.match_id = m.id
      join params p on p.user_id = mp.user_id
      where m.status in ('active', 'finished')
      order by m.updated_at desc nulls last, m.created_at desc
      limit 1
    )
  ) as match_id
),
players as (
  select
    mp.match_id,
    mp.user_id,
    coalesce(mp.display_name, substr(mp.user_id::text, 1, 8)) as player_name,
    row_number() over (order by mp.joined_at asc, mp.user_id asc) as slot
  from public.multiplayer_players mp
  join chosen_match cm on cm.match_id = mp.match_id
),
round_points as (
  select
    rr.round_index,
    max(case when p.slot = 1 then rr.points end) as points_a,
    max(case when p.slot = 2 then rr.points end) as points_b
  from public.multiplayer_round_results rr
  join players p
    on p.match_id = rr.match_id
   and p.user_id = rr.user_id
  group by rr.round_index
),
round_winner as (
  select
    rp.*,
    case
      when coalesce(points_a, -1) > coalesce(points_b, -1) then 'A'
      when coalesce(points_b, -1) > coalesce(points_a, -1) then 'B'
      else 'EMPAT'
    end as winner_round
  from round_points rp
),
acc as (
  select
    rw.*,
    sum(case when winner_round = 'A' then 1 else 0 end) over (order by round_index) as rounds_a,
    sum(case when winner_round = 'B' then 1 else 0 end) over (order by round_index) as rounds_b
  from round_winner rw
),
meta as (
  select
    cm.match_id,
    max(case when p.slot = 1 then p.player_name end) as player_a,
    max(case when p.slot = 2 then p.player_name end) as player_b
  from chosen_match cm
  left join players p on p.match_id = cm.match_id
  group by cm.match_id
)
select
  m.match_id as partida,
  a.round_index as ronda,
  m.player_a,
  a.points_a,
  m.player_b,
  a.points_b,
  a.winner_round as guanyador_ronda,
  (a.rounds_a::text || '-' || a.rounds_b::text) as marcador_acumulat
from acc a
cross join meta m
order by a.round_index;


-- ============================================================================
-- C) TABLE C - PERSISTENCE SNAPSHOT (cloud side)
-- Note: local side must be captured from browser (snippet below).
-- ============================================================================
with params as (
  select 'REPLACE_WITH_USER_UUID'::uuid as user_id
),
cloud as (
  select
    p.user_id,
    up.easy,
    up.normal,
    up.hard,
    pb.max_score as practice_best_cloud,
    us.language as cloud_language,
    us.updated_at as settings_updated_at,
    count(lp.*) as campaign_levels_cloud,
    coalesce(sum(lp.stars), 0) as total_stars_cloud
  from params p
  left join public.user_progress up on up.user_id = p.user_id
  left join public.practice_best pb on pb.user_id = p.user_id
  left join public.user_settings us on us.user_id = p.user_id
  left join public.level_progress lp on lp.user_id = p.user_id
  group by p.user_id, up.easy, up.normal, up.hard, pb.max_score, us.language, us.updated_at
)
select
  user_id,
  easy,
  normal,
  hard,
  practice_best_cloud,
  cloud_language,
  settings_updated_at,
  campaign_levels_cloud,
  total_stars_cloud,
  case
    when easy is not null and normal is not null and hard is not null then 'OK'
    else 'CHECK'
  end as coherence_flag
from cloud;

-- Browser snippet for local snapshot (for Table C "Estat local"):
-- JSON.stringify({
--   progress: JSON.parse(localStorage.getItem('mazeMindProgress') || 'null'),
--   practiceBest: JSON.parse(localStorage.getItem('mazeMindPracticeBestScore') || '0'),
--   settings: JSON.parse(localStorage.getItem('mazeMindSettings') || 'null'),
--   language: localStorage.getItem('mazeMindLanguage')
-- }, null, 2);

