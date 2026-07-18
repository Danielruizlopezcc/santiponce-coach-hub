alter table public.categories
  add column if not exists enrollment_fee_cents integer;

alter table public.categories
  drop constraint if exists categories_enrollment_fee_cents_check;

alter table public.categories
  add constraint categories_enrollment_fee_cents_check
  check (enrollment_fee_cents is null or enrollment_fee_cents > 0);
