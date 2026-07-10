alter table public.training_sessions
add column if not exists series_id uuid;

alter table public.training_sessions
drop constraint if exists training_sessions_location_check;

alter table public.training_sessions
add constraint training_sessions_location_check
check (location in ('Campo 1', 'Campo 2', 'Campo completo', 'Anexo'));

create index if not exists idx_training_sessions_series_id
on public.training_sessions(series_id);
