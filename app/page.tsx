import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.jpg';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { CATEGORIES, TOURNAMENT } from '@/lib/constants';
import type { Announcement, Court, Settings, Sponsor } from '@/lib/types';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { SponsorsGrid } from '@/components/SponsorsGrid';
import { MatchCard } from '@/components/MatchCard';
import { LatestAnnouncement } from '@/components/LatestAnnouncement';
import { ArrowIcon, PinIcon } from '@/components/Icons';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();

  const [matches, courtsRes, sponsorsRes, settingsRes, announcementRes] =
    await Promise.all([
      fetchMatches(supabase).catch(() => []),
      supabase.from('courts').select('*').order('sort_order'),
      supabase
        .from('sponsors')
        .select('*')
        .eq('active', true)
        .order('sort_order'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const courts = (courtsRes.data ?? []) as Court[];
  const sponsors = (sponsorsRes.data ?? []) as Sponsor[];
  const settings = settingsRes.data as Settings | null;
  const latestAnnouncement = announcementRes.data as Announcement | null;

  const playing = matches.filter((m) => m.status === 'en_juego');
  const next = matches.filter((m) => m.status === 'programado').slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Portada */}
        <section className="bg-violet-950 text-white">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
            <div className="flex items-center gap-4 sm:gap-7">
              <Image
                src={logo}
                alt={`Logotip del ${TOURNAMENT.name}`}
                priority
                sizes="(min-width: 640px) 160px, 104px"
                className="h-auto w-28 shrink-0 rounded-sm sm:w-40"
              />
              <div className="min-w-0">
                <p className="inline-block bg-acid-400 px-2 py-0.5 font-display text-xs uppercase tracking-[0.2em] text-violet-950">
                  {TOURNAMENT.edition}
                </p>
                {/* normal-case perquè els h1 van en majúscules per defecte
                    i la marca ha de sortir tal qual: 3x3vilacup. */}
                <h1 className="mt-2 text-4xl lowercase leading-none sm:text-6xl">
                  3x3<span className="text-acid-400">vilacup</span>
                </h1>
              </div>
            </div>

            <p className="mt-6 font-display text-xl uppercase leading-none tracking-wide text-white sm:text-2xl">
              {TOURNAMENT.dateLabel}
            </p>
            <a
              href={TOURNAMENT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-start gap-1.5 text-sm text-violet-300 hover:text-white"
            >
              <PinIcon className="mt-px h-4 w-4 shrink-0" />
              <span>
                {TOURNAMENT.venue} · {TOURNAMENT.city}
              </span>
            </a>
          </div>
          <div className="brand-rule" />
        </section>

        {/* Accessos ràpids */}
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-px bg-violet-100">
          {[
            {
              href: '/horaris',
              title: 'Horaris',
              caption: 'Tots els partits del dia',
            },
            {
              href: '/classificacio',
              title: 'Classificació',
              caption: 'Actualitzada en directe',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white px-4 py-5 transition hover:bg-acid-50"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-xl uppercase tracking-wide text-violet-950">
                  {item.title}
                </span>
                <ArrowIcon className="h-5 w-5 shrink-0 text-violet-400 transition group-hover:translate-x-1 group-hover:text-violet-900" />
              </span>
              <span className="mt-1 block text-xs leading-snug text-violet-400">
                {item.caption}
              </span>
            </Link>
          ))}
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10">
          {settings?.live_message && (
            <p className="mb-9 border-l-4 border-acid-400 bg-acid-50 px-4 py-3 text-sm font-medium text-violet-950">
              {settings.live_message}
            </p>
          )}

          <LatestAnnouncement announcement={latestAnnouncement} />

          {playing.length > 0 && (
            <section className="mb-10">
              <h2 className="eyebrow mb-3 text-violet-950">
                <span className="h-3 w-1 bg-acid-400" />
                Jugant-se ara
              </h2>
              <div className="space-y-2">
                {playing.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}

          {playing.length === 0 && next.length > 0 && (
            <section className="mb-10">
              <h2 className="eyebrow mb-3">
                <span className="h-3 w-1 bg-violet-200" />
                Pròxims partits
              </h2>
              <div className="space-y-2">
                {next.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
              <Link
                href="/horaris"
                className="mt-3 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-violet-700 hover:text-violet-950"
              >
                Veure tots els horaris
                <ArrowIcon />
              </Link>
            </section>
          )}

          {/* Categories */}
          <section className="mb-10">
            <h2 className="eyebrow mb-3">
              <span className="h-3 w-1 bg-violet-200" />
              Categories
            </h2>
            <ul className="border-t border-violet-100">
              {CATEGORIES.map((category) => (
                <li key={category.value}>
                  <Link
                    href={`/horaris?categoria=${category.value}`}
                    className="group flex items-baseline justify-between gap-3 border-b border-violet-100 py-3 transition hover:bg-violet-50"
                  >
                    <span className="font-display text-xl uppercase tracking-wide text-violet-950">
                      {category.label}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-sm text-violet-400">
                        {category.years}
                      </span>
                      <ArrowIcon className="h-4 w-4 text-violet-300 transition group-hover:translate-x-1 group-hover:text-violet-900" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Pistes */}
          {courts.length > 0 && (
            <section>
              <h2 className="eyebrow mb-3">
                <span className="h-3 w-1 bg-violet-200" />
                Pistes
              </h2>
              <div className="grid grid-cols-2 gap-px bg-violet-100 sm:grid-cols-3">
                {courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`/pista/${court.id}`}
                    className="bg-white px-4 py-4 transition hover:bg-acid-50"
                  >
                    <span className="block font-display text-xl uppercase tracking-wide text-violet-950">
                      {court.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-violet-400">
                      Horaris, resultats i fotos
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
