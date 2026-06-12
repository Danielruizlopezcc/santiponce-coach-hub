alter table public.profiles
  add column if not exists is_paid_member boolean not null default false;

alter table public.profiles
  add column if not exists membership_paid_at timestamptz;

-- Marca como pagados los socios que ya tienen el rol `member`.
update public.profiles p
set is_paid_member = true,
    membership_paid_at = coalesce(p.membership_paid_at, timezone('utc', now()))
from public.user_roles ur
where ur.user_id = p.id
  and ur.role = 'member'
  and p.is_paid_member = false;
