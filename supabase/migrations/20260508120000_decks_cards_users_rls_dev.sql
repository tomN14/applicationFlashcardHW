-- Dev-friendly RLS: allows anon/authenticated to read users and fully manage
-- decks/cards. Replace with auth-scoped policies before production.
create policy "users_select_anon"
on public.users for select
to anon, authenticated
using (true);

create policy "decks_all_anon"
on public.decks for all
to anon, authenticated
using (true)
with check (true);

create policy "cards_all_anon"
on public.cards for all
to anon, authenticated
using (true)
with check (true);
