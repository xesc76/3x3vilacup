import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.jpg';
import { TOURNAMENT } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import type { Settings } from '@/lib/types';
import { SiteNav } from './SiteNav';

export function Wordmark({ size = 40 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-sm"
      />
      <span className="leading-none">
        {/* La marca va sempre tot junt i en minúscules. */}
        <span className="block font-display text-xl lowercase tracking-tight text-white">
          3x3<span className="text-acid-400">vilacup</span>
        </span>
        <span className="mt-0.5 block font-display text-[11px] uppercase tracking-[0.3em] text-violet-300">
          {TOURNAMENT.edition}
        </span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-violet-900">
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
        <div className="mt-3">
          <SiteNav />
        </div>
      </div>
      <div className="brand-rule" />
    </header>
  );
}

export async function SiteFooter() {
  // La normativa es configura des de l'admin; si no n'hi ha, no surt el botó.
  const supabase = createClient();
  const { data } = await supabase
    .from('settings')
    .select('rules_url')
    .eq('id', 1)
    .maybeSingle();
  const rulesUrl = (data as Pick<Settings, 'rules_url'> | null)?.rules_url;

  return (
    <footer className="mt-16 bg-violet-950 text-violet-300">
      <div className="brand-rule" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Wordmark size={48} />

        {rulesUrl && (
          <a
            href={rulesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-acid mt-6 w-full"
          >
            Normativa i bases de competició
          </a>
        )}

        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="sr-only">Data</dt>
            <dd>{TOURNAMENT.dateLabel}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Lloc</dt>
            <dd>
              <a
                href={TOURNAMENT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-violet-700 underline-offset-4 hover:text-white"
              >
                {TOURNAMENT.venue} · {TOURNAMENT.city}
              </a>
            </dd>
          </div>
        </dl>
        <Link
          href="/admin"
          className="mt-8 inline-block font-display text-xs uppercase tracking-widest text-violet-500 hover:text-acid-400"
        >
          Accés organització
        </Link>
      </div>
    </footer>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <header>
          <h1 className="text-3xl text-violet-950 sm:text-4xl">{title}</h1>
          <div className="mt-2 h-1 w-14 bg-acid-400" />
          {subtitle && (
            <p className="mt-3 text-sm text-violet-600">{subtitle}</p>
          )}
        </header>
        <div className="mt-7">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
