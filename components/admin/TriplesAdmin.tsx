'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TRIPLES_DIVISIONS } from '@/lib/constants';
import { groupTriples } from '@/lib/triples';
import type { TriplesDivision, TriplesResult } from '@/lib/types';
import { ErrorNote, SectionCard } from './Feedback';

const EMPTY = {
  division: 'noi' as TriplesDivision,
  participant: '',
  club: '',
  score: '',
  small_basket: false,
};

export function TriplesAdmin({ results }: { results: TriplesResult[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditingId(null);
    setForm({
      ...EMPTY,
      division: form.division,
      small_basket: form.small_basket,
    });
    setError(null);
  }

  function startEdit(item: TriplesResult) {
    setEditingId(item.id);
    setForm({
      division: item.division,
      participant: item.participant,
      club: item.club ?? '',
      score: String(item.score),
      small_basket: item.small_basket,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      division: form.division,
      participant: form.participant.trim(),
      club: form.club.trim() || null,
      score: Number(form.score) || 0,
      small_basket: form.small_basket,
    };

    const { error } = editingId
      ? await supabase
          .from('triples_results')
          .update(payload)
          .eq('id', editingId)
      : await supabase.from('triples_results').insert(payload);

    setBusy(false);
    if (error) return setError(error.message);

    // Es va introduint participant rere participant de la mateixa categoria
    // i del mateix tipus de cistella.
    setEditingId(null);
    setForm({
      ...EMPTY,
      division: payload.division,
      small_basket: payload.small_basket,
    });
    router.refresh();
  }

  async function handleDelete(item: TriplesResult) {
    if (!confirm(`Treure «${item.participant}» del rànquing?`)) return;

    const { error } = await supabase
      .from('triples_results')
      .delete()
      .eq('id', item.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={editingId ? 'Editar participant' : 'Afegir participant'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tr-division">
                Categoria
              </label>
              <select
                id="tr-division"
                value={form.division}
                onChange={(e) =>
                  setForm({
                    ...form,
                    division: e.target.value as TriplesDivision,
                  })
                }
                className="input"
              >
                {TRIPLES_DIVISIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="tr-score">
                Punts
              </label>
              <input
                id="tr-score"
                type="number"
                min={0}
                required
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tr-participant">
                Nom del participant
              </label>
              <input
                id="tr-participant"
                required
                value={form.participant}
                onChange={(e) =>
                  setForm({ ...form, participant: e.target.value })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tr-club">
                Club o equip (opcional)
              </label>
              <input
                id="tr-club"
                value={form.club}
                onChange={(e) => setForm({ ...form, club: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-violet-800">
            <input
              type="checkbox"
              checked={form.small_basket}
              onChange={(e) =>
                setForm({ ...form, small_basket: e.target.checked })
              }
              className="h-4 w-4 rounded border-violet-300 text-violet-600"
            />
            Cistella petita
          </label>
          <p className="-mt-1 text-xs text-violet-500">
            Marca-ho si tira a la cistella baixa: tindrà un rànquing a part
            del dels que tiren a cistella normal.
          </p>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Desant…' : editingId ? 'Desar canvis' : 'Afegir'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel·lar
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      {groupTriples(results).length === 0 && (
        <p className="panel p-5 text-center text-sm text-violet-500">
          Cap participant encara.
        </p>
      )}

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

            {
              <div className="space-y-2">
                {rows.map((item, index) => (
                  <div
                    key={item.id}
                    className="panel flex flex-wrap items-center gap-3 p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center bg-violet-50 font-display text-sm tabular-nums text-violet-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-violet-950">
                        {item.participant}
                      </p>
                      {item.club && (
                        <p className="truncate text-xs text-violet-500">
                          {item.club}
                        </p>
                      )}
                    </div>
                    <span className="font-display text-xl tabular-nums text-violet-950">
                      {item.score}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="btn-danger px-3 py-1.5 text-xs"
                    >
                      Treure
                    </button>
                  </div>
                ))}
              </div>
            }
          </section>
        );
      })}
    </div>
  );
}
