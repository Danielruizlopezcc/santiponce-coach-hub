create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  document_id text not null,
  address_line text not null,
  postal_code text not null,
  province text not null,
  city text not null,
  country text not null default 'España',
  payment_preference text not null check (payment_preference in ('cuotas', 'unico')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references public.categories(id),
  season_id uuid not null references public.seasons(id),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (name, season_id)
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  identification_type text not null check (identification_type in ('DNI', 'NIE', 'Pasaporte', 'Otro')),
  identification_value text not null,
  email text,
  mobile_phone text,
  health_notes text,
  has_siblings_in_club boolean not null default false,
  sibling_name text,
  requested_category_id uuid not null references public.categories(id),
  assigned_team_id uuid references public.teams(id),
  status text not null default 'pendiente' check (status in ('pendiente', 'matriculado', 'en_revision')),
  season_id uuid not null references public.seasons(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.consent_documents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  version text not null,
  is_required boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  document_id uuid not null references public.consent_documents(id),
  accepted boolean not null,
  signer_full_name text not null,
  signer_document_id text not null,
  accepted_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_guardians_user_id on public.guardians(user_id);
create index if not exists idx_athletes_guardian_id on public.athletes(guardian_id);
create index if not exists idx_athletes_requested_category_id on public.athletes(requested_category_id);
create index if not exists idx_athletes_season_id on public.athletes(season_id);
create index if not exists idx_consents_guardian_id on public.consents(guardian_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_guardians_updated_at on public.guardians;
create trigger set_guardians_updated_at
before update on public.guardians
for each row execute function public.set_updated_at();

drop trigger if exists set_seasons_updated_at on public.seasons;
create trigger set_seasons_updated_at
before update on public.seasons
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists set_athletes_updated_at on public.athletes;
create trigger set_athletes_updated_at
before update on public.athletes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.promote_user_to_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (target_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.guardians enable row level security;
alter table public.seasons enable row level security;
alter table public.categories enable row level security;
alter table public.teams enable row level security;
alter table public.athletes enable row level security;
alter table public.consent_documents enable row level security;
alter table public.consents enable row level security;

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "roles_select_own_or_admin" on public.user_roles;
create policy "roles_select_own_or_admin"
on public.user_roles for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "guardians_select_own_or_admin" on public.guardians;
create policy "guardians_select_own_or_admin"
on public.guardians for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "guardians_insert_own" on public.guardians;
create policy "guardians_insert_own"
on public.guardians for insert
with check (auth.uid() = user_id);

drop policy if exists "guardians_update_own_or_admin" on public.guardians;
create policy "guardians_update_own_or_admin"
on public.guardians for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "seasons_read_all_authenticated" on public.seasons;
create policy "seasons_read_all_authenticated"
on public.seasons for select
using (auth.uid() is not null);

drop policy if exists "categories_read_all_authenticated" on public.categories;
create policy "categories_read_all_authenticated"
on public.categories for select
using (auth.uid() is not null);

drop policy if exists "teams_read_all_authenticated" on public.teams;
create policy "teams_read_all_authenticated"
on public.teams for select
using (auth.uid() is not null);

drop policy if exists "athletes_select_own_or_admin" on public.athletes;
create policy "athletes_select_own_or_admin"
on public.athletes for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.guardians g
    where g.id = guardian_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "athletes_insert_own_guardian" on public.athletes;
create policy "athletes_insert_own_guardian"
on public.athletes for insert
with check (
  exists (
    select 1
    from public.guardians g
    where g.id = guardian_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "athletes_update_own_or_admin" on public.athletes;
create policy "athletes_update_own_or_admin"
on public.athletes for update
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.guardians g
    where g.id = guardian_id
      and g.user_id = auth.uid()
  )
)
with check (
  public.is_admin(auth.uid())
  or (
    assigned_team_id is null
    and exists (
      select 1
      from public.guardians g
      where g.id = guardian_id
        and g.user_id = auth.uid()
    )
  )
);

drop policy if exists "consent_documents_read_all_authenticated" on public.consent_documents;
create policy "consent_documents_read_all_authenticated"
on public.consent_documents for select
using (auth.uid() is not null);

drop policy if exists "consents_select_own_or_admin" on public.consents;
create policy "consents_select_own_or_admin"
on public.consents for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.guardians g
    where g.id = guardian_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own"
on public.consents for insert
with check (
  exists (
    select 1
    from public.guardians g
    where g.id = guardian_id
      and g.user_id = auth.uid()
  )
);

insert into public.seasons (name, starts_at, ends_at, is_active)
values ('2026/2027', '2026-09-01', '2027-06-30', true)
on conflict (name) do nothing;

insert into public.categories (name, sort_order, is_active)
values
  ('Bebés', 1, true),
  ('Prebenjamín', 2, true),
  ('Benjamín', 3, true),
  ('Alevín', 4, true),
  ('Infantil', 5, true),
  ('Cadete', 6, true),
  ('Juvenil', 7, true)
on conflict (name) do nothing;

insert into public.consent_documents (code, title, version, is_required)
values
  ('privacy_policy', 'Política de privacidad', 'v2026.1', true),
  ('enrollment_terms', 'Condiciones de matrícula', 'v2026.1', true),
  ('minor_data', 'Tratamiento de datos del menor', 'v2026.1', true),
  ('health_data', 'Tratamiento de datos de salud y alergias', 'v2026.1', true),
  ('image_rights', 'Autorización de fotografías y vídeos', 'v2026.1', false),
  ('stripe_payment_method', 'Consentimiento para guardar método de pago', 'v2026.1', true)
on conflict (code) do nothing;
