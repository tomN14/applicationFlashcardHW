-- Remove legacy "light" scheme (same as default).
update public.profiles
set active_color_scheme = 'default'
where active_color_scheme = 'light';
