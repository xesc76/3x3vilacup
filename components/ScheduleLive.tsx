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

      <div className="flex items-center justify-between border-t border-violet-100 pt-3">
        <p className="font-display text-xs uppercase tracking-widest text-violet-400">
          {visible.length} {visible.length === 1 ? 'partit' : 'partits'}
        </p>
        <LiveIndicator live={live} />
      </div>

      {playing.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2.5 text-violet-950">
            <span className="h-3 w-1 bg-acid-400" />
            Jugant-se ara
          </h2>
          <div className="space-y-2">
            {playing.map((m) => (
              <MatchCard key={`live-${m.id}`} match={m} showCourt={!courtId} />
            ))}
          </div>
        </section>
      )}

      <section>
        {playing.length > 0 && (
          <h2 className="eyebrow mb-2.5">
            <span className="h-3 w-1 bg-violet-200" />
            Tots els partits
          </h2>
        )}
        {visible.length === 0 ? (
          <p className="panel px-4 py-10 text-center text-sm text-violet-400">
            Encara no hi ha partits per a aquesta selecció.
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((m) => (
              <MatchCard key={m.id} match={m} showCourt={!courtId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
