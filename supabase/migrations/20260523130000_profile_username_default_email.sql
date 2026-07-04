-- Default new profile usernames to the user's email (do not overwrite on conflict).
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
