'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_LABEL, STATUS_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import type { MatchStatus, MatchWithNames } from '@/lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const STATUS_BUTTONS: { value: MatchStatus; className: string }[] = [
  { value: 'programado', className: 'bg-violet-800' },
  { value: 'en_juego', className: 'bg-red-600' },
  { value: 'finalizado', className: 'bg-emerald-600' },
];

export function ScoreControl({ match }: { match: MatchWithNames }) {
  const supabase = useMemo(() => createClient(), []);

  const [home, setHome] = useState(match.home_score);
  const [away, setAway] = useState(match.away_score);
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [save, setSave] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Sempre enviem el valor absolut més recent, mai increments: així dos
  // taps seguits no poden acabar en un marcador incoherent.
  const desired = useRef({ home, away, status });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSave('saving');

    const payload = { ...desired.current };
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        home_score: payload.home,
        away_score: payload.away,
        status: payload.status,
      })
      .eq('id', match.id);

    inFlight.current = false;

    if (updateError) {
      setSave('error');
      setError(updateError.message);
      return;
    }

    setError(null);
    // Si mentre desàvem hi ha hagut més canvis, torna-hi.
    const latest = desired.current;
    if (
      latest.home !== payload.home ||
      latest.away !== payload.away ||
      latest.status !== payload.status
    ) {
      void flush();
    } else {
      setSave('saved');
    }
  }, [supabase, match.id]);

  const queue = useCallback(
    (next: Partial<{ home: number; away: number; status: MatchStatus }>) => {
      desired.current = { ...desired.current, ...next };
      if (next.home !== undefined) setHome(next.home);
      if (next.away !== undefined) setAway(next.away);
      if (next.status !== undefined) setStatus(next.status);

      setSave('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 400);
    },
    [flush]
  );

  // Si un altre organitzador toca el mateix partit des d'un altre mòbil,
  // reflecteix-ho aquí (només quan no tenim res pendent de desar).
  useEffect(() => {
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${match.id}`,
        },
        ({ new: row }) => {
          if (timer.current || inFlight.current) return;
          const remote = row as {
            home_score: number;
            away_score: number;
            status: MatchStatus;
          };
          desired.current = {
            home: remote.home_score,
            away: remote.away_score,
            status: remote.status,
          };
          setHome(remote.home_score);
          setAway(remote.away_score);
          setStatus(remote.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, match.id]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  // Partim de desired.current, no de l'estat pintat: si l'usuari prem dos
  // cops de pressa el segon tap ha de sumar sobre el primer.
  const bump = (side: 'home' | 'away', delta: number) => {
    const current =
      side === 'home' ? desired.current.home : desired.current.away;
    const value = Math.max(0, current + delta);
    queue(side === 'home' ? { home: value } : { away: value });
  };

  const teamPanel = (side: 'home' | 'away', name: string, score: number) => (
    <div className="panel p-4">
      <p className="truncate text-center text-base font-bold text-violet-950">
        {name}
      </p>
      <p className="my-2 text-center font-display text-7xl leading-none tabular-nums text-violet-950">
        {score}
      </p>
      {/* En 3x3 les cistelles són d'1 i de 2 punts: no hi ha triple. */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((points) => (
          <button
            key={points}
            type="button"
            onClick={() => bump(side, points)}
            className="btn-primary py-4 text-lg"
          >
            +{points}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={score === 0}
        onClick={() => bump(side, -1)}
        className="btn-secondary mt-2 w-full py-2.5"
      >
        −1
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <p className="text-sm font-semibold text-violet-950">
          {formatTime(match.starts_at)} · {CATEGORY_LABEL[match.category]}
        </p>
        <p className="text-xs text-violet-500">
          {[match.court?.name, match.round].filter(Boolean).join(' · ') ||
            'Sense pista assignada'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {teamPanel('home', match.home_team?.name ?? 'Local', home)}
        {teamPanel('away', match.away_team?.name ?? 'Visitant', away)}
      </div>

      <div className="panel p-4">
        <p className="label">Estat del partit</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_BUTTONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => queue({ status: option.value })}
              className={`btn py-3 ${
                status === option.value
                  ? `${option.className} text-white`
                  : 'bg-white text-violet-600 ring-1 ring-violet-300'
              }`}
            >
              {STATUS_LABEL[option.value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-6 items-center justify-center text-sm">
        {save === 'saving' && <span className="text-violet-500">Desant…</span>}
        {save === 'saved' && (
          <span className="font-semibold text-emerald-600">
            ✓ Desat i publicat
          </span>
        )}
        {save === 'error' && (
          <span className="text-center font-semibold text-red-600">
            No s’ha pogut desar: {error}
          </span>
        )}
      </div>
    </div>
  );
}
