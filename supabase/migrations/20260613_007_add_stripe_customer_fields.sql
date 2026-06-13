alter table public.profiles
  add column if not exists stripe_customer_id text unique;

alter table public.profiles
  add column if not exists stripe_payment_method_id text;

alter table public.profiles
  add column if not exists payment_method_brand text;

alter table public.profiles
  add column if not exists payment_method_last4 text;

alter table public.profiles
  add column if not exists payment_method_exp_month integer;

alter table public.profiles
  add column if not exists payment_method_exp_year integer;

alter table public.profiles
  add column if not exists payment_method_saved_at timestamptz;
