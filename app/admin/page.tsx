import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import type { Court } from '@/lib/types';
import { MatchPicker } from '@/components/admin/MatchPicker';

export const revalidate = 0;

export default async function AdminScoreboards() {
  const supabase = createClient();

  const [matches, courtsRes] = await Promise.all([
    fetchMatches(supabase).catch(() => []),
    supabase.from('courts').select('*').order('sort_order'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Marcadors
      </h1>
      <p className="mt-1 text-sm text-violet-500">
        Tria un partit per canviar-ne el marcador i l’estat. Els canvis es veuen
        al web públic a l’instant.
      </p>
      <div className="mt-5">
        <MatchPicker
          initialMatches={matches}
          courts={(courtsRes.data ?? []) as Court[]}
        />
      </div>
    </div>
  );
}
