-- Fix idempotència (trigger i policy delete)

drop trigger if exists trg_multiplayer_matches_updated_at on public.multiplayer_matches;
create trigger trg_multiplayer_matches_updated_at before update on public.multiplayer_matches
for each row execute function set_updated_at();

-- Assegurar policy de delete per neteja automàtica

drop policy if exists "mp_matches_delete" on public.multiplayer_matches;
create policy "mp_matches_delete"
  on public.multiplayer_matches for delete
  using (auth.uid() = host_id);
