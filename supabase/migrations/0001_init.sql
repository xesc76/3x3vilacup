-- =====================================================================
-- Vila Cup 3x3 — Esquema inicial
-- Executa aquest fitxer sencer a: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- ---------- Tipus ----------------------------------------------------

create type public.category as enum (
  'minibasquet',  -- 2014-2017
  'infantil',     -- 2012-2013
  'cadet',        -- 2010-2011
  'junior',       -- 2008-2009
  'senior'        -- X-2007
);

create type public.match_status as enum (
  'programado',
  'en_juego',
  'finalizado'
);

-- ---------- Taules ---------------------------------------------------

create table public.courts (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  sort_order        int  not null default 0,
  google_photos_url text,
  created_at        timestamptz not null default now()
);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   public.category not null,
  logo_url   text,
  created_at timestamptz not null default now(),
  unique (name, category)
);

create table public.matches (
  id           uuid primary key default gen_random_uuid(),
  category     public.category not null,
  court_id     uuid references public.courts(id) on delete set null,
  starts_at    timestamptz not null,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  home_score   int  not null default 0,
  away_score   int  not null default 0,
  status       public.match_status not null default 'programado',
  round        text,                       -- "Grup A", "Semifinal", "Final"...
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint matches_distinct_teams check (home_team_id <> away_team_id),
  constraint matches_scores_positive check (home_score >= 0 and away_score >= 0)
);

create index matches_starts_at_idx on public.matches (starts_at);
create index matches_category_idx  on public.matches (category);
create index matches_court_idx     on public.matches (court_id);

create table public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text not null,
  website_url text,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Fila única de configuració global del torneig.
create table public.settings (
  id                 int primary key default 1,
  default_photos_url text,   -- àlbum de Google Photos compartit per tot el torneig
  live_message       text,   -- avís destacat a la home (retards, canvis d'última hora...)
  updated_at         timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1);

-- Qui pot escriure. Només els user_id que hi hagi aquí.
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- updated_at automàtic ------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Helper d'autorització ------------------------------------
-- security definer per poder llegir public.admins sense entrar en
-- recursió amb les seves pròpies polítiques RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

-- ---------- Row Level Security ---------------------------------------
-- Lectura: oberta a tothom (anon + authenticated).
-- Escriptura: només usuaris que siguin a public.admins.

alter table public.courts   enable row level security;
alter table public.teams    enable row level security;
alter table public.matches  enable row level security;
alter table public.sponsors enable row level security;
alter table public.settings enable row level security;
alter table public.admins   enable row level security;

create policy "courts_public_read"   on public.courts   for select using (true);
create policy "teams_public_read"    on public.teams    for select using (true);
create policy "matches_public_read"  on public.matches  for select using (true);
create policy "sponsors_public_read" on public.sponsors for select using (true);
create policy "settings_public_read" on public.settings for select using (true);

create policy "courts_admin_write"   on public.courts   for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "teams_admin_write"    on public.teams    for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "matches_admin_write"  on public.matches  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "sponsors_admin_write" on public.sponsors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "settings_admin_write" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cada admin pot comprovar que ho és (ho fa servir /admin per avisar-te
-- si has creat l'usuari però encara no l'has donat d'alta com a admin).
create policy "admins_read_self" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- ---------- Realtime --------------------------------------------------
-- Cal per rebre els canvis de marcador sense recarregar la pàgina.
-- Realtime respecta les RLS de dalt: només s'emet el que és públic.

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.courts;
alter publication supabase_realtime add table public.sponsors;
alter publication supabase_realtime add table public.settings;

-- ---------- Dades inicials --------------------------------------------

insert into public.courts (name, sort_order) values
  ('Pista 1', 1),
  ('Pista 2', 2),
  ('Pista 3', 3);

-- =====================================================================
-- DESPRÉS d'haver creat el teu usuari admin (Dashboard > Authentication >
-- Users > Add user), executa això canviant l'email pel teu:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'EL_TEU_EMAIL@exemple.com';
--
-- I desactiva els registres públics a:
--   Dashboard > Authentication > Sign In / Providers > Email
--   -> "Allow new users to sign up" = OFF
-- =====================================================================
