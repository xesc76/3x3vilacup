import { createClient } from '@/lib/supabase/server';
import type { Announcement } from '@/lib/types';
import { AnnouncementsAdmin } from '@/components/admin/AnnouncementsAdmin';

export const revalidate = 0;

export default async function AdminAnnouncements() {
  const supabase = createClient();

  // Els esborranys només els veu un admin: la política RLS ja ho filtra.
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-violet-950">
        Comunicats
      </h1>
      <p className="mt-1 text-sm text-violet-500">
        Avisos per als participants. Es creen com a esborrany i només es veuen
        al web quan els publiques.
      </p>
      <div className="mt-5">
        <AnnouncementsAdmin announcements={(data ?? []) as Announcement[]} />
      </div>
    </div>
  );
}
