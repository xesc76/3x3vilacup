import { createClient } from '@/lib/supabase/server';
import type { Team } from '@/lib/types';
import { TeamsAdmin } from '@/components/admin/TeamsAdmin';

export const revalidate = 0;

export default async function AdminTeams() {
  const supabase = createClient();
  const { data } = await supabase
    .from('teams')
    .select('*')
    .order('category')
    .order('name');

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Equips
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Dona d’alta els equips abans de crear els partits.
      </p>
      <div className="mt-5">
        <TeamsAdmin teams={(data ?? []) as Team[]} />
      </div>
    </div>
  );
}
