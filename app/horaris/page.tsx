import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { CATEGORY_ORDER, TOURNAMENT } from '@/lib/constants';
import type { Category, Court } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { ScheduleLive } from '@/components/ScheduleLive';

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

  const [matches, courtsRes] = await Promise.all([
    fetchMatches(supabase).catch(() => []),
    supabase.from('courts').select('*').order('sort_order'),
  ]);

  const requested = searchParams.categoria as Category | undefined;
  const initialCategory =
    requested && CATEGORY_ORDER.includes(requested) ? requested : null;

  return (
    <PageShell title="Horaris i resultats" subtitle={TOURNAMENT.dateLabel}>
      <ScheduleLive
        initialMatches={matches}
        courts={(courtsRes.data ?? []) as Court[]}
        initialCategory={initialCategory}
      />
    </PageShell>
  );
}
