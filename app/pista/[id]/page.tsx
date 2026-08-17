import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchMatches } from '@/lib/queries';
import { TOURNAMENT } from '@/lib/constants';
import type { Court, Settings } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { ScheduleLive } from '@/components/ScheduleLive';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('courts')
    .select('name')
    .eq('id', params.id)
    .maybeSingle();

  return { title: data?.name ?? 'Pista' };
}

export default async function PistaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: courtData } = await supabase
    .from('courts')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!courtData) notFound();
  const court = courtData as Court;

  const [matches, settingsRes] = await Promise.all([
    fetchMatches(supabase, { courtId: court.id }).catch(() => []),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const settings = settingsRes.data as Settings | null;
  const photosUrl = court.google_photos_url || settings?.default_photos_url;

  return (
    <PageShell title={court.name} subtitle={TOURNAMENT.dateLabel}>
      {photosUrl && (
        <a
          href={photosUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mb-5 w-full py-3 text-base"
        >
          📷 Fotos d’aquesta pista
        </a>
      )}

      <ScheduleLive
        initialMatches={matches}
        courts={[court]}
        courtId={court.id}
        showCourtFilter={false}
      />
    </PageShell>
  );
}
