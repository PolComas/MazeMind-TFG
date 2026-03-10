-- 5) Configuració d'usuari (sincronitzada com JSONB)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings self select" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "user_settings self upsert" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "user_settings self update" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
