create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  should_bootstrap_admin boolean;
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

  select not exists (
    select 1
    from public.user_roles
    where role = 'admin'
      and user_id <> new.id
  )
  into should_bootstrap_admin;

  if should_bootstrap_admin then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.promote_user_to_admin_by_email(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from public.profiles
  where public.normalize_email(email) = public.normalize_email(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'No existe ningún usuario con el correo %', target_email;
  end if;

  perform public.promote_user_to_admin(target_user_id);

  return target_user_id;
end;
$$;
