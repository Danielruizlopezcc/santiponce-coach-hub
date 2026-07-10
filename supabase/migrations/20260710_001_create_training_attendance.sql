create table if not exists public.training_attendance (
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status text not null check (status in ('attended', 'justified_absence', 'unjustified_absence', 'late')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (training_session_id, athlete_id)
);

create index if not exists training_attendance_team_id_idx
  on public.training_attendance(team_id);

create index if not exists training_attendance_season_id_idx
  on public.training_attendance(season_id);

create index if not exists training_attendance_athlete_id_idx
  on public.training_attendance(athlete_id);

create or replace function public.set_training_attendance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists training_attendance_set_updated_at on public.training_attendance;
create trigger training_attendance_set_updated_at
before update on public.training_attendance
for each row
execute function public.set_training_attendance_updated_at();
