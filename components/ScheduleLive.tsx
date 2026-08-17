'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type { Category, Court, MatchWithNames } from '@/lib/types';
import { FilterChips } from './FilterChips';
import { LiveIndicator } from './LiveIndicator';
import { MatchCard } from './MatchCard';

type Props = {
  initialMatches: MatchWithNames[];
  courts: Court[];
  /** Si ve informat, la vista queda fixada a aquesta pista i s'amaga el filtre. */
  courtId?: string;
  showCourtFilter?: boolean;
  /** Categoria preseleccionada (p. ex. en arribar des de la home). */
  initialCategory?: Category | null;
};

export function ScheduleLive({
  initialMatches,
  courts,
  courtId,
  showCourtFilter = true,
  initialCategory = null,
}: Props) {
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [court, setCourt] = useState<string | null>(null);

  // Amb el filtre de pista fixat demanem només aquesta pista al servidor;
  // la resta de filtres es resolen en memòria perquè siguin instantanis.
  const { matches, live } = useLiveMatches(initialMatches, {
    courtId: courtId ?? null,
  });

  const visible = useMemo(
    () =>
      matches.filter(
        (m) =>
          (!category || m.category === category) &&
          (!court || m.court_id === court)
      ),
    [matches, category, court]
  );

  const playing = visible.filter((m) => m.status === 'en_juego');

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <FilterChips
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[
            { value: null, label: 'Totes' },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
        />
        {showCourtFilter && courts.length > 1 && (
          <FilterChips
            label="Pista"
            value={court}
            onChange={setCourt}
            options={[
              { value: null, label: 'Totes' },
              ...courts.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <p className="text-sm text-slate-500">
          {visible.length} {visible.length === 1 ? 'partit' : 'partits'}
        </p>
        <LiveIndicator live={live} />
      </div>

      {playing.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-600">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-red-600" />
            Jugant-se ara
          </h2>
          <div className="space-y-2.5">
            {playing.map((m) => (
              <MatchCard key={`live-${m.id}`} match={m} showCourt={!courtId} />
            ))}
          </div>
        </section>
      )}

      <section>
        {playing.length > 0 && (
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Tots els partits
          </h2>
        )}
        {visible.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-500">
            Encara no hi ha partits per a aquesta selecció.
          </p>
        ) : (
          <div className="space-y-2.5">
            {visible.map((m) => (
              <MatchCard key={m.id} match={m} showCourt={!courtId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
