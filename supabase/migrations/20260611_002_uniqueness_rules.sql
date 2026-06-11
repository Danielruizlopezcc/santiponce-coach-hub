create or replace function public.normalize_email(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else lower(trim(value))
  end;
$$;

create or replace function public.normalize_phone(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else regexp_replace(trim(value), '[^0-9]', '', 'g')
  end;
$$;

create or replace function public.normalize_document(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else upper(regexp_replace(trim(value), '\s+', '', 'g'))
  end;
$$;

create unique index if not exists idx_guardians_document_unique
on public.guardians (public.normalize_document(document_id));

create unique index if not exists idx_guardians_phone_unique
on public.guardians (public.normalize_phone(phone));

create unique index if not exists idx_athletes_identification_unique
on public.athletes (public.normalize_document(identification_value));

create or replace function public.guardian_email(guardian_row public.guardians)
returns text
language sql
stable
as $$
  select p.email
  from public.profiles p
  where p.id = guardian_row.user_id;
$$;

create or replace function public.validate_guardian_uniqueness()
returns trigger
language plpgsql
as $$
declare
  current_guardian_id uuid;
begin
  current_guardian_id := coalesce(new.id, gen_random_uuid());
  new.id := current_guardian_id;

  if exists (
    select 1
    from public.athletes a
    where a.guardian_id <> current_guardian_id
      and a.mobile_phone is not null
      and public.normalize_phone(a.mobile_phone) = public.normalize_phone(new.phone)
  ) then
    raise exception 'Ya existe otro usuario con este teléfono';
  end if;

  if exists (
    select 1
    from public.athletes a
    where public.normalize_document(a.identification_value) =
      public.normalize_document(new.document_id)
  ) then
    raise exception 'Ya existe un documento identificativo con ese DNI/NIE';
  end if;

  return new;
end;
$$;

create or replace function public.validate_athlete_uniqueness()
returns trigger
language plpgsql
as $$
begin
  if new.mobile_phone is not null and trim(new.mobile_phone) <> '' then
    if exists (
      select 1
      from public.guardians g
      where g.id <> new.guardian_id
        and public.normalize_phone(g.phone) = public.normalize_phone(new.mobile_phone)
    ) then
      raise exception 'Ese teléfono ya pertenece a otro usuario';
    end if;

    if exists (
      select 1
      from public.athletes a
      where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and a.guardian_id <> new.guardian_id
        and a.mobile_phone is not null
        and public.normalize_phone(a.mobile_phone) = public.normalize_phone(new.mobile_phone)
    ) then
      raise exception 'Ese teléfono ya está registrado por otra familia';
    end if;
  end if;

  if new.email is not null and trim(new.email) <> '' then
    if exists (
      select 1
      from public.guardians g
      join public.profiles p on p.id = g.user_id
      where g.id <> new.guardian_id
        and public.normalize_email(p.email) = public.normalize_email(new.email)
    ) then
      raise exception 'Ese correo ya pertenece a otro usuario';
    end if;

    if exists (
      select 1
      from public.athletes a
      where a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and a.guardian_id <> new.guardian_id
        and a.email is not null
        and public.normalize_email(a.email) = public.normalize_email(new.email)
    ) then
      raise exception 'Ese correo ya está registrado por otra familia';
    end if;
  end if;

  if exists (
    select 1
    from public.guardians g
    where public.normalize_document(g.document_id) =
      public.normalize_document(new.identification_value)
  ) then
    raise exception 'Ese documento identificativo ya pertenece a otra persona';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_guardian_uniqueness on public.guardians;
create trigger validate_guardian_uniqueness
before insert or update on public.guardians
for each row execute function public.validate_guardian_uniqueness();

drop trigger if exists validate_athlete_uniqueness on public.athletes;
create trigger validate_athlete_uniqueness
before insert or update on public.athletes
for each row execute function public.validate_athlete_uniqueness();
