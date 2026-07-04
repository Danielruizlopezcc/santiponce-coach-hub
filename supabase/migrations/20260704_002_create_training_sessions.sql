create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  training_date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 360),
  location text not null check (location in ('Campo 1', 'Campo 2', 'Anexo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_sessions_team_id
on public.training_sessions(team_id);

create index if not exists idx_training_sessions_season_id
on public.training_sessions(season_id);

create index if not exists idx_training_sessions_training_date
on public.training_sessions(training_date);

drop trigger if exists set_training_sessions_updated_at on public.training_sessions;
create trigger set_training_sessions_updated_at
before update on public.training_sessions
for each row execute function public.set_updated_at();

alter table public.training_sessions enable row level security;

drop policy if exists "training_sessions_select_admin" on public.training_sessions;
create policy "training_sessions_select_admin"
on public.training_sessions for select
using (public.is_admin(auth.uid()));

drop policy if exists "training_sessions_admin_write" on public.training_sessions;
create policy "training_sessions_admin_write"
on public.training_sessions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
