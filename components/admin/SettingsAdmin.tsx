'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Settings } from '@/lib/types';
import { ErrorNote, SectionCard } from './Feedback';

export function SettingsAdmin({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [photosUrl, setPhotosUrl] = useState(
    settings?.default_photos_url ?? ''
  );
  const [message, setMessage] = useState(settings?.live_message ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase.from('settings').upsert({
      id: 1,
      default_photos_url: photosUrl.trim() || null,
      live_message: message.trim() || null,
    });

    setBusy(false);
    if (error) return setError(error.message);

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard title="Configuració general">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="photos">
              Àlbum de Google Photos del torneig
            </label>
            <input
              id="photos"
              type="url"
              value={photosUrl}
              onChange={(e) => setPhotosUrl(e.target.value)}
              placeholder="https://photos.app.goo.gl/…"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              És l’àlbum que veurà la gent des de qualsevol pista que no tingui
              àlbum propi. A Google Photos: obre l’àlbum → Compartir → Crear
              enllaç, i enganxa’l aquí.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="message">
              Avís destacat a la home (opcional)
            </label>
            <textarea
              id="message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Els partits de Cadet comencen 15 minuts més tard."
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Deixa-ho buit perquè no aparegui res.
            </p>
          </div>

          <ErrorNote error={error} />
          {saved && !error && (
            <p className="text-sm font-semibold text-emerald-600">✓ Desat</p>
          )}

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Desant…' : 'Desar configuració'}
          </button>
        </div>
      </SectionCard>
    </form>
  );
}
