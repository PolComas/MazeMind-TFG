-- Store language preference for each user
alter table public.user_settings
  add column if not exists language text;

do $$
begin
  alter table public.user_settings
    add constraint user_settings_language_check
    check (language in ('ca', 'es', 'en'));
exception
  when duplicate_object then null;
end $$;

update public.user_settings
set language = 'ca'
where language is null;

alter table public.user_settings
  alter column language set default 'ca';
