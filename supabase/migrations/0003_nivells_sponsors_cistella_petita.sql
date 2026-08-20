-- =====================================================================
-- 3x3vilacup — Migració 0003
-- Nivells de col·laboradors i "cistella petita" al concurs de triples.
--
-- Executa'l a: Supabase Dashboard > SQL Editor > New query
-- És segur executar-lo dues vegades.
-- =====================================================================

-- ---------- 1. Tres nivells de col·laborador --------------------------
-- Les aportacions no són iguals, així que els logotips no poden sortir
-- tots igual de grans. L'ordre del tipus marca la jerarquia.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'sponsor_tier') then
    create type public.sponsor_tier as enum
      ('principal', 'collaborador', 'patrocinador');
  end if;
end
$$;

-- Els que ja hi hagi queden al nivell base; des de l'admin es promocionen.
alter table public.sponsors
  add column if not exists tier public.sponsor_tier not null default 'patrocinador';

create index if not exists sponsors_tier_idx
  on public.sponsors (tier, sort_order);

-- ---------- 2. Cistella petita al concurs de triples ------------------
-- Els més petits tiren a cistella baixa, així que el seu rànquing va a
-- part del dels que tiren a cistella normal.

alter table public.triples_results
  add column if not exists small_basket boolean not null default false;

create index if not exists triples_basket_idx
  on public.triples_results (small_basket, division, score desc);
