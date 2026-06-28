create table if not exists public.coach_team_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (coach_user_id)
);

create index if not exists idx_coach_team_assignments_coach_user_id
on public.coach_team_assignments(coach_user_id);

create index if not exists idx_coach_team_assignments_team_id
on public.coach_team_assignments(team_id);

drop trigger if exists set_coach_team_assignments_updated_at on public.coach_team_assignments;
create trigger set_coach_team_assignments_updated_at
before update on public.coach_team_assignments
for each row execute function public.set_updated_at();

alter table public.coach_team_assignments enable row level security;

drop policy if exists "coach_team_assignments_select_own_or_admin" on public.coach_team_assignments;
create policy "coach_team_assignments_select_own_or_admin"
on public.coach_team_assignments for select
using (auth.uid() = coach_user_id or public.is_admin(auth.uid()));

drop policy if exists "coach_team_assignments_admin_write" on public.coach_team_assignments;
create policy "coach_team_assignments_admin_write"
on public.coach_team_assignments for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
