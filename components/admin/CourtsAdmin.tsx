'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Court } from '@/lib/types';
import { ErrorNote, SectionCard } from './Feedback';

const EMPTY = { name: '', sort_order: '', google_photos_url: '' };

export function CourtsAdmin({ courts }: { courts: Court[] }) {
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

  function startEdit(court: Court) {
    setEditingId(court.id);
    setForm({
      name: court.name,
      sort_order: String(court.sort_order),
      google_photos_url: court.google_photos_url ?? '',
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
      sort_order: Number(form.sort_order) || 0,
      google_photos_url: form.google_photos_url.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from('courts').update(payload).eq('id', editingId)
      : await supabase.from('courts').insert(payload);

    setBusy(false);
    if (error) return setError(error.message);

    reset();
    router.refresh();
  }

  async function handleDelete(court: Court) {
    if (
      !confirm(
        `Segur que vols esborrar «${court.name}»? Els partits assignats es quedaran sense pista.`
      )
    )
      return;

    const { error } = await supabase.from('courts').delete().eq('id', court.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title={editingId ? 'Editar pista' : 'Nova pista'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="label" htmlFor="court-name">
                Nom
              </label>
              <input
                id="court-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pista 1"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="court-order">
                Ordre
              </label>
              <input
                id="court-order"
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
                placeholder="1"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="court-photos">
              Àlbum de Google Photos (opcional)
            </label>
            <input
              id="court-photos"
              type="url"
              value={form.google_photos_url}
              onChange={(e) =>
                setForm({ ...form, google_photos_url: e.target.value })
              }
              placeholder="https://photos.app.goo.gl/…"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Si el deixes buit, s’utilitzarà l’àlbum general que hagis posat a
              Configuració.
            </p>
          </div>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Desant…' : editingId ? 'Desar canvis' : 'Crear pista'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="btn-secondary"
              >
                Cancel·lar
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      <div className="space-y-2">
        {courts.length === 0 && (
          <p className="card p-6 text-center text-sm text-slate-500">
            Encara no hi ha cap pista.
          </p>
        )}
        {courts.map((court) => (
          <div
            key={court.id}
            className="card flex flex-wrap items-center gap-3 p-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">{court.name}</p>
              <p className="truncate text-xs text-slate-500">
                Ordre {court.sort_order}
                {court.google_photos_url
                  ? ' · àlbum propi'
                  : ' · àlbum general'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => startEdit(court)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(court)}
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
