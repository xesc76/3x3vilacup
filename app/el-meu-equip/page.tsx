import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import type { Team } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { MyTeamLive } from '@/components/MyTeamLive';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'El meu equip',
};

export default async function MyTeamPage() {
  const supabase = createClient();

  const [matches, teamsRes] = await Promise.all([
    fetchMatches(supabase).catch(() => []),
    supabase.from('teams').select('*').order('category').order('name'),
  ]);

  return (
    <PageShell
      title="El meu equip"
      subtitle="Tots els partits, resultats i la classificació del teu equip en una sola pantalla."
    >
      <MyTeamLive
        initialMatches={matches}
        teams={(teamsRes.data ?? []) as Team[]}
      />
    </PageShell>
  );
}
