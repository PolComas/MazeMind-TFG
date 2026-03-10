-- FIX: Error 42P17 (Infinite recursion)
-- The issue is that the policies for 'multiplayer_matches' and 'multiplayer_players' cross-reference each other recursively.

-- 1. Create a helper function to bypass RLS when checking participation
create or replace function public.get_my_matches()
returns setof uuid
language sql
security definer
stable
as $$
  select match_id from public.multiplayer_players where user_id = auth.uid();
$$;

-- 2. Update 'mp_matches_select' to use the function instead of direct table access
drop policy if exists "mp_matches_select" on public.multiplayer_matches;
create policy "mp_matches_select"
  on public.multiplayer_matches for select
  using (
    is_public
    or auth.uid() = host_id
    or id in (select public.get_my_matches())
  );

-- 3. Update 'mp_matches_update'
drop policy if exists "mp_matches_update" on public.multiplayer_matches;
create policy "mp_matches_update"
  on public.multiplayer_matches for update
  using (
    auth.uid() = host_id
    or id in (select public.get_my_matches())
  );

-- 4. Update 'mp_players_select' 
-- We can allow users to see players if they are in the same match (via the function match list)
drop policy if exists "mp_players_select" on public.multiplayer_players;
create policy "mp_players_select"
  on public.multiplayer_players for select
  using (
    match_id in (select public.get_my_matches())
    or 
    match_id in (select id from public.multiplayer_matches where is_public = true or host_id = auth.uid())
  );
  
-- 5. Fix round results as well just in case
drop policy if exists "mp_round_select" on public.multiplayer_round_results;
create policy "mp_round_select"
  on public.multiplayer_round_results for select
  using (
    match_id in (select public.get_my_matches())
    or match_id in (select id from public.multiplayer_matches where host_id = auth.uid())
  );
