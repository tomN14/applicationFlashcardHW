-- Community deck saves: copied decks track their source; popularity via save_count.

alter table public.decks
  add column if not exists source_deck_id uuid references public.decks(id) on delete set null,
  add column if not exists source_synced_at timestamptz,
  add column if not exists save_count integer not null default 0;

create unique index if not exists decks_one_copy_per_source_per_user
  on public.decks (user_id, source_deck_id)
  where source_deck_id is not null;

create index if not exists decks_source_deck_id_idx
  on public.decks (source_deck_id)
  where source_deck_id is not null;
