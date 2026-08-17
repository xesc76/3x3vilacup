'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
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

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <p className="text-sm text-slate-500">
          {pending > 0
            ? `${pending} ${pending === 1 ? 'partit pendent' : 'partits pendents'}`
            : 'Tots els partits jugats'}
        </p>
        <LiveIndicator live={live} />
      </div>

      {rows.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-500">
          Encara no hi ha cap partit finalitzat en aquesta categoria.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-8 py-2.5 pl-3 text-left font-semibold">#</th>
                <th className="py-2.5 text-left font-semibold">Equip</th>
                <th className="w-8 py-2.5 text-center font-semibold" title="Partits jugats">PJ</th>
                <th className="w-8 py-2.5 text-center font-semibold" title="Victòries">V</th>
                <th className="w-8 py-2.5 text-center font-semibold" title="Derrotes">D</th>
                <th className="w-10 py-2.5 text-center font-semibold" title="Diferència de punts">+/-</th>
                <th className="w-10 py-2.5 pr-3 text-center font-semibold" title="Punts de classificació">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.teamId} className={index < 2 ? 'bg-brand-50/40' : ''}>
                  <td className="py-2.5 pl-3 font-mono text-xs font-semibold tabular-nums text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      {row.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.logoUrl}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      )}
                      <span className="truncate font-semibold text-slate-800">
                        {row.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center tabular-nums text-slate-600">{row.played}</td>
                  <td className="py-2.5 text-center tabular-nums text-slate-600">{row.won}</td>
                  <td className="py-2.5 text-center tabular-nums text-slate-600">{row.lost}</td>
                  <td className="py-2.5 text-center tabular-nums text-slate-600">
                    {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </td>
                  <td className="py-2.5 pr-3 text-center font-mono font-bold tabular-nums text-slate-900">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-1 text-xs text-slate-400">
        Victòria = 2 punts · Derrota = 1 punt. Desempat: punts, diferència de
        punts i punts a favor. Només compten els partits finalitzats.
      </p>
    </div>
  );
}
