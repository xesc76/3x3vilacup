import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { PageShell } from '@/components/SiteChrome';
import { StandingsLive } from '@/components/StandingsLive';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Classificació',
};

export default async function Classificacio() {
  const supabase = createClient();
  const matches = await fetchMatches(supabase).catch(() => []);

  return (
    <PageShell
      title="Classificació"
      subtitle="Es calcula automàticament amb els partits finalitzats."
    >
      <StandingsLive initialMatches={matches} />
    </PageShell>
  );
}
