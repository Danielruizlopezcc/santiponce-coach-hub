create or replace function public.normalize_email(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.normalize_phone(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(value, ''), '\D', '', 'g');
$$;

create or replace function public.normalize_document(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(value, '')), '\s+', '', 'g'));
$$;

update public.profiles
set email = public.normalize_email(email)
where email <> public.normalize_email(email);

update public.guardians
set
  phone = public.normalize_phone(phone),
  document_id = public.normalize_document(document_id)
where
  phone <> public.normalize_phone(phone)
  or document_id <> public.normalize_document(document_id);

update public.athletes
set
  identification_value = public.normalize_document(identification_value),
  email = nullif(public.normalize_email(email), ''),
  mobile_phone = nullif(public.normalize_phone(mobile_phone), '')
where
  identification_value <> public.normalize_document(identification_value)
  or coalesce(email, '') <> coalesce(nullif(public.normalize_email(email), ''), '')
  or coalesce(mobile_phone, '') <> coalesce(nullif(public.normalize_phone(mobile_phone), ''), '');

create unique index if not exists profiles_email_unique_normalized
on public.profiles (public.normalize_email(email));

create unique index if not exists guardians_document_unique_normalized
on public.guardians (public.normalize_document(document_id));

create unique index if not exists guardians_phone_unique_normalized
on public.guardians (public.normalize_phone(phone));

create unique index if not exists athletes_document_unique_normalized
on public.athletes (public.normalize_document(identification_value));

create index if not exists idx_athletes_email_normalized
on public.athletes (public.normalize_email(email))
where email is not null and btrim(email) <> '';

create index if not exists idx_athletes_mobile_phone_normalized
on public.athletes (public.normalize_phone(mobile_phone))
where mobile_phone is not null and btrim(mobile_phone) <> '';

create or replace function public.enforce_guardian_uniqueness()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_phone text;
  normalized_document text;
begin
  normalized_phone := public.normalize_phone(new.phone);
  normalized_document := public.normalize_document(new.document_id);

  new.phone := normalized_phone;
  new.document_id := normalized_document;

  if exists (
    select 1
    from public.athletes a
    where public.normalize_document(a.identification_value) = normalized_document
  ) then
    raise exception 'Ese DNI/NIE ya pertenece a un deportista registrado.';
  end if;

  if exists (
    select 1
    from public.athletes a
    where a.mobile_phone is not null
      and public.normalize_phone(a.mobile_phone) = normalized_phone
      and a.guardian_id <> new.id
  ) then
    raise exception 'Ese teléfono ya está siendo usado por otra familia.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_athlete_uniqueness()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_document text;
  normalized_email text;
  normalized_phone text;
  owner_user_id uuid;
begin
  normalized_document := public.normalize_document(new.identification_value);
  normalized_email := nullif(public.normalize_email(new.email), '');
  normalized_phone := nullif(public.normalize_phone(new.mobile_phone), '');

  new.identification_value := normalized_document;
  new.email := normalized_email;
  new.mobile_phone := normalized_phone;

  select g.user_id
  into owner_user_id
  from public.guardians g
  where g.id = new.guardian_id;

  if exists (
    select 1
    from public.guardians g
    where public.normalize_document(g.document_id) = normalized_document
  ) then
    raise exception 'Ese documento ya pertenece a un tutor registrado.';
  end if;

  if normalized_phone is not null and exists (
    select 1
    from public.guardians g
    where public.normalize_phone(g.phone) = normalized_phone
      and g.id <> new.guardian_id
  ) then
    raise exception 'Ese teléfono ya está siendo usado por otra familia.';
  end if;

  if normalized_phone is not null and exists (
    select 1
    from public.athletes a
    where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and a.mobile_phone is not null
      and public.normalize_phone(a.mobile_phone) = normalized_phone
      and a.guardian_id <> new.guardian_id
  ) then
    raise exception 'Ese teléfono ya está siendo usado por otra familia.';
  end if;

  if normalized_email is not null and exists (
    select 1
    from public.profiles p
    where public.normalize_email(p.email) = normalized_email
      and p.id <> owner_user_id
  ) then
    raise exception 'Ese correo ya pertenece a otro usuario.';
  end if;

  if normalized_email is not null and exists (
    select 1
    from public.athletes a
    where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and a.email is not null
      and public.normalize_email(a.email) = normalized_email
      and a.guardian_id <> new.guardian_id
  ) then
    raise exception 'Ese correo ya está siendo usado por otra familia.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_guardian_uniqueness on public.guardians;
create trigger enforce_guardian_uniqueness
before insert or update on public.guardians
for each row execute function public.enforce_guardian_uniqueness();

drop trigger if exists enforce_athlete_uniqueness on public.athletes;
create trigger enforce_athlete_uniqueness
before insert or update on public.athletes
for each row execute function public.enforce_athlete_uniqueness();
