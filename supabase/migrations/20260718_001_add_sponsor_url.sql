alter table public.sponsors
  add column if not exists url text not null default 'https://santiponce-coach-hub.vercel.app/';
