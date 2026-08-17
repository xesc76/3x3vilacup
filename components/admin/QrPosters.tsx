'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { TOURNAMENT } from '@/lib/constants';
import type { Court } from '@/lib/types';

type Poster = { key: string; title: string; url: string; dataUrl: string };

export function QrPosters({ courts }: { courts: Court[] }) {
  // Per defecte, l'adreça des d'on estàs mirant la pàgina. Si estàs en local
  // has de canviar-la per la de Vercel abans d'imprimir, o els QR portaran
  // a localhost i no funcionaran des dels mòbils del pavelló.
  const [baseUrl, setBaseUrl] = useState('');
  const [posters, setPosters] = useState<Poster[]>([]);

  useEffect(() => {
    setBaseUrl(
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
        window.location.origin
    );
  }, []);

  useEffect(() => {
    if (!baseUrl) return;
    let cancelled = false;

    const targets = [
      { key: 'home', title: TOURNAMENT.name, path: '/' },
      ...courts.map((c) => ({
        key: c.id,
        title: c.name,
        path: `/pista/${c.id}`,
      })),
    ];

    Promise.all(
      targets.map(async (target) => {
        const url = `${baseUrl.replace(/\/$/, '')}${target.path}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 800,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        return { key: target.key, title: target.title, url, dataUrl };
      })
    ).then((result) => {
      if (!cancelled) setPosters(result);
    });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, courts]);

  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);

  return (
    <div>
      <div className="print:hidden">
        <label className="label" htmlFor="base-url">
          Adreça pública del web
        </label>
        <input
          id="base-url"
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="input"
        />
        {isLocal && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Estàs generant QR que apunten al teu ordinador. Abans d’imprimir,
            enganxa aquí l’adreça de Vercel (per exemple{' '}
            <code>https://vilacup.vercel.app</code>).
          </p>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          disabled={posters.length === 0 || isLocal}
          className="btn-primary mt-3"
        >
          Imprimir cartells
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 print:block">
        {posters.map((poster) => (
          <article
            key={poster.key}
            className="card break-inside-avoid p-6 text-center print:mb-8 print:break-after-page print:border-0 print:shadow-none"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              {TOURNAMENT.name} · {TOURNAMENT.edition}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              {poster.title}
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster.dataUrl}
              alt={`Codi QR de ${poster.title}`}
              className="mx-auto my-4 w-full max-w-[260px]"
            />
            <p className="text-base font-bold text-slate-900">
              Escaneja per veure horaris,
              <br />
              resultats en directe i fotos
            </p>
            <p className="mt-2 break-all text-[10px] text-slate-400">
              {poster.url}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
