alter table public.matches
add column if not exists home_fouls integer check (home_fouls is null or home_fouls >= 0),
add column if not exists away_fouls integer check (away_fouls is null or away_fouls >= 0),
add column if not exists home_yellow_cards integer check (home_yellow_cards is null or home_yellow_cards >= 0),
add column if not exists away_yellow_cards integer check (away_yellow_cards is null or away_yellow_cards >= 0),
add column if not exists home_red_cards integer check (home_red_cards is null or home_red_cards >= 0),
add column if not exists away_red_cards integer check (away_red_cards is null or away_red_cards >= 0);
