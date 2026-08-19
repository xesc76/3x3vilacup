import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PLAYOFF_MATCH_SELECT } from '@/lib/types';
import type {
  CategoryPlayoff,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { BracketView } from '@/components/BracketView';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Quadre de play-off',
};

export default async function QuadrePage() {
  const supabase = createClient();

  const [roundsRes, matchesRes, teamsRes, statesRes] = await Promise.all([
    supabase.from('playoff_rounds').select('*').order('sort_order'),
    supabase.from('playoff_matches').select(PLAYOFF_MATCH_SELECT).order('slot'),
    supabase.from('teams').select('id, name'),
    supabase.from('category_playoff').select('*'),
  ]);

  return (
    <PageShell
      title="Quadre de play-off"
      subtitle="Els creuaments d’eliminatòries, amb hora i pista."
    >
      <BracketView
        rounds={(roundsRes.data ?? []) as PlayoffRound[]}
        matches={(matchesRes.data ?? []) as unknown as PlayoffMatchWithNames[]}
        teams={(teamsRes.data ?? []) as Pick<Team, 'id' | 'name'>[]}
        states={(statesRes.data ?? []) as CategoryPlayoff[]}
      />
    </PageShell>
  );
}
