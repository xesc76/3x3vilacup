import { createClient } from '@/lib/supabase/server';
import type { Settings } from '@/lib/types';
import { SettingsAdmin } from '@/components/admin/SettingsAdmin';

export const revalidate = 0;

export default async function AdminConfig() {
  const supabase = createClient();
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Configuració
      </h1>
      <div className="mt-5">
        <SettingsAdmin settings={(data ?? null) as Settings | null} />
      </div>
    </div>
  );
}
