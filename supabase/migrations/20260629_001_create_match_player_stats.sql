create table if not exists public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  is_called_up boolean not null default false,
  is_starter boolean not null default false,
  position text,
  shirt_number integer check (shirt_number is null or (shirt_number >= 0 and shirt_number <= 99)),
  minutes integer not null default 0 check (minutes >= 0 and minutes <= 100),
  goals integer not null default 0 check (goals >= 0),
  goal_minutes text,
  assists integer not null default 0 check (assists >= 0),
  fouls_committed integer not null default 0 check (fouls_committed >= 0),
  fouls_received integer not null default 0 check (fouls_received >= 0),
  yellow_cards integer not null default 0 check (yellow_cards >= 0 and yellow_cards <= 2),
  yellow_card_minutes text,
  red_cards integer not null default 0 check (red_cards >= 0 and red_cards <= 1),
  red_card_minute integer check (red_card_minute is null or (red_card_minute >= 1 and red_card_minute <= 100)),
  shots integer not null default 0 check (shots >= 0),
  saves integer not null default 0 check (saves >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (match_id, athlete_id),
  check (is_called_up or not is_starter)
);

create index if not exists idx_match_player_stats_match_id
on public.match_player_stats(match_id);

create index if not exists idx_match_player_stats_team_season
on public.match_player_stats(team_id, season_id);

create index if not exists idx_match_player_stats_athlete_season
on public.match_player_stats(athlete_id, season_id);

create index if not exists idx_match_player_stats_called_up
on public.match_player_stats(match_id, is_called_up);

drop trigger if exists set_match_player_stats_updated_at on public.match_player_stats;
create trigger set_match_player_stats_updated_at
before update on public.match_player_stats
for each row execute function public.set_updated_at();

alter table public.match_player_stats enable row level security;

drop policy if exists "match_player_stats_select_authenticated" on public.match_player_stats;
create policy "match_player_stats_select_authenticated"
on public.match_player_stats for select
using (auth.uid() is not null);

drop policy if exists "match_player_stats_admin_write" on public.match_player_stats;
create policy "match_player_stats_admin_write"
on public.match_player_stats for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "match_player_stats_coach_write_assigned_team" on public.match_player_stats;
create policy "match_player_stats_coach_write_assigned_team"
on public.match_player_stats for all
using (
  exists (
    select 1
    from public.coach_team_assignments cta
    where cta.coach_user_id = auth.uid()
      and cta.team_id = match_player_stats.team_id
  )
)
with check (
  exists (
    select 1
    from public.coach_team_assignments cta
    where cta.coach_user_id = auth.uid()
      and cta.team_id = match_player_stats.team_id
  )
);

create or replace view public.player_season_stats as
select
  athlete_id,
  team_id,
  season_id,
  count(*) filter (where is_called_up) as callups,
  count(*) filter (where is_starter) as starts,
  count(*) filter (where is_called_up and not is_starter) as substitute_callups,
  coalesce(sum(minutes), 0) as minutes,
  coalesce(sum(goals), 0) as goals,
  coalesce(sum(assists), 0) as assists,
  coalesce(sum(fouls_committed), 0) as fouls_committed,
  coalesce(sum(fouls_received), 0) as fouls_received,
  coalesce(sum(yellow_cards), 0) as yellow_cards,
  coalesce(sum(red_cards), 0) as red_cards,
  coalesce(sum(shots), 0) as shots,
  coalesce(sum(saves), 0) as saves
from public.match_player_stats
group by athlete_id, team_id, season_id;

create or replace view public.match_lineup_summary as
select
  match_id,
  team_id,
  season_id,
  count(*) filter (where is_called_up) as called_up,
  count(*) filter (where is_starter) as starters,
  coalesce(sum(goals), 0) as goals,
  coalesce(sum(assists), 0) as assists,
  coalesce(sum(yellow_cards), 0) as yellow_cards,
  coalesce(sum(red_cards), 0) as red_cards
from public.match_player_stats
group by match_id, team_id, season_id;
