alter table public.payments
drop constraint if exists payments_status_check;

alter table public.payments
add constraint payments_status_check
check (status in ('pending', 'paid', 'canceled', 'failed', 'refunded'));

create table if not exists public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  form_data jsonb not null,
  stripe_customer_id text,
  stripe_setup_session_id text unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'canceled', 'failed')),
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pending_registrations_status
on public.pending_registrations(status);

create index if not exists idx_pending_registrations_setup_session
on public.pending_registrations(stripe_setup_session_id);

drop trigger if exists set_pending_registrations_updated_at on public.pending_registrations;
create trigger set_pending_registrations_updated_at
before update on public.pending_registrations
for each row execute function public.set_updated_at();

alter table public.pending_registrations enable row level security;

drop policy if exists "pending_registrations_admin_read" on public.pending_registrations;
create policy "pending_registrations_admin_read"
on public.pending_registrations for select
using (public.is_admin(auth.uid()));
