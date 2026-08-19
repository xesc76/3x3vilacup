'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { computeStandings, groupStandings } from '@/lib/standings';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type { Category, MatchWithNames } from '@/lib/types';
import { FilterChips } from './FilterChips';
import { LiveIndicator } from './LiveIndicator';
import { StandingsCriteria, StandingsTable } from './StandingsTable';

export function StandingsLive({
  initialMatches,
}: {
  initialMatches: MatchWithNames[];
}) {
  const [category, setCategory] = useState<Category>(CATEGORIES[0].value);
  const { matches, live } = useLiveMatches(initialMatches);

  const groups = useMemo(() => {
    const rows = computeStandings(
      matches.filter((m) => m.category === category)
    );
    return groupStandings(rows);
  }, [matches, category]);

  const pending = matches.filter(
    (m) => m.category === category && m.status !== 'finalizado'
  ).length;

  return (
    <div className="space-y-4">
      <FilterChips
        label="Categoria"
        value={category}
        onChange={(value) => value && setCategory(value)}
        options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
      />

      <div className="flex items-center justify-between border-t border-violet-100 pt-3">
        <p className="font-display text-xs uppercase tracking-widest text-violet-400">
          {pending > 0
            ? `${pending} ${pending === 1 ? 'partit pendent' : 'partits pendents'}`
            : 'Tots els partits jugats'}
        </p>
        <LiveIndicator live={live} />
      </div>

      {groups.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Encara no hi ha cap partit finalitzat en aquesta categoria.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ group, rows }) => (
            <section key={group ?? '__unic__'}>
              {group && (
                <h2 className="eyebrow mb-2.5">
                  <span className="h-3 w-1 bg-violet-200" />
                  Grup {group}
                </h2>
              )}
              <StandingsTable rows={rows} />
            </section>
          ))}
        </div>
      )}

      <StandingsCriteria />
    </div>
  );
}
