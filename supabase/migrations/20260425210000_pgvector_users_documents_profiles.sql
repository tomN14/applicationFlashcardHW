-- ============================================================
-- pgvector + full app schema (8 tables)
-- Run in Supabase SQL Editor or via CLI migrations.
--
-- NOTE: This replaces prior public.profiles / public.decks /
-- public.cards shapes if those tables already exist with different
-- definitions. Review DROP statements below before running on prod.
-- ============================================================

-- Vector similarity search (OpenAI text-embedding-3-small = 1536 dims)
create extension if not exists vector;

-- Optional: consistent timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Tear down legacy tables from earlier iterations (same names).
-- Remove this block if you are merging into existing data manually.
-- ------------------------------------------------------------
drop table if exists public.events cascade;
drop table if exists public.embeddings cascade;
drop table if exists public.cards cascade;
drop table if exists public.decks cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.documents cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

-- ------------------------------------------------------------
-- users
-- Application user accounts stored in public schema.
-- Link rows to auth.users(id) via identical id when using Supabase Auth,
-- or populate via signup hook so JWT sub matches users.id.
-- Top tier: no FK dependencies on other app tables.
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email varchar(320) not null unique,
  password_hash varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- documents
-- User-owned documents (source material for RAG / embeddings).
-- Top tier: depends only on users.
-- ------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(512) not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents(user_id);

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- profiles
-- One profile row per user; stores app-facing identity fields.
-- Middle tier: references users.
-- ------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  username text unique,
  first_name text,
  last_name text,
  date_of_birth date,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- subscriptions
-- At most one subscription row per user (enforced by UNIQUE user_id).
-- Middle tier: references users.
-- ------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan varchar(32) not null default 'free'
    check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- decks
-- Flashcard decks owned by a user.
-- Middle tier: references users.
-- ------------------------------------------------------------
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(512) not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decks_user_id_idx on public.decks(user_id);
create index decks_is_public_idx on public.decks(is_public);

create trigger decks_set_updated_at
before update on public.decks
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- cards
-- Individual flashcards belonging to a deck; position defines study order.
-- Lower tier: references decks.
-- ------------------------------------------------------------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  front text not null,
  back text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deck_id, position)
);

create index cards_deck_id_idx on public.cards(deck_id);

create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- embeddings
-- Vector rows for semantic search; each row targets exactly one of
-- document_id OR card_id (mutually exclusive).
-- Lower tier: references documents and cards.
-- ------------------------------------------------------------
create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  embedding vector(1536) not null,
  model varchar(128),
  created_at timestamptz not null default now(),
  constraint embeddings_one_parent_ck check (
    (document_id is not null)::int + (card_id is not null)::int = 1
  )
);

create index embeddings_document_id_idx on public.embeddings(document_id)
  where document_id is not null;
create index embeddings_card_id_idx on public.embeddings(card_id)
  where card_id is not null;

-- Optional: IVFFlat / HNSW later for scale (requires analyze & lists tuning)
-- create index embeddings_embedding_ivfflat on public.embeddings
--   using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ------------------------------------------------------------
-- events
-- Append-only activity log; keeps rows when user is deleted (SET NULL).
-- Lower tier: references users optionally.
-- ------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_type varchar(128) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_user_id_idx on public.events(user_id);
create index events_event_type_idx on public.events(event_type);
create index events_created_at_idx on public.events(created_at desc);

-- ============================================================
-- Row Level Security — enabled only (policies added separately)
-- ============================================================
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.embeddings enable row level security;
alter table public.events enable row level security;
