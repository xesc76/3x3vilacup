import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { CATEGORY_ORDER, TOURNAMENT } from '@/lib/constants';
import { PLAYOFF_MATCH_SELECT } from '@/lib/types';
import type {
  Category,
  CategoryPlayoff,
  Court,
  PlayoffMatchWithNames,
  PlayoffRound,
} from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { ScheduleLive } from '@/components/ScheduleLive';
import { PlayoffSchedule } from '@/components/PlayoffSchedule';
import { ArrowIcon } from '@/components/Icons';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Horaris i resultats',
};

export default async function Horaris({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const supabase = createClient();

  const [matches, courtsRes, roundsRes, playoffRes, statesRes] =
    await Promise.all([
      fetchMatches(supabase).catch(() => []),
      supabase.from('courts').select('*').order('sort_order'),
      supabase.from('playoff_rounds').select('*').order('sort_order'),
      supabase
        .from('playoff_matches')
        .select(PLAYOFF_MATCH_SELECT)
        .order('slot'),
      supabase.from('category_playoff').select('*'),
    ]);

  const requested = searchParams.categoria as Category | undefined;
  const initialCategory =
    requested && CATEGORY_ORDER.includes(requested) ? requested : null;

  const states = (statesRes.data ?? []) as CategoryPlayoff[];
  const activeCategories = states.filter((s) => s.active).map((s) => s.category);

  return (
    <PageShell title="Horaris i resultats" subtitle={TOURNAMENT.dateLabel}>
      {/* Amb el play-off actiu, els creuaments són el que interessa ara
          mateix: van a dalt de tot i amb els equips ja resolts. */}
      {activeCategories.length > 0 && (
        <div className="mb-8">
          <PlayoffSchedule
            rounds={(roundsRes.data ?? []) as PlayoffRound[]}
            matches={
              (playoffRes.data ?? []) as unknown as PlayoffMatchWithNames[]
            }
            activeCategories={activeCategories}
          />
          <Link
            href="/quadre"
            className="mt-3 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-violet-700 hover:text-violet-950"
          >
            Veure el quadre sencer
            <ArrowIcon />
          </Link>
        </div>
      )}

      <ScheduleLive
        initialMatches={matches}
        courts={(courtsRes.data ?? []) as Court[]}
        initialCategory={initialCategory}
      />
    </PageShell>
  );
}
