-- =====================================================================
-- Vila Cup 3x3 — Migració 0002
-- Grups, comunicats, concurs de triples, normativa i play-off.
--
-- Executa aquest fitxer sencer a: Supabase Dashboard > SQL Editor > New query
-- És segur executar-lo dues vegades: tot està escrit per no petar si ja hi és.
-- =====================================================================

-- ---------- 1. Grups dins de cada categoria --------------------------
-- Un equip pertany a un grup ("A", "B"...) dins de la seva categoria.
-- Si és null, la categoria es tracta com un grup únic.

alter table public.teams
  add column if not exists group_name text;

create index if not exists teams_category_group_idx
  on public.teams (category, group_name);

-- ---------- 2. Normativa i bases de competició ------------------------

alter table public.settings
  add column if not exists rules_url text;

-- ---------- 3. Comunicats ---------------------------------------------

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Els publicats es llegeixen ordenats per data de publicació.
create index if not exists announcements_published_idx
  on public.announcements (published, published_at desc);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- Marca published_at automàticament el primer cop que es publica,
-- i el buida si es torna a passar a esborrany.
create or replace function public.sync_announcement_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.published and new.published_at is null then
    new.published_at = now();
  elsif not new.published then
    new.published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists announcements_sync_published_at on public.announcements;
create trigger announcements_sync_published_at
  before insert or update on public.announcements
  for each row execute function public.sync_announcement_published_at();

-- ---------- 4. Concurs de triples -------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'triples_division') then
    create type public.triples_division as enum ('noi', 'noia');
  end if;
end
$$;

create table if not exists public.triples_results (
  id          uuid primary key default gen_random_uuid(),
  division    public.triples_division not null,
  participant text not null,
  club        text,
  score       int  not null default 0,
  created_at  timestamptz not null default now(),
  constraint triples_score_positive check (score >= 0)
);

create index if not exists triples_division_score_idx
  on public.triples_results (division, score desc);

-- ---------- 5. Play-off: rondes i creuaments --------------------------

create table if not exists public.playoff_rounds (
  id         uuid primary key default gen_random_uuid(),
  category   public.category not null,
  name       text not null,              -- "Quarts de final", "Semifinals"...
  sort_order int  not null default 0,    -- ordre de la ronda dins la categoria
  created_at timestamptz not null default now()
);

create index if not exists playoff_rounds_category_idx
  on public.playoff_rounds (category, sort_order);

-- D'on surt cada equip d'un creuament:
--   group_position -> 1r del Grup A, 2n del Grup B...
--   winner         -> guanyador d'un creuament anterior
--   team           -> equip concret (convidat o classificat directe)
--   text           -> text lliure, per casos especials
do $$
begin
  if not exists (select 1 from pg_type where typname = 'slot_source') then
    create type public.slot_source as enum
      ('group_position', 'winner', 'team', 'text');
  end if;
end
$$;

create table if not exists public.playoff_matches (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.playoff_rounds(id) on delete cascade,
  slot       int  not null default 0,    -- ordre dins de la ronda
  court_id   uuid references public.courts(id) on delete set null,
  starts_at  timestamptz,

  -- Origen de l'equip local
  home_source     public.slot_source not null default 'text',
  home_group      text,
  home_rank       int,
  home_from_match uuid references public.playoff_matches(id) on delete set null,
  home_team_id    uuid references public.teams(id) on delete set null,
  home_label      text,

  -- Origen de l'equip visitant
  away_source     public.slot_source not null default 'text',
  away_group      text,
  away_rank       int,
  away_from_match uuid references public.playoff_matches(id) on delete set null,
  away_team_id    uuid references public.teams(id) on delete set null,
  away_label      text,

  -- Equips ja resolts (s'omplen en activar el play-off i en anar guanyant)
  resolved_home_team_id uuid references public.teams(id) on delete set null,
  resolved_away_team_id uuid references public.teams(id) on delete set null,

  home_score int not null default 0,
  away_score int not null default 0,
  status     public.match_status not null default 'programado',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint playoff_scores_positive check (home_score >= 0 and away_score >= 0)
);

create index if not exists playoff_matches_round_idx
  on public.playoff_matches (round_id, slot);

drop trigger if exists playoff_matches_set_updated_at on public.playoff_matches;
create trigger playoff_matches_set_updated_at
  before update on public.playoff_matches
  for each row execute function public.set_updated_at();

-- ---------- 6. Estat del play-off per categoria -----------------------

create table if not exists public.category_playoff (
  category     public.category primary key,
  active       boolean not null default false,
  activated_at timestamptz
);

-- Una fila per categoria, sempre.
insert into public.category_playoff (category)
select unnest(enum_range(null::public.category))
on conflict (category) do nothing;

-- ---------- 7. Congelar la fase de grups amb el play-off actiu --------
-- Requisit del client: en activar el play-off "es deixa d'editar els
-- resultats de la fase de grups". Ho bloquegem també a la base de dades,
-- no només a la interfície: si algú té una pestanya antiga oberta a la
-- taula de marcadors i toca un resultat després d'activar el play-off,
-- corromp la classificació de la qual penja tot el bracket.

create or replace function public.block_group_edits_during_playoff()
returns trigger
language plpgsql
as $$
declare
  locked boolean;
  target_category public.category;
begin
  -- En un DELETE, NEW no existeix (i llegir-lo peta), així que cal
  -- distingir l'operació abans de tocar cap dels dos registres.
  if tg_op = 'DELETE' then
    target_category = old.category;
  else
    target_category = new.category;
  end if;

  select active into locked
  from public.category_playoff
  where category = target_category;

  if coalesce(locked, false) then
    raise exception
      'El play-off de % està actiu: la fase de grups està congelada. Desactiva''l des de Play-off per tornar a editar.',
      target_category
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists matches_block_during_playoff on public.matches;
create trigger matches_block_during_playoff
  before insert or update or delete on public.matches
  for each row execute function public.block_group_edits_during_playoff();

-- ---------- 8. Row Level Security -------------------------------------
-- Mateix criteri que 0001: lectura pública, escriptura només per admins.
-- Excepció: els comunicats en esborrany NO són públics.

alter table public.announcements    enable row level security;
alter table public.triples_results  enable row level security;
alter table public.playoff_rounds   enable row level security;
alter table public.playoff_matches  enable row level security;
alter table public.category_playoff enable row level security;

drop policy if exists "announcements_public_read" on public.announcements;
create policy "announcements_public_read" on public.announcements
  for select using (published = true);

drop policy if exists "announcements_admin_read" on public.announcements;
create policy "announcements_admin_read" on public.announcements
  for select to authenticated using (public.is_admin());

drop policy if exists "triples_public_read" on public.triples_results;
create policy "triples_public_read" on public.triples_results
  for select using (true);

drop policy if exists "playoff_rounds_public_read" on public.playoff_rounds;
create policy "playoff_rounds_public_read" on public.playoff_rounds
  for select using (true);

drop policy if exists "playoff_matches_public_read" on public.playoff_matches;
create policy "playoff_matches_public_read" on public.playoff_matches
  for select using (true);

drop policy if exists "category_playoff_public_read" on public.category_playoff;
create policy "category_playoff_public_read" on public.category_playoff
  for select using (true);

drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "triples_admin_write" on public.triples_results;
create policy "triples_admin_write" on public.triples_results
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "playoff_rounds_admin_write" on public.playoff_rounds;
create policy "playoff_rounds_admin_write" on public.playoff_rounds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "playoff_matches_admin_write" on public.playoff_matches;
create policy "playoff_matches_admin_write" on public.playoff_matches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "category_playoff_admin_write" on public.category_playoff;
create policy "category_playoff_admin_write" on public.category_playoff
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 9. Realtime -----------------------------------------------
-- Perquè el bracket i els comunicats arribin sols, com els marcadors.

do $$
declare
  t text;
begin
  foreach t in array array[
    'announcements',
    'triples_results',
    'playoff_rounds',
    'playoff_matches',
    'category_playoff'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
