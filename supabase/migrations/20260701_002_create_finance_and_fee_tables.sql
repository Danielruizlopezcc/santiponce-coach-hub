-- Documents the schema of 4 tables that were created out-of-band (outside
-- migration history) and are used extensively by /admin/pagos. All
-- statements are idempotent (if not exists / drop-then-create), so this is
-- a safe no-op against the existing production database and only takes
-- effect when applied to a fresh environment.

-- admin_fee_templates: reusable cuota/fee definitions configured by admins
create table if not exists public.admin_fee_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_type text not null,
  total_amount_cents integer not null check (total_amount_cents > 0),
  currency text not null default 'eur',
  is_public boolean not null default true,
  split_payment boolean not null default false,
  charge_frequency text,
  charge_count integer,
  stripe_product_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_fee_templates_charge_count_check check (charge_count is null or charge_count > 1),
  constraint admin_fee_templates_split_check check (
    (charge_frequency is null or charge_frequency in ('cada_mes', 'cada_2_meses', 'cada_3_meses', 'cada_6_meses'))
    and (
      (not split_payment and charge_frequency is null and charge_count is null)
      or (split_payment and charge_frequency is not null and charge_count is not null)
    )
  )
);

drop trigger if exists set_admin_fee_templates_updated_at on public.admin_fee_templates;
create trigger set_admin_fee_templates_updated_at
before update on public.admin_fee_templates
for each row execute function public.set_updated_at();

alter table public.admin_fee_templates enable row level security;

drop policy if exists "admin_fee_templates_admin_all" on public.admin_fee_templates;
create policy "admin_fee_templates_admin_all"
on public.admin_fee_templates for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- tutor_fee_assignments: a fee template scheduled for one athlete/guardian
create table if not exists public.tutor_fee_assignments (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  fee_template_id uuid not null references public.admin_fee_templates(id),
  charge_day integer not null check (charge_day between 1 and 28),
  start_month date not null,
  status text not null default 'active' check (status in ('active', 'canceled', 'completed')),
  stripe_subscription_schedule_id text,
  stripe_subscription_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tutor_fee_assignments_guardian_id on public.tutor_fee_assignments(guardian_id);
create index if not exists idx_tutor_fee_assignments_athlete_id on public.tutor_fee_assignments(athlete_id);
create index if not exists idx_tutor_fee_assignments_fee_template_id on public.tutor_fee_assignments(fee_template_id);
create index if not exists idx_tutor_fee_assignments_status on public.tutor_fee_assignments(status);

drop trigger if exists set_tutor_fee_assignments_updated_at on public.tutor_fee_assignments;
create trigger set_tutor_fee_assignments_updated_at
before update on public.tutor_fee_assignments
for each row execute function public.set_updated_at();

alter table public.tutor_fee_assignments enable row level security;

drop policy if exists "tutor_fee_assignments_admin_all" on public.tutor_fee_assignments;
create policy "tutor_fee_assignments_admin_all"
on public.tutor_fee_assignments for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- tutor_fee_charges: individual scheduled installments for an assignment
create table if not exists public.tutor_fee_charges (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.tutor_fee_assignments(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  fee_template_id uuid not null references public.admin_fee_templates(id),
  charge_number integer not null check (charge_number > 0),
  due_date date not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'scheduled' check (status in ('scheduled', 'paid', 'failed', 'canceled')),
  stripe_price_id text,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tutor_fee_charges_assignment_id on public.tutor_fee_charges(assignment_id);
create index if not exists idx_tutor_fee_charges_guardian_id on public.tutor_fee_charges(guardian_id);
create index if not exists idx_tutor_fee_charges_athlete_id on public.tutor_fee_charges(athlete_id);
create index if not exists idx_tutor_fee_charges_status on public.tutor_fee_charges(status);
create index if not exists idx_tutor_fee_charges_stripe_invoice_id on public.tutor_fee_charges(stripe_invoice_id);

drop trigger if exists set_tutor_fee_charges_updated_at on public.tutor_fee_charges;
create trigger set_tutor_fee_charges_updated_at
before update on public.tutor_fee_charges
for each row execute function public.set_updated_at();

alter table public.tutor_fee_charges enable row level security;

drop policy if exists "tutor_fee_charges_admin_all" on public.tutor_fee_charges;
create policy "tutor_fee_charges_admin_all"
on public.tutor_fee_charges for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- admin_finance_movements: manual bookkeeping ledger (income/expense not tied to Stripe)
create table if not exists public.admin_finance_movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('income', 'expense')),
  concept text not null,
  detail text,
  category text,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer', 'bizum', 'card', 'stripe', 'other')),
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'void')),
  season_id uuid references public.seasons(id) on delete set null,
  receipt_url text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  recorded_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_finance_movements_movement_type on public.admin_finance_movements(movement_type);
create index if not exists idx_admin_finance_movements_season_id on public.admin_finance_movements(season_id);
create index if not exists idx_admin_finance_movements_status on public.admin_finance_movements(status);
create index if not exists idx_admin_finance_movements_recorded_at on public.admin_finance_movements(recorded_at desc);

drop trigger if exists set_admin_finance_movements_updated_at on public.admin_finance_movements;
create trigger set_admin_finance_movements_updated_at
before update on public.admin_finance_movements
for each row execute function public.set_updated_at();

alter table public.admin_finance_movements enable row level security;

drop policy if exists "admin_finance_movements_admin_all" on public.admin_finance_movements;
create policy "admin_finance_movements_admin_all"
on public.admin_finance_movements for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
