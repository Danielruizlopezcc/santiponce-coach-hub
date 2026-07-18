insert into public.app_settings (key, value)
values
  ('club_tax_id', ''),
  ('club_fiscal_address', ''),
  ('club_registry_number', '')
on conflict (key) do nothing;
