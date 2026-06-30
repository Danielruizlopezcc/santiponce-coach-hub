create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_admin" on public.app_settings;
create policy "app_settings_select_admin"
on public.app_settings for select
using (public.is_admin(auth.uid()));

drop policy if exists "app_settings_insert_admin" on public.app_settings;
create policy "app_settings_insert_admin"
on public.app_settings for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "app_settings_update_admin" on public.app_settings;
create policy "app_settings_update_admin"
on public.app_settings for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.app_settings (key, value)
values
  ('club_short_name', 'CD Santiponce'),
  ('club_legal_name', 'Club Deportivo Santiponce'),
  ('season_label', '2026/2027'),
  ('membership_fee_euros', '20'),
  ('enrollment_fee_euros', '50'),
  ('registration_open', 'true'),
  ('contact_email', ''),
  ('contact_phone', '')
on conflict (key) do nothing;
