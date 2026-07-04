-- Per-card LaTeX rendering flags (question = front, answer = back)
alter table public.cards
  add column if not exists front_latex boolean not null default false,
  add column if not exists back_latex boolean not null default false;
