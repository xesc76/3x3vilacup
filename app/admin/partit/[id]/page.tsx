import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MATCH_SELECT, type MatchWithNames } from '@/lib/types';
import { ScoreControl } from '@/components/admin/ScoreControl';

export const revalidate = 0;

export default async function AdminMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        ← Tots els partits
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        Marcador en directe
      </h1>
      <div className="mt-5">
        <ScoreControl match={data as unknown as MatchWithNames} />
      </div>
    </div>
  );
}
