-- =====================================================================
-- Vila Cup 3x3 — DADES DE PROVA
--
-- Omple el torneig sencer per poder-ho veure tot funcionant: 30 equips
-- repartits en grups, 36 partits (acabats, en joc i per jugar), quadre de
-- play-off, comunicats, concurs de triples i patrocinadors.
--
-- ⚠️  ESBORRA tots els equips, partits, comunicats, triples, patrocinadors
--     i quadres que hi hagi ara. Les pistes, els administradors i la
--     configuració no es toquen (la configuració s'actualitza).
--
--     Executa'l a: Supabase Dashboard > SQL Editor > New query
--     Quan vulguis començar de zero per al torneig de veritat, fes servir
--     el bloc de NETEJA del final d'aquest fitxer.
-- =====================================================================

begin;

-- ---------- 0. Neteja ------------------------------------------------
-- El play-off ha d'estar desactivat abans de tocar partits: si no, el
-- disparador que congela la fase de grups ho bloqueja.
update public.category_playoff set active = false, activated_at = null;

delete from public.playoff_rounds;   -- s'emporta els creuaments en cascada
delete from public.matches;
delete from public.teams;            -- també esborraria partits en cascada
delete from public.announcements;
delete from public.triples_results;
delete from public.sponsors;

-- Assegura que hi ha les tres pistes (si ja hi són, no fa res).
insert into public.courts (name, sort_order)
select v.name, v.sort_order
from (values ('Pista 1', 1), ('Pista 2', 2), ('Pista 3', 3)) as v(name, sort_order)
where not exists (select 1 from public.courts c where c.name = v.name);

-- ---------- 1. Equips -------------------------------------------------

insert into public.teams (name, category, group_name)
values
  -- Minibàsquet (2014-2017)
  ('Vilafranca',           'minibasquet', 'A'),
  ('Vilanova',             'minibasquet', 'A'),
  ('Sant Sadurní',         'minibasquet', 'A'),
  ('Gelida',               'minibasquet', 'B'),
  ('Olèrdola',             'minibasquet', 'B'),
  ('La Granada',           'minibasquet', 'B'),

  -- Infantil (2012-2013)
  ('Vilafranca',           'infantil', 'A'),
  ('Sitges',               'infantil', 'A'),
  ('El Vendrell',          'infantil', 'A'),
  ('Vilanova',             'infantil', 'B'),
  ('Cubelles',             'infantil', 'B'),
  ('Calafell',             'infantil', 'B'),

  -- Cadet (2010-2011)
  ('Vilafranca A',         'cadet', 'A'),
  ('Vilanova',             'cadet', 'A'),
  ('Sant Sadurní',         'cadet', 'A'),
  ('Els Monjos',           'cadet', 'A'),
  ('Vilafranca B',         'cadet', 'B'),
  ('Gelida',               'cadet', 'B'),
  ('Olèrdola',             'cadet', 'B'),
  ('Sitges',               'cadet', 'B'),

  -- Júnior (2008-2009) — grup únic
  ('Vilafranca',           'junior', null),
  ('Vilanova',             'junior', null),
  ('Sant Martí Sarroca',   'junior', null),
  ('El Vendrell',          'junior', null),

  -- Sènior (X-2007)
  ('Penedès A',            'senior', 'A'),
  ('Els Monjos',           'senior', 'A'),
  ('Cubelles',             'senior', 'A'),
  ('Penedès B',            'senior', 'B'),
  ('Sitges',               'senior', 'B'),
  ('Calafell',             'senior', 'B');

-- ---------- 2. Partits de la fase de grups ---------------------------
-- Barreja d'estats a propòsit: acabats (per veure classificacions),
-- en joc (per veure el directe i l'animació) i programats.

with data(cat, court, hora, local, visitant, pl, pv, estat, grup) as (
  values
    -- 09:00
    ('cadet',       'Pista 1', '09:00', 'Vilafranca A', 'Vilanova',      21, 14, 'finalizado', 'Grup A'),
    ('senior',      'Pista 2', '09:00', 'Penedès A',    'Els Monjos',    21, 19, 'finalizado', 'Grup A'),
    ('minibasquet', 'Pista 3', '09:00', 'Vilafranca',   'Vilanova',      12, 10, 'finalizado', 'Grup A'),
    -- 09:30
    ('cadet',       'Pista 1', '09:30', 'Sant Sadurní', 'Els Monjos',    18, 21, 'finalizado', 'Grup A'),
    ('senior',      'Pista 2', '09:30', 'Penedès B',    'Sitges',        15, 21, 'finalizado', 'Grup B'),
    ('minibasquet', 'Pista 3', '09:30', 'Gelida',       'Olèrdola',       8, 14, 'finalizado', 'Grup B'),
    -- 10:00
    ('cadet',       'Pista 1', '10:00', 'Vilafranca A', 'Sant Sadurní',  21, 12, 'finalizado', 'Grup A'),
    ('senior',      'Pista 2', '10:00', 'Els Monjos',   'Cubelles',      17, 21, 'finalizado', 'Grup A'),
    ('minibasquet', 'Pista 3', '10:00', 'Vilafranca',   'Sant Sadurní',  16,  9, 'finalizado', 'Grup A'),
    -- 10:30
    ('cadet',       'Pista 1', '10:30', 'Vilanova',     'Els Monjos',    19, 21, 'finalizado', 'Grup A'),
    ('senior',      'Pista 2', '10:30', 'Sitges',       'Calafell',      21, 13, 'finalizado', 'Grup B'),
    ('minibasquet', 'Pista 3', '10:30', 'Olèrdola',     'La Granada',    11, 13, 'finalizado', 'Grup B'),
    -- 11:00 — partits en joc ara mateix
    ('cadet',       'Pista 1', '11:00', 'Vilafranca A', 'Els Monjos',    14, 11, 'en_juego',   'Grup A'),
    ('senior',      'Pista 2', '11:00', 'Penedès A',    'Cubelles',       9, 12, 'en_juego',   'Grup A'),
    ('minibasquet', 'Pista 3', '11:00', 'Vilanova',     'Sant Sadurní',   6,  8, 'en_juego',   'Grup A'),
    -- 11:30
    ('cadet',       'Pista 1', '11:30', 'Sant Sadurní', 'Vilanova',       0,  0, 'programado', 'Grup A'),
    ('senior',      'Pista 2', '11:30', 'Penedès B',    'Calafell',       0,  0, 'programado', 'Grup B'),
    ('minibasquet', 'Pista 3', '11:30', 'Gelida',       'La Granada',     0,  0, 'programado', 'Grup B'),
    -- 12:00
    ('cadet',       'Pista 1', '12:00', 'Vilafranca B', 'Gelida',         0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '12:00', 'Vilafranca',   'Sitges',         0,  0, 'programado', 'Grup A'),
    ('junior',      'Pista 3', '12:00', 'Vilafranca',   'Vilanova',       0,  0, 'programado', 'Grup únic'),
    -- 12:30
    ('cadet',       'Pista 1', '12:30', 'Olèrdola',     'Sitges',         0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '12:30', 'Vilafranca',   'El Vendrell',    0,  0, 'programado', 'Grup A'),
    ('junior',      'Pista 3', '12:30', 'Sant Martí Sarroca', 'El Vendrell', 0, 0, 'programado', 'Grup únic'),
    -- 13:00
    ('cadet',       'Pista 1', '13:00', 'Vilafranca B', 'Olèrdola',       0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '13:00', 'Sitges',       'El Vendrell',    0,  0, 'programado', 'Grup A'),
    ('junior',      'Pista 3', '13:00', 'Vilafranca',   'Sant Martí Sarroca', 0, 0, 'programado', 'Grup únic'),
    -- 13:30
    ('cadet',       'Pista 1', '13:30', 'Gelida',       'Sitges',         0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '13:30', 'Vilanova',     'Cubelles',       0,  0, 'programado', 'Grup B'),
    ('junior',      'Pista 3', '13:30', 'Vilanova',     'El Vendrell',    0,  0, 'programado', 'Grup únic'),
    -- 14:00
    ('cadet',       'Pista 1', '14:00', 'Vilafranca B', 'Sitges',         0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '14:00', 'Vilanova',     'Calafell',       0,  0, 'programado', 'Grup B'),
    ('junior',      'Pista 3', '14:00', 'Vilafranca',   'El Vendrell',    0,  0, 'programado', 'Grup únic'),
    -- 14:30
    ('cadet',       'Pista 1', '14:30', 'Olèrdola',     'Gelida',         0,  0, 'programado', 'Grup B'),
    ('infantil',    'Pista 2', '14:30', 'Cubelles',     'Calafell',       0,  0, 'programado', 'Grup B'),
    ('junior',      'Pista 3', '14:30', 'Vilanova',     'Sant Martí Sarroca', 0, 0, 'programado', 'Grup únic')
)
insert into public.matches
  (category, court_id, starts_at, home_team_id, away_team_id,
   home_score, away_score, status, round)
select
  d.cat::public.category,
  c.id,
  ('2026-08-23 ' || d.hora || ':00')::timestamp at time zone 'Europe/Madrid',
  th.id,
  ta.id,
  d.pl,
  d.pv,
  d.estat::public.match_status,
  d.grup
from data d
join public.courts c  on c.name = d.court
join public.teams  th on th.name = d.local     and th.category = d.cat::public.category
join public.teams  ta on ta.name = d.visitant  and ta.category = d.cat::public.category;

-- ---------- 3. Quadre de play-off de Cadet ---------------------------
-- Semifinals creuades (1r d'un grup contra 2n de l'altre) i final.
-- Es deixa SENSE activar: així es veu com ho veu el públic durant la fase
-- de grups, amb els buits "1r Grup A" fins que s'activi.

insert into public.playoff_rounds (category, name, sort_order)
values ('cadet', 'Semifinals', 0), ('cadet', 'Final', 1);

-- Semifinals
insert into public.playoff_matches
  (round_id, slot, court_id, starts_at,
   home_source, home_group, home_rank,
   away_source, away_group, away_rank)
select
  r.id,
  v.slot,
  (select id from public.courts where name = 'Pista 1'),
  ('2026-08-23 ' || v.hora || ':00')::timestamp at time zone 'Europe/Madrid',
  'group_position', v.hg, v.hr,
  'group_position', v.ag, v.ar
from public.playoff_rounds r
join (values
  (0, '15:00', 'A', 1, 'B', 2),
  (1, '15:30', 'B', 1, 'A', 2)
) as v(slot, hora, hg, hr, ag, ar) on true
where r.category = 'cadet' and r.name = 'Semifinals';

-- Final: la juguen els guanyadors de les dues semifinals
insert into public.playoff_matches
  (round_id, slot, court_id, starts_at,
   home_source, home_from_match,
   away_source, away_from_match)
select
  (select id from public.playoff_rounds
    where category = 'cadet' and name = 'Final'),
  0,
  (select id from public.courts where name = 'Pista 1'),
  ('2026-08-23 16:30:00')::timestamp at time zone 'Europe/Madrid',
  'winner',
  (select pm.id from public.playoff_matches pm
     join public.playoff_rounds pr on pr.id = pm.round_id
    where pr.category = 'cadet' and pr.name = 'Semifinals' and pm.slot = 0),
  'winner',
  (select pm.id from public.playoff_matches pm
     join public.playoff_rounds pr on pr.id = pm.round_id
    where pr.category = 'cadet' and pr.name = 'Semifinals' and pm.slot = 1);

-- ---------- 4. Comunicats --------------------------------------------

insert into public.announcements (title, body, published, published_at)
values
  (
    'Benvinguts a la 4a Vila Cup 3x3!',
    E'Bon dia a tothom!\n\nAvui comencem la quarta edició de la Vila Cup 3x3 al Pavelló Poliesportiu Nou (La Gamba).\n\nRecordeu:\n· Presenteu-vos a la taula 15 minuts abans del vostre partit.\n· Cada equip ha de portar dues equipacions de colors diferents.\n· L''aigua i el servei de bar són a l''entrada principal.\n\nBon torneig i molta sort a tots!',
    true,
    '2026-08-23 08:30:00+02'
  ),
  (
    'Canvi d''horari a la Pista 2',
    E'Els partits de la Pista 2 comencen amb 10 minuts de retard per un problema amb una cistella.\n\nJa està resolt. Els equips afectats han estat avisats directament pels àrbitres.\n\nDisculpeu les molèsties.',
    true,
    '2026-08-23 10:15:00+02'
  ),
  (
    'Concurs de triples: inscripcions obertes',
    E'El concurs de triples comença a les 16:00 a la Pista 3.\n\nHi ha dues categories, nois i noies, i cadascú té un minut per encistellar tants triples com pugui.\n\nApunteu-vos a la taula d''organització abans de les 15:30. Hi ha premi per als tres primers de cada categoria!',
    true,
    '2026-08-23 11:00:00+02'
  ),
  (
    'Lliurament de premis',
    E'Esborrany: cal confirmar l''hora exacta amb l''ajuntament abans de publicar-ho.',
    false,
    null
  );

-- ---------- 5. Concurs de triples ------------------------------------

insert into public.triples_results (division, participant, club, score)
values
  ('noi',  'Marc Solé',        'Vilafranca',    14),
  ('noi',  'Pau Ferrer',       'Vilanova',      12),
  ('noi',  'Jan Torres',       'Sant Sadurní',  11),
  ('noi',  'Arnau Ribas',      'Gelida',         9),
  ('noi',  'Biel Mestre',      'Olèrdola',       7),
  ('noi',  'Nil Casas',        'Els Monjos',     6),
  ('noia', 'Júlia Roca',       'Vilafranca',    13),
  ('noia', 'Ona Vidal',        'Sitges',        12),
  ('noia', 'Laia Puig',        'Vilanova',      10),
  ('noia', 'Emma Soler',       'Calafell',       8),
  ('noia', 'Carla Bosch',      'Cubelles',       7),
  ('noia', 'Aina Serra',       'El Vendrell',    5);

-- ---------- 6. Patrocinadors -----------------------------------------
-- Logotips de mostra. Substitueix-los pels de veritat des de l'admin.

insert into public.sponsors (name, logo_url, website_url, sort_order, active)
values
  ('Ajuntament de Vilafranca', 'https://placehold.co/240x100/2E0757/FFFFFF/png?text=Ajuntament', 'https://www.vilafranca.cat', 1, true),
  ('Consell Comarcal',         'https://placehold.co/240x100/8B2BE8/FFFFFF/png?text=Consell',    null,                        2, true),
  ('Caixa del Penedès',        'https://placehold.co/240x100/E6EF0C/2E0757/png?text=Caixa',      null,                        3, true),
  ('Esports Vila',             'https://placehold.co/240x100/4B0F85/FFFFFF/png?text=Esports',    null,                        4, true),
  ('Bar La Cistella',          'https://placehold.co/240x100/CBD400/2E0757/png?text=La+Cistella', null,                       5, true);

-- ---------- 7. Configuració ------------------------------------------

update public.settings
set
  live_message = 'Els partits de Minibàsquet comencen a la Pista 3. Consulteu els horaris!',
  -- PDF de mostra només perquè el botó funcioni. Canvia'l per la teva
  -- normativa de veritat des de l'admin (Configuració).
  rules_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  default_photos_url = 'https://photos.google.com'
where id = 1;

commit;

-- =====================================================================
-- COMPROVACIÓ ràpida (executa-ho a part si vols veure el resum)
-- =====================================================================
-- select 'equips' as que, count(*) from public.teams
-- union all select 'partits', count(*) from public.matches
-- union all select 'acabats', count(*) from public.matches where status = 'finalizado'
-- union all select 'en joc', count(*) from public.matches where status = 'en_juego'
-- union all select 'creuaments', count(*) from public.playoff_matches
-- union all select 'comunicats publicats', count(*) from public.announcements where published
-- union all select 'triples', count(*) from public.triples_results
-- union all select 'patrocinadors', count(*) from public.sponsors;

-- =====================================================================
-- NETEJA — per deixar-ho buit abans del torneig de veritat
-- =====================================================================
-- update public.category_playoff set active = false, activated_at = null;
-- delete from public.playoff_rounds;
-- delete from public.matches;
-- delete from public.teams;
-- delete from public.announcements;
-- delete from public.triples_results;
-- delete from public.sponsors;
-- update public.settings set live_message = null where id = 1;
