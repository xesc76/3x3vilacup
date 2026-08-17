import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { CATEGORIES, TOURNAMENT } from '@/lib/constants';
import type { Court, Settings, Sponsor } from '@/lib/types';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { SponsorsGrid } from '@/components/SponsorsGrid';
import { MatchCard } from '@/components/MatchCard';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();

  const [matches, courtsRes, sponsorsRes, settingsRes] = await Promise.all([
    fetchMatches(supabase).catch(() => []),
    supabase.from('courts').select('*').order('sort_order'),
    supabase
      .from('sponsors')
      .select('*')
      .eq('active', true)
      .order('sort_order'),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const courts = (courtsRes.data ?? []) as Court[];
  const sponsors = (sponsorsRes.data ?? []) as Sponsor[];
  const settings = settingsRes.data as Settings | null;

  const playing = matches.filter((m) => m.status === 'en_juego');
  const next = matches.filter((m) => m.status === 'programado').slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-ink-800 text-white">
          <div className="mx-auto max-w-3xl px-4 pb-10 pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-400">
              {TOURNAMENT.edition}
            </p>
            <h1 className="mt-2 text-4xl font-black leading-none tracking-tight sm:text-5xl">
              {TOURNAMENT.name}
            </h1>
            <p className="mt-4 text-lg font-semibold text-slate-100">
              {TOURNAMENT.dateLabel}
            </p>
            <a
              href={TOURNAMENT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white"
            >
              {TOURNAMENT.venue} · {TOURNAMENT.city}
            </a>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Link href="/horaris" className="btn-primary w-full py-3 text-base">
                Horaris i resultats
              </Link>
              <Link
                href="/classificacio"
                className="btn w-full bg-white/10 py-3 text-base text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Classificació
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-6">
          {settings?.live_message && (
            <p className="mb-6 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900 ring-1 ring-brand-200">
              {settings.live_message}
            </p>
          )}

          {playing.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-600">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-red-600" />
                Jugant-se ara
              </h2>
              <div className="space-y-2.5">
                {playing.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}

          {playing.length === 0 && next.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-slate-500">
                Pròxims partits
              </h2>
              <div className="space-y-2.5">
                {next.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
              <Link
                href="/horaris"
                className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Veure tots els horaris →
              </Link>
            </section>
          )}

          {/* Categories */}
          <section className="mb-8">
            <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-slate-500">
              Categories
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.value}
                  href={`/horaris?categoria=${category.value}`}
                  className="card px-3.5 py-3 transition hover:shadow-md"
                >
                  <p className="font-bold text-slate-900">{category.label}</p>
                  <p className="text-xs text-slate-500">{category.years}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Pistes */}
          {courts.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-slate-500">
                Pistes
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`/pista/${court.id}`}
                    className="card px-3.5 py-3 font-bold text-slate-900 transition hover:shadow-md"
                  >
                    {court.name}
                    <span className="block text-xs font-normal text-slate-500">
                      Horaris i fotos
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <SponsorsGrid sponsors={sponsors} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
