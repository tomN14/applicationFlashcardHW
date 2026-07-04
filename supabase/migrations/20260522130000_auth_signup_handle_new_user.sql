-- Fix "Database error saving new user" on sign-up.
-- Supabase Auth runs triggers on auth.users; a broken trigger (missing password_hash,
-- RLS, or wrong columns) rolls back signup and returns that error.

-- Remove custom triggers on auth.users (keeps internal system triggers).
do $$
declare
  r record;
begin
  for r in
    select t.tgname as name
    from pg_trigger t
    join pg_class c on t.tgrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', r.name);
  end loop;
end $$;

drop function if exists public.handle_new_user() cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(trim(new.email));
  if v_email is null or v_email = '' then
    return new;
  end if;

  insert into public.users (id, email, password_hash)
  values (new.id, v_email, 'supabase_auth')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.profiles (user_id, username)
  values (new.id, v_email)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Let supabase_auth_admin run the trigger inserts (required on hosted Supabase).
grant usage on schema public to supabase_auth_admin;
grant insert, update on table public.users to supabase_auth_admin;
grant insert, update on table public.profiles to supabase_auth_admin;
grant insert, update on table public.subscriptions to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
