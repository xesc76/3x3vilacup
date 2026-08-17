import { createClient } from '@/lib/supabase/server';
import type { Sponsor } from '@/lib/types';
import { SponsorsAdmin } from '@/components/admin/SponsorsAdmin';

export const revalidate = 0;

export default async function AdminSponsors() {
  const supabase = createClient();
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Sponsors
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Es mostren a la home, en aquest mateix ordre.
      </p>
      <div className="mt-5">
        <SponsorsAdmin sponsors={(data ?? []) as Sponsor[]} />
      </div>
    </div>
  );
}
