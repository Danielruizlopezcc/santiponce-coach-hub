create table if not exists public.finance_vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_finance_vendors_is_active on public.finance_vendors(is_active);

drop trigger if exists set_finance_vendors_updated_at on public.finance_vendors;
create trigger set_finance_vendors_updated_at
before update on public.finance_vendors
for each row execute function public.set_updated_at();

alter table public.finance_vendors enable row level security;

drop policy if exists "finance_vendors_admin_all" on public.finance_vendors;
create policy "finance_vendors_admin_all"
on public.finance_vendors for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

alter table public.admin_finance_movements
  add column if not exists vendor_id uuid references public.finance_vendors(id) on delete set null;

create index if not exists idx_admin_finance_movements_vendor_id on public.admin_finance_movements(vendor_id);
