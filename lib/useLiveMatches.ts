'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from './supabase/client';
import { fetchMatches, type MatchFilters } from './queries';
import type { Match, MatchWithNames } from './types';

/**
 * Parteix dels partits que ha carregat el servidor i els manté al dia amb
 * Supabase Realtime.
 *
 * Els canvis de marcador/estat (els que passen cada pocs segons quan hi ha
 * partits en joc) s'apliquen directament amb les dades que ja porta el propi
 * missatge de Realtime, sense tornar a consultar la base de dades. Això
 * importa perquè aquest missatge arriba igual a tothom qui té la pàgina
 * oberta: si cada telèfon reaccionés fent una consulta nova, 8 pistes
 * actives i un centenar de mòbils a la vegada podrien convertir cada cistella
 * en un centenar de consultes simultànies. Només fem una consulta completa
 * quan cal (partit nou, o quan canvia l'equip/pista d'un partit i els noms
 * que tenim guardats han quedat desfasats).
 */
export function useLiveMatches(
  initial: MatchWithNames[],
  filters: MatchFilters = {}
) {
  const [matches, setMatches] = useState(initial);
  const [live, setLive] = useState(false);

  const { category = null, courtId = null } = filters;
  const supabase = useMemo(() => createClient(), []);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el servidor torna a renderitzar amb dades noves, adopta-les.
  useEffect(() => setMatches(initial), [initial]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const rows = await fetchMatches(supabase, { category, courtId });
        if (!cancelled) setMatches(rows);
      } catch (error) {
        console.error('No s’han pogut refrescar els partits', error);
      }
    };

    const scheduleRefresh = () => {
      // Agrupa ràfegues de canvis (p. ex. crear diversos partits seguits).
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(refresh, 150);
    };

    const applyUpdate = (row: Match) => {
      const matchesFilter =
        (!category || row.category === category) &&
        (!courtId || row.court_id === courtId);

      setMatches((prev) => {
        const index = prev.findIndex((m) => m.id === row.id);

        // No el teníem carregat i ara compleix el filtre (p. ex. un partit
        // ha canviat de pista i ha entrat en aquesta vista): calen els noms
        // d'equip, que el missatge de Realtime no porta.
        if (index === -1) {
          if (matchesFilter) scheduleRefresh();
          return prev;
        }

        // Ha deixat de complir el filtre (p. ex. reassignat a una altra
        // pista): treu-lo de la vista.
        if (!matchesFilter) {
          return prev.filter((m) => m.id !== row.id);
        }

        const existing = prev[index];

        // Si ha canviat l'equip o la pista, els noms ja resolts que tenim
        // poden haver quedat desfasats: cal anar a buscar-los.
        if (
          existing.home_team_id !== row.home_team_id ||
          existing.away_team_id !== row.away_team_id ||
          existing.court_id !== row.court_id
        ) {
          scheduleRefresh();
          return prev;
        }

        const next = [...prev];
        next[index] = {
          ...existing,
          home_score: row.home_score,
          away_score: row.away_score,
          status: row.status,
          starts_at: row.starts_at,
          round: row.round,
        };
        return next;
      });
    };

    const channel = supabase
      .channel('matches-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => applyUpdate(payload.new as Match)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'matches' },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) setMatches((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .subscribe((status) => {
        if (cancelled) return;
        setLive(status === 'SUBSCRIBED');
        // En reconnectar podem haver perdut canvis: recarrega.
        if (status === 'SUBSCRIBED') refresh();
      });

    return () => {
      cancelled = true;
      if (pending.current) clearTimeout(pending.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, category, courtId]);

  return { matches, live };
}
