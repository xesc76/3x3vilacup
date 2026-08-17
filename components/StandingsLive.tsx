'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES, POINTS_LOSS, POINTS_WIN } from '@/lib/constants';
import { computeStandings } from '@/lib/standings';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type { Category, MatchWithNames } from '@/lib/types';
import { FilterChips } from './FilterChips';
import { LiveIndicator } from './LiveIndicator';

export function StandingsLive({
  initialMatches,
}: {
  initialMatches: MatchWithNames[];
}) {
  const [category, setCategory] = useState<Category>(CATEGORIES[0].value);
  const { matches, live } = useLiveMatches(initialMatches);

  const rows = useMemo(
    () => computeStandings(matches.filter((m) => m.category === category)),
    [matches, category]
  );

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

      {rows.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Encara no hi ha cap partit finalitzat en aquesta categoria.
        </p>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-violet-900 font-display text-[11px] uppercase tracking-widest text-violet-200">
                <th className="w-9 py-2 pl-3 text-left font-normal">#</th>
                <th className="py-2 text-left font-normal">Equip</th>
                <th className="w-8 py-2 text-center font-normal" title="Partits jugats">PJ</th>
                <th className="w-8 py-2 text-center font-normal" title="Victòries">V</th>
                <th className="w-8 py-2 text-center font-normal" title="Derrotes">D</th>
                <th className="w-11 py-2 text-center font-normal" title="Diferència de punts">+/-</th>
                <th className="w-11 py-2 pr-3 text-center font-normal" title="Punts de classificació">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50">
              {rows.map((row, index) => (
                <tr key={row.teamId}>
                  <td className="py-2.5 pl-3">
                    <span
                      className={`inline-grid h-6 w-6 place-items-center font-display text-sm tabular-nums ${
                        index === 0
                          ? 'bg-acid-400 text-violet-950'
                          : 'text-violet-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      {row.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.logoUrl}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-violet-100"
                        />
                      )}
                      <span className="truncate font-semibold text-violet-950">
                        {row.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center tabular-nums text-violet-500">{row.played}</td>
                  <td className="py-2.5 text-center tabular-nums text-violet-500">{row.won}</td>
                  <td className="py-2.5 text-center tabular-nums text-violet-500">{row.lost}</td>
                  <td className="py-2.5 text-center tabular-nums text-violet-500">
                    {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </td>
                  <td className="py-2.5 pr-3 text-center font-display text-lg leading-none tabular-nums text-violet-950">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-violet-400">
        Victòria = {POINTS_WIN} punts · Derrota = {POINTS_LOSS} punt. Desempat:
        punts, diferència de punts i punts a favor. Només compten els partits
        finalitzats.
      </p>
    </div>
  );
}
