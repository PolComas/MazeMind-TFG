-- Join private matches by code (bypasses RLS safely)
create or replace function public.join_match_by_code(
  p_code text,
  p_display_name text default null
) returns public.multiplayer_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.multiplayer_matches;
  v_user uuid;
  v_joined_count integer;
  v_already_joined boolean;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_match
  from public.multiplayer_matches
  where code = upper(p_code)
  limit 1;

  if not found then
    raise exception 'match_not_found';
  end if;

  if v_match.status <> 'waiting' then
    raise exception 'match_not_waiting';
  end if;

  select count(*) into v_joined_count
  from public.multiplayer_players
  where match_id = v_match.id
    and status = 'joined';

  select exists(
    select 1 from public.multiplayer_players
    where match_id = v_match.id and user_id = v_user
  ) into v_already_joined;

  if not v_already_joined and v_joined_count >= 2 then
    raise exception 'match_full';
  end if;

  insert into public.multiplayer_players(
    match_id, user_id, display_name, ready, total_points, total_time, rounds_won, status
  )
  values (
    v_match.id, v_user, p_display_name, false, 0, 0, 0, 'joined'
  )
  on conflict (match_id, user_id)
  do update set status = 'joined', display_name = excluded.display_name;

  return v_match;
end;
$$;

grant execute on function public.join_match_by_code(text, text) to authenticated;
