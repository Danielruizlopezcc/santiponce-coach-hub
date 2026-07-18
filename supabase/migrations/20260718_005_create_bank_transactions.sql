create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  description text not null,
  amount_cents integer not null,
  status text not null default 'unmatched' check (status in ('unmatched', 'matched', 'ignored')),
  matched_movement_id uuid references public.admin_finance_movements(id) on delete set null,
  matched_payment_id uuid references public.payments(id) on delete set null,
  import_batch text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_bank_transactions_status on public.bank_transactions(status);
create index if not exists idx_bank_transactions_date on public.bank_transactions(transaction_date desc);

drop trigger if exists set_bank_transactions_updated_at on public.bank_transactions;
create trigger set_bank_transactions_updated_at
before update on public.bank_transactions
for each row execute function public.set_updated_at();

alter table public.bank_transactions enable row level security;

drop policy if exists "bank_transactions_admin_all" on public.bank_transactions;
create policy "bank_transactions_admin_all"
on public.bank_transactions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
