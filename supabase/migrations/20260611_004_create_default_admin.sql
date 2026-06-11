create or replace function public.create_default_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid;
  admin_email text := 'admin@cdsantiponce.local';
  admin_password text := 'CDS_Admin_2026!X9#Qv';
begin
  select id
  into new_user_id
  from auth.users
  where email = admin_email
  limit 1;

  if new_user_id is null then
    new_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt(admin_password, extensions.gen_salt('bf')),
      timezone('utc', now()),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('first_name', 'Admin', 'last_name', 'Santiponce'),
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    );
  end if;

  perform public.promote_user_to_admin(new_user_id);

  return new_user_id;
end;
$$;

select public.create_default_admin();
