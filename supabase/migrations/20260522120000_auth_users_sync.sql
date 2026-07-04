-- Optional: keep public.users in sync when using Supabase Auth triggers.
-- The app also syncs via ensurePublicUser() on sign-in/sign-up.

-- Allow authenticated users to read their own row (tighten from dev policy later).
create policy if not exists "users_select_own"
on public.users for select
to authenticated
using (id = auth.uid());

-- Profiles/subscriptions: read own row
create policy if not exists "profiles_select_own"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy if not exists "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());
