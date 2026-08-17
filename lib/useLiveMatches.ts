'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from './supabase/client';
import { fetchMatches, type MatchFilters } from './queries';
import type { MatchWithNames } from './types';

/**
 * Parteix dels partits que ha carregat el servidor i els manté al dia amb
 * Supabase Realtime. Quan arriba qualsevol canvi a `matches` tornem a
 * consultar: així els noms d'equip i pista sempre venen resolts, cosa que el
 * payload de realtime (que només porta la fila crua) no ens dona.
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
      // Agrupa ràfegues de canvis (p. ex. desar marcador i estat alhora).
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(refresh, 150);
    };

    const channel = supabase
      .channel('matches-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        scheduleRefresh
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
