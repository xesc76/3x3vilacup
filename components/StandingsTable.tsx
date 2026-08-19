import type { StandingRow } from '@/lib/standings';

/**
 * Taula d'un grup. `highlightTeamId` serveix per a "El meu equip":
 * ressalta la fila de l'equip que s'està mirant.
 */
export function StandingsTable({
  rows,
  highlightTeamId,
}: {
  rows: StandingRow[];
  highlightTeamId?: string;
}) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-violet-900 font-display text-[11px] uppercase tracking-widest text-violet-200">
            <th className="w-9 py-2 pl-3 text-left font-normal">#</th>
            <th className="py-2 text-left font-normal">Equip</th>
            <th className="w-8 py-2 text-center font-normal" title="Partits jugats">
              PJ
            </th>
            <th className="w-8 py-2 text-center font-normal" title="Victòries">
              V
            </th>
            <th className="w-8 py-2 text-center font-normal" title="Derrotes">
              D
            </th>
            <th
              className="w-11 py-2 text-center font-normal"
              title="Punts a favor"
            >
              PF
            </th>
            <th
              className="w-11 py-2 pr-3 text-center font-normal"
              title="Diferència de punts"
            >
              +/-
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-violet-50">
          {rows.map((row, index) => {
            const mine = row.teamId === highlightTeamId;
            return (
              <tr key={row.teamId} className={mine ? 'bg-acid-50' : undefined}>
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
                <td className="py-2.5 text-center tabular-nums text-violet-500">
                  {row.played}
                </td>
                <td className="py-2.5 text-center font-display text-lg leading-none tabular-nums text-violet-950">
                  {row.won}
                </td>
                <td className="py-2.5 text-center tabular-nums text-violet-500">
                  {row.lost}
                </td>
                <td className="py-2.5 text-center tabular-nums text-violet-600">
                  {row.pointsFor}
                </td>
                <td className="py-2.5 pr-3 text-center tabular-nums text-violet-500">
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StandingsCriteria() {
  return (
    <p className="text-xs leading-relaxed text-violet-400">
      Ordre: victòries, després punts a favor i, si segueix l’empat,
      l’enfrontament directe entre els equips implicats. Només compten els
      partits finalitzats.
    </p>
  );
}
