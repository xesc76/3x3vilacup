import { createClient } from '@/lib/supabase/server';
import type { TriplesResult } from '@/lib/types';
import { TriplesAdmin } from '@/components/admin/TriplesAdmin';

export const revalidate = 0;

export default async function AdminTriples() {
  const supabase = createClient();
  const { data } = await supabase
    .from('triples_results')
    .select('*')
    .order('score', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Concurs de triples
      </h1>
      <p className="mt-1 text-sm text-violet-500">
        Classificació de nois i noies. El rànquing s’ordena sol pels punts.
      </p>
      <div className="mt-5">
        <TriplesAdmin results={(data ?? []) as TriplesResult[]} />
      </div>
    </div>
  );
}
