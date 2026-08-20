'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import logo from '@/public/logo.jpg';
import { TOURNAMENT } from '@/lib/constants';
import type { Court } from '@/lib/types';
import { PrintIcon } from '@/components/Icons';

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
          <p className="mt-2 rounded-sm bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Estàs generant QR que apunten al teu ordinador. Abans d’imprimir,
            enganxa aquí l’adreça de Vercel (per exemple{' '}
            <code>https://3x3vilacup.vercel.app</code>).
          </p>
        )}

        <button
          type="button"
          onClick={() => window.print()}
          disabled={posters.length === 0 || isLocal}
          className="btn-primary mt-3"
        >
          <PrintIcon />
          Imprimir cartells
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 print:block">
        {posters.map((poster) => (
          <article
            key={poster.key}
            className="panel break-inside-avoid overflow-hidden text-center print:mb-8 print:break-after-page print:border-0"
          >
            <div className="bg-violet-950 px-6 py-5">
              <Image
                src={logo}
                alt=""
                width={64}
                height={64}
                className="mx-auto rounded-sm"
              />
              <p className="mt-3 font-display text-sm lowercase tracking-tight text-acid-400">
                {TOURNAMENT.name}
                <span className="ml-2 uppercase tracking-[0.3em] text-violet-300">
                  {TOURNAMENT.edition}
                </span>
              </p>
              <h2 className="mt-1 text-4xl text-white">{poster.title}</h2>
            </div>
            <div className="brand-rule" />

            <div className="px-6 py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster.dataUrl}
                alt={`Codi QR de ${poster.title}`}
                className="mx-auto w-full max-w-[260px]"
              />
              <p className="mt-4 font-display text-xl uppercase leading-tight tracking-wide text-violet-950">
                Escaneja per veure horaris,
                <br />
                resultats en directe i fotos
              </p>
              <p className="mt-3 break-all text-[10px] text-violet-300">
                {poster.url}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
