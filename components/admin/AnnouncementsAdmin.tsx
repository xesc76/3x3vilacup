'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/format';
import type { Announcement } from '@/lib/types';
import { ErrorNote, SectionCard } from './Feedback';

const EMPTY = { title: '', body: '' };

export function AnnouncementsAdmin({
  announcements,
}: {
  announcements: Announcement[];
}) {
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

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setForm({ title: item.title, body: item.body });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
    };

    const { error } = editingId
      ? await supabase.from('announcements').update(payload).eq('id', editingId)
      : await supabase.from('announcements').insert(payload);

    setBusy(false);
    if (error) return setError(error.message);

    reset();
    router.refresh();
  }

  /** Publicar o tornar a esborrany. La data de publicació la posa la BD. */
  async function togglePublished(item: Announcement) {
    if (
      item.published &&
      !confirm(
        `Amagar «${item.title}»? Deixarà de veure’s al web fins que el tornis a publicar.`
      )
    )
      return;

    const { error } = await supabase
      .from('announcements')
      .update({ published: !item.published })
      .eq('id', item.id);

    if (error) return setError(error.message);
    router.refresh();
  }

  async function handleDelete(item: Announcement) {
    if (!confirm(`Esborrar «${item.title}» definitivament?`)) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', item.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title={editingId ? 'Editar comunicat' : 'Nou comunicat'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="ann-title">
              Títol
            </label>
            <input
              id="ann-title"
              required
              maxLength={140}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Canvi d’horari a la pista 2"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="ann-body">
              Cos del comunicat
            </label>
            <textarea
              id="ann-body"
              required
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Escriu aquí el text complet…"
              className="input"
            />
            <p className="mt-1 text-xs text-violet-500">
              Els salts de línia es respecten tal com els escriguis.
            </p>
          </div>

          <ErrorNote error={error} />

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy
                ? 'Desant…'
                : editingId
                  ? 'Desar canvis'
                  : 'Crear com a esborrany'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel·lar
              </button>
            )}
          </div>

          {!editingId && (
            <p className="text-xs text-violet-500">
              El comunicat es crea com a esborrany. No es veurà al web fins
              que li donis a «Publicar».
            </p>
          )}
        </form>
      </SectionCard>

      <div className="space-y-2">
        {announcements.length === 0 && (
          <p className="panel p-6 text-center text-sm text-violet-500">
            Encara no hi ha cap comunicat.
          </p>
        )}

        {announcements.map((item) => (
          <article key={item.id} className="panel p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-violet-950">{item.title}</p>
                <p className="mt-0.5 text-xs text-violet-500">
                  {item.published && item.published_at
                    ? `Publicat el ${formatDateTime(item.published_at)}`
                    : 'Esborrany · no visible al web'}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-sm px-2 py-1 font-display text-[11px] uppercase leading-none tracking-widest ${
                  item.published
                    ? 'bg-acid-400 text-violet-950'
                    : 'bg-violet-50 text-violet-500'
                }`}
              >
                {item.published ? 'Publicat' : 'Esborrany'}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-violet-600">
              {item.body}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => togglePublished(item)}
                className={
                  item.published
                    ? 'btn-secondary px-3 py-1.5 text-xs'
                    : 'btn-acid px-3 py-1.5 text-xs'
                }
              >
                {item.published ? 'Tornar a esborrany' : 'Publicar'}
              </button>
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
                Esborrar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
