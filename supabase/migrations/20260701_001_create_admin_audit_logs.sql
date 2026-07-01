create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_audit_logs_created_at
on public.admin_audit_logs(created_at desc);

create index if not exists idx_admin_audit_logs_actor
on public.admin_audit_logs(actor_user_id);

create index if not exists idx_admin_audit_logs_entity
on public.admin_audit_logs(entity_type, entity_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_select_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_select_admin"
on public.admin_audit_logs for select
using (public.is_admin(auth.uid()));

drop policy if exists "admin_audit_logs_insert_admin" on public.admin_audit_logs;
create policy "admin_audit_logs_insert_admin"
on public.admin_audit_logs for insert
with check (public.is_admin(auth.uid()));
