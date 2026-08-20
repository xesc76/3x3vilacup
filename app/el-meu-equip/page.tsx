import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { PLAYOFF_MATCH_SELECT } from '@/lib/types';
import type {
  CategoryPlayoff,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { MyTeamLive } from '@/components/MyTeamLive';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'El meu equip',
};

export default async function MyTeamPage() {
  const supabase = createClient();

  const [matches, teamsRes, roundsRes, playoffRes, statesRes] =
    await Promise.all([
      fetchMatches(supabase).catch(() => []),
      supabase.from('teams').select('*').order('category').order('name'),
      supabase.from('playoff_rounds').select('*').order('sort_order'),
      supabase
        .from('playoff_matches')
        .select(PLAYOFF_MATCH_SELECT)
        .order('slot'),
      supabase.from('category_playoff').select('*'),
    ]);

  return (
    <PageShell
      title="El meu equip"
      subtitle="Tots els partits, resultats i la classificació del teu equip en una sola pantalla."
    >
      <MyTeamLive
        initialMatches={matches}
        teams={(teamsRes.data ?? []) as Team[]}
        playoffRounds={(roundsRes.data ?? []) as PlayoffRound[]}
        playoffMatches={
          (playoffRes.data ?? []) as unknown as PlayoffMatchWithNames[]
        }
        playoffStates={(statesRes.data ?? []) as CategoryPlayoff[]}
      />
    </PageShell>
  );
}
