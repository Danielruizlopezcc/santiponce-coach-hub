alter table public.tutor_fee_assignments
  add column if not exists athlete_id uuid references public.athletes(id) on delete cascade;

alter table public.tutor_fee_charges
  add column if not exists athlete_id uuid references public.athletes(id) on delete cascade;

create index if not exists idx_tutor_fee_assignments_athlete_id
on public.tutor_fee_assignments(athlete_id);

create index if not exists idx_tutor_fee_charges_athlete_id
on public.tutor_fee_charges(athlete_id);
