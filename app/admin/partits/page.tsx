import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import type { Court, Team } from '@/lib/types';
import { MatchesAdmin } from '@/components/admin/MatchesAdmin';

export const revalidate = 0;

export default async function AdminMatches() {
  const supabase = createClient();

  const [matches, teamsRes, courtsRes] = await Promise.all([
    fetchMatches(supabase).catch(() => []),
    supabase.from('teams').select('*').order('category').order('name'),
    supabase.from('courts').select('*').order('sort_order'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Partits
      </h1>
      <p className="mt-1 text-sm text-violet-500">
        Crea el calendari. Per posar marcadors, ves a «Marcadors».
      </p>
      <div className="mt-5">
        <MatchesAdmin
          matches={matches}
          teams={(teamsRes.data ?? []) as Team[]}
          courts={(courtsRes.data ?? []) as Court[]}
        />
      </div>
    </div>
  );
}
