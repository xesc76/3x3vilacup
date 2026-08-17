'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABEL, TOURNAMENT } from '@/lib/constants';
import { formatTime, fromDatetimeLocal, toDatetimeLocal } from '@/lib/format';
import type {
  Category,
  Court,
  MatchWithNames,
  Team,
} from '@/lib/types';
import { FilterChips } from '@/components/FilterChips';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorNote, SectionCard } from './Feedback';

const emptyForm = () => ({
  category: CATEGORIES[0].value as Category,
  court_id: '',
  starts_at: `${TOURNAMENT.date}T09:00`,
  home_team_id: '',
  away_team_id: '',
  round: '',
});

export function MatchesAdmin({
  matches,
  teams,
  courts,
}: {
  matches: MatchWithNames[];
  teams: Team[];
  courts: Court[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const teamsInCategory = teams.filter((t) => t.category === form.category);
  const visible = filter ? matches.filter((m) => m.category === filter) : matches;

  function reset() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function startEdit(match: MatchWithNames) {
    setEditingId(match.id);
    setForm({
      category: match.category,
      court_id: match.court_id ?? '',
      starts_at: toDatetimeLocal(match.starts_at),
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      round: match.round ?? '',
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (form.home_team_id === form.away_team_id) {
      return setError('Un equip no pot jugar contra si mateix.');
    }

    setBusy(true);
    setError(null);

    const payload = {
      category: form.category,
      court_id: form.court_id || null,
      starts_at: fromDatetimeLocal(form.starts_at),
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      round: form.round.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from('matches').update(payload).eq('id', editingId)
      : await supabase.from('matches').insert(payload);

    setBusy(false);
    if (error) return setError(error.message);

    // En crear partits en cadena, conserva categoria, pista i hora.
    setEditingId(null);
    setForm({ ...form, home_team_id: '', away_team_id: '' });
    router.refresh();
  }

  async function handleDelete(match: MatchWithNames) {
    if (
      !confirm(
        `Esborrar el partit ${match.home_team?.name} vs ${match.away_team?.name}?`
      )
    )
      return;

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', match.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title={editingId ? 'Editar partit' : 'Nou partit'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="match-category">
                Categoria
              </label>
              <select
                id="match-category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as Category,
                    home_team_id: '',
                    away_team_id: '',
                  })
                }
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="match-court">
                Pista
              </label>
              <select
                id="match-court"
                value={form.court_id}
                onChange={(e) => setForm({ ...form, court_id: e.target.value })}
                className="input"
              >
                <option value="">— Sense assignar —</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {teamsInCategory.length < 2 ? (
            <p className="rounded-sm bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Necessites com a mínim dos equips a{' '}
              {CATEGORY_LABEL[form.category]}.{' '}
              <Link href="/admin/equips" className="font-semibold underline">
                Afegir equips
              </Link>
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="match-home">
                  Equip local
                </label>
                <select
                  id="match-home"
                  required
                  value={form.home_team_id}
                  onChange={(e) =>
                    setForm({ ...form, home_team_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">— Tria equip —</option>
                  {teamsInCategory.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="match-away">
                  Equip visitant
                </label>
                <select
                  id="match-away"
                  required
                  value={form.away_team_id}
                  onChange={(e) =>
                    setForm({ ...form, away_team_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">— Tria equip —</option>
                  {teamsInCategory.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="match-time">
                Data i hora
              </label>
              <input
                id="match-time"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="match-round">
                Fase / grup (opcional)
              </label>
              <input
                id="match-round"
                value={form.round}
                onChange={(e) => setForm({ ...form, round: e.target.value })}
                placeholder="Grup A, Semifinal, Final…"
                className="input"
              />
            </div>
          </div>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || teamsInCategory.length < 2}
              className="btn-primary"
            >
              {busy ? 'Desant…' : editingId ? 'Desar canvis' : 'Crear partit'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel·lar
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      <FilterChips
        label="Filtrar per categoria"
        value={filter}
        onChange={setFilter}
        options={[
          { value: null, label: `Tots (${matches.length})` },
          ...CATEGORIES.map((c) => ({
            value: c.value,
            label: `${c.label} (${matches.filter((m) => m.category === c.value).length})`,
          })),
        ]}
      />

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="panel p-6 text-center text-sm text-violet-500">
            Cap partit en aquesta selecció.
          </p>
        )}
        {visible.map((match) => (
          <div
            key={match.id}
            className="panel flex flex-wrap items-center gap-3 p-3.5"
          >
            <span className="w-12 shrink-0 font-display text-base tabular-nums text-violet-800">
              {formatTime(match.starts_at)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-violet-950">
                {match.home_team?.name} vs {match.away_team?.name}
              </p>
              <p className="truncate text-xs text-violet-500">
                {[
                  CATEGORY_LABEL[match.category],
                  match.court?.name ?? 'sense pista',
                  match.round,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <StatusBadge status={match.status} />
            <Link
              href={`/admin/partit/${match.id}`}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Marcador
            </Link>
            <button
              type="button"
              onClick={() => startEdit(match)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(match)}
              className="btn-danger px-3 py-1.5 text-xs"
            >
              Esborrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
