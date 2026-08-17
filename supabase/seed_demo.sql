-- =====================================================================
-- Dades d'exemple OPCIONALS, per provar el web abans de tenir el calendari
-- real. Executa-ho al SQL Editor de Supabase.
-- Per esborrar-ho tot després: mira el bloc del final.
-- =====================================================================

insert into public.teams (name, category) values
  ('Vilafranca A',  'cadet'),
  ('Vilafranca B',  'cadet'),
  ('Sant Sadurní',  'cadet'),
  ('Vilanova',      'cadet'),
  ('Penedès A',     'senior'),
  ('Penedès B',     'senior'),
  ('Els Monjos',    'senior'),
  ('Mini Vila A',   'minibasquet'),
  ('Mini Vila B',   'minibasquet')
on conflict (name, category) do nothing;

-- Calendari d'exemple del 23 d'agost de 2026 (hores en UTC: +02:00 a l'estiu,
-- així que 07:00 UTC = 09:00 a Vilafranca).
insert into public.matches
  (category, court_id, starts_at, home_team_id, away_team_id, status, home_score, away_score, round)
select
  m.category::public.category,
  (select id from public.courts where name = m.court),
  m.starts_at::timestamptz,
  (select id from public.teams where name = m.home and category = m.category::public.category),
  (select id from public.teams where name = m.away and category = m.category::public.category),
  m.status::public.match_status,
  m.home_score,
  m.away_score,
  m.round
from (values
  ('cadet',       'Pista 1', '2026-08-23 07:00:00+00', 'Vilafranca A', 'Vilafranca B', 'finalizado', 21, 17, 'Grup A'),
  ('cadet',       'Pista 1', '2026-08-23 07:30:00+00', 'Sant Sadurní', 'Vilanova',     'finalizado', 14, 21, 'Grup A'),
  ('cadet',       'Pista 1', '2026-08-23 08:00:00+00', 'Vilafranca A', 'Vilanova',     'en_juego',   12,  9, 'Grup A'),
  ('cadet',       'Pista 1', '2026-08-23 08:30:00+00', 'Vilafranca B', 'Sant Sadurní', 'programado',  0,  0, 'Grup A'),
  ('senior',      'Pista 2', '2026-08-23 07:00:00+00', 'Penedès A',    'Penedès B',    'finalizado', 21, 19, 'Grup únic'),
  ('senior',      'Pista 2', '2026-08-23 07:45:00+00', 'Els Monjos',   'Penedès A',    'programado',  0,  0, 'Grup únic'),
  ('minibasquet', 'Pista 3', '2026-08-23 07:15:00+00', 'Mini Vila A',  'Mini Vila B',  'programado',  0,  0, 'Amistós')
) as m(category, court, starts_at, home, away, status, home_score, away_score, round);

-- Sponsors d'exemple.
insert into public.sponsors (name, logo_url, website_url, sort_order) values
  ('Ajuntament de Vilafranca', 'https://placehold.co/200x80/png?text=Ajuntament', 'https://www.vilafranca.cat', 1),
  ('Patrocinador 2',           'https://placehold.co/200x80/png?text=Sponsor+2', null, 2);

-- ---------------------------------------------------------------------
-- Per netejar les dades d'exemple quan tinguis les de veritat:
--
--   delete from public.matches;
--   delete from public.teams;
--   delete from public.sponsors;
-- ---------------------------------------------------------------------
