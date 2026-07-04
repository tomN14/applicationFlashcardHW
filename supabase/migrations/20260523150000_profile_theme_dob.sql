-- Profile appearance: color scheme + date of birth already has a column.

alter table public.profiles
  add column if not exists active_color_scheme text not null default 'default',
  add column if not exists saved_color_schemes jsonb not null default '[]'::jsonb;
