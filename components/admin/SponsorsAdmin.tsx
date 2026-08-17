'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Sponsor } from '@/lib/types';
import { ErrorNote, SectionCard } from './Feedback';

const EMPTY = {
  name: '',
  logo_url: '',
  website_url: '',
  active: true,
};

export function SponsorsAdmin({ sponsors }: { sponsors: Sponsor[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(sponsor: Sponsor) {
    setEditingId(sponsor.id);
    setForm({
      name: sponsor.name,
      logo_url: sponsor.logo_url,
      website_url: sponsor.website_url ?? '',
      active: sponsor.active,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const base = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      website_url: form.website_url.trim() || null,
      active: form.active,
    };

    const { error } = editingId
      ? await supabase.from('sponsors').update(base).eq('id', editingId)
      : await supabase.from('sponsors').insert({
          ...base,
          // Els nous van al final de la llista.
          sort_order:
            sponsors.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1,
        });

    setBusy(false);
    if (error) return setError(error.message);

    reset();
    router.refresh();
  }

  /** Intercanvia el sort_order amb el veí per moure’l amunt o avall. */
  async function move(index: number, direction: -1 | 1) {
    const current = sponsors[index];
    const neighbour = sponsors[index + direction];
    if (!neighbour) return;

    const [a, b] = await Promise.all([
      supabase
        .from('sponsors')
        .update({ sort_order: neighbour.sort_order })
        .eq('id', current.id),
      supabase
        .from('sponsors')
        .update({ sort_order: current.sort_order })
        .eq('id', neighbour.id),
    ]);

    const failure = a.error ?? b.error;
    if (failure) return setError(failure.message);
    router.refresh();
  }

  async function handleDelete(sponsor: Sponsor) {
    if (!confirm(`Esborrar «${sponsor.name}»?`)) return;
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', sponsor.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title={editingId ? 'Editar sponsor' : 'Nou sponsor'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="sponsor-name">
              Nom
            </label>
            <input
              id="sponsor-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="sponsor-logo">
              URL del logo
            </label>
            <input
              id="sponsor-logo"
              type="url"
              required
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://…/logo.png"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Millor un PNG amb fons transparent. Pots pujar-lo a Supabase
              Storage o a qualsevol allotjament públic.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="sponsor-web">
              Web (opcional)
            </label>
            <input
              id="sponsor-web"
              type="url"
              value={form.website_url}
              onChange={(e) =>
                setForm({ ...form, website_url: e.target.value })
              }
              placeholder="https://…"
              className="input"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Visible al web
          </label>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Desant…' : editingId ? 'Desar canvis' : 'Afegir sponsor'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel·lar
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      <div className="space-y-2">
        {sponsors.length === 0 && (
          <p className="card p-6 text-center text-sm text-slate-500">
            Encara no hi ha sponsors.
          </p>
        )}
        {sponsors.map((sponsor, index) => (
          <div
            key={sponsor.id}
            className="card flex flex-wrap items-center gap-3 p-3.5"
          >
            <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-slate-50 p-1 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">
                {sponsor.name}
              </p>
              <p className="text-xs text-slate-500">
                {sponsor.active ? 'Visible' : 'Amagat'} · ordre{' '}
                {sponsor.sort_order}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Pujar"
                className="btn-secondary px-2.5 py-1.5 text-xs"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === sponsors.length - 1}
                aria-label="Baixar"
                className="btn-secondary px-2.5 py-1.5 text-xs"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              onClick={() => startEdit(sponsor)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(sponsor)}
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
