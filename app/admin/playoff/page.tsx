import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { PLAYOFF_MATCH_SELECT } from '@/lib/types';
import type {
  CategoryPlayoff,
  Court,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { PlayoffAdmin } from '@/components/admin/PlayoffAdmin';

export const revalidate = 0;

export default async function AdminPlayoff() {
  const supabase = createClient();

  const [roundsRes, playoffRes, groupMatches, teamsRes, courtsRes, statesRes] =
    await Promise.all([
      supabase.from('playoff_rounds').select('*').order('sort_order'),
      supabase.from('playoff_matches').select(PLAYOFF_MATCH_SELECT).order('slot'),
      fetchMatches(supabase).catch(() => []),
      supabase.from('teams').select('*').order('category').order('name'),
      supabase.from('courts').select('*').order('sort_order'),
      supabase.from('category_playoff').select('*'),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Play-off
      </h1>
      <p className="mt-1 text-sm text-violet-500">
        Munta el quadre d’eliminatòries de cada categoria. Els equips es poden
        deixar definits per posició de grup: s’ompliran sols quan activis el
        play-off.
      </p>
      <div className="mt-5">
        <PlayoffAdmin
          rounds={(roundsRes.data ?? []) as PlayoffRound[]}
          playoffMatches={
            (playoffRes.data ?? []) as unknown as PlayoffMatchWithNames[]
          }
          groupMatches={groupMatches}
          teams={(teamsRes.data ?? []) as Team[]}
          courts={(courtsRes.data ?? []) as Court[]}
          states={(statesRes.data ?? []) as CategoryPlayoff[]}
        />
      </div>
    </div>
  );
}
