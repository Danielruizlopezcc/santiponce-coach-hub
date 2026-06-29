alter table if exists public.match_player_stats
add column if not exists saves integer not null default 0 check (saves >= 0);

drop view if exists public.player_season_stats;
drop view if exists public.match_lineup_summary;

alter table if exists public.match_player_stats
drop column if exists shots_on_target,
drop column if exists goals_conceded,
drop column if exists rating;

alter table if exists public.match_player_stats
add column if not exists goal_minutes text,
add column if not exists yellow_card_minutes text,
add column if not exists red_card_minute integer check (red_card_minute is null or (red_card_minute >= 1 and red_card_minute <= 100));

alter table if exists public.match_player_stats
drop constraint if exists match_player_stats_minutes_max_100;

alter table if exists public.match_player_stats
add constraint match_player_stats_minutes_max_100
check (minutes >= 0 and minutes <= 100)
not valid;

alter table if exists public.match_player_stats
validate constraint match_player_stats_minutes_max_100;

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
  coalesce(sum(red_cards), 0) as red_cards,
  coalesce(sum(shots), 0) as shots,
  coalesce(sum(saves), 0) as saves
from public.match_player_stats
group by match_id, team_id, season_id;
