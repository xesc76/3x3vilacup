'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/constants';
import type { Category, Team } from '@/lib/types';
import { FilterChips } from '@/components/FilterChips';
import { ErrorNote, SectionCard } from './Feedback';

const EMPTY = {
  name: '',
  category: CATEGORIES[0].value as Category,
  logo_url: '',
};

export function TeamsAdmin({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visible = filter ? teams.filter((t) => t.category === filter) : teams;

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY, category: filter ?? EMPTY.category });
    setError(null);
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setForm({
      name: team.name,
      category: team.category,
      logo_url: team.logo_url ?? '',
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      logo_url: form.logo_url.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from('teams').update(payload).eq('id', editingId)
      : await supabase.from('teams').insert(payload);

    setBusy(false);
    if (error) {
      return setError(
        error.code === '23505'
          ? 'Ja existeix un equip amb aquest nom en aquesta categoria.'
          : error.message
      );
    }

    // Després de crear volem seguir afegint equips de la mateixa categoria.
    setEditingId(null);
    setForm({ ...EMPTY, category: payload.category });
    router.refresh();
  }

  async function handleDelete(team: Team) {
    if (
      !confirm(
        `Esborrar «${team.name}»? També s’esborraran tots els seus partits.`
      )
    )
      return;

    const { error } = await supabase.from('teams').delete().eq('id', team.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title={editingId ? 'Editar equip' : 'Nou equip'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="team-name">
                Nom de l’equip
              </label>
              <input
                id="team-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="team-category">
                Categoria
              </label>
              <select
                id="team-category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
                }
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.years})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="team-logo">
              URL de l’escut (opcional)
            </label>
            <input
              id="team-logo"
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://…"
              className="input"
            />
          </div>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Desant…' : editingId ? 'Desar canvis' : 'Afegir equip'}
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
          { value: null, label: `Tots (${teams.length})` },
          ...CATEGORIES.map((c) => ({
            value: c.value,
            label: `${c.label} (${teams.filter((t) => t.category === c.value).length})`,
          })),
        ]}
      />

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="card p-6 text-center text-sm text-slate-500">
            Cap equip en aquesta selecció.
          </p>
        )}
        {visible.map((team) => (
          <div
            key={team.id}
            className="card flex flex-wrap items-center gap-3 p-3.5"
          >
            {team.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.logo_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <span className="h-9 w-9 shrink-0 rounded-full bg-slate-100 ring-1 ring-slate-200" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">{team.name}</p>
              <p className="text-xs text-slate-500">
                {CATEGORY_LABEL[team.category]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => startEdit(team)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(team)}
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
