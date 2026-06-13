create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guardian_id uuid references public.guardians(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  payment_type text not null check (payment_type in ('membership', 'enrollment')),
  provider text not null default 'stripe' check (provider in ('stripe', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'failed')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_email text,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_guardian_id on public.payments(guardian_id);
create index if not exists idx_payments_athlete_id on public.payments(athlete_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_payment_type on public.payments(payment_type);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
on public.payments for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payments_insert_own_or_admin" on public.payments;
create policy "payments_insert_own_or_admin"
on public.payments for insert
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "payments_update_own_or_admin" on public.payments;
create policy "payments_update_own_or_admin"
on public.payments for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));
