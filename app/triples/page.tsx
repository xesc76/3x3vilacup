import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { groupTriples } from '@/lib/triples';
import type { TriplesResult } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Concurs de triples',
};

export default async function TriplesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('triples_results')
    .select('*')
    .order('score', { ascending: false });

  const results = (data ?? []) as TriplesResult[];

  return (
    <PageShell
      title="Concurs de triples"
      subtitle="Classificació de nois i noies."
    >
      {results.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          El concurs encara no ha començat.
        </p>
      ) : (
        <div className="space-y-6">
          {groupTriples(results).map((group) => {
            const rows = group.rows;

            return (
              <section key={group.key}>
                <h2 className="eyebrow mb-2.5">
                  <span
                    className={`h-3 w-1 ${
                      group.smallBasket ? 'bg-acid-400' : 'bg-violet-200'
                    }`}
                  />
                  {group.label}
                </h2>

                <div className="panel overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-violet-900 font-display text-[11px] uppercase tracking-widest text-violet-200">
                        <th className="w-9 py-2 pl-3 text-left font-normal">
                          #
                        </th>
                        <th className="py-2 text-left font-normal">
                          Participant
                        </th>
                        <th className="w-14 py-2 pr-3 text-center font-normal">
                          Punts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                      {rows.map((row, index) => (
                        <tr key={row.id}>
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
                            <span className="block font-semibold text-violet-950">
                              {row.participant}
                            </span>
                            {row.club && (
                              <span className="block text-xs text-violet-400">
                                {row.club}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-center font-display text-lg leading-none tabular-nums text-violet-950">
                            {row.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
