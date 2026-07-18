create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  movement_type text not null check (movement_type in ('income', 'expense')),
  category text not null,
  budgeted_amount_cents integer not null check (budgeted_amount_cents > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (season_id, movement_type, category)
);

create index if not exists idx_finance_budgets_season_id on public.finance_budgets(season_id);

drop trigger if exists set_finance_budgets_updated_at on public.finance_budgets;
create trigger set_finance_budgets_updated_at
before update on public.finance_budgets
for each row execute function public.set_updated_at();

alter table public.finance_budgets enable row level security;

drop policy if exists "finance_budgets_admin_all" on public.finance_budgets;
create policy "finance_budgets_admin_all"
on public.finance_budgets for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
