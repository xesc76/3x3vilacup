import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import type { Announcement } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';

export const revalidate = 0;

async function getAnnouncement(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  return data as Announcement | null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const announcement = await getAnnouncement(params.id);
  return { title: announcement?.title ?? 'Comunicat' };
}

export default async function ComunicatPage({
  params,
}: {
  params: { id: string };
}) {
  const announcement = await getAnnouncement(params.id);
  if (!announcement) notFound();

  return (
    <PageShell
      title={announcement.title}
      subtitle={
        announcement.published_at
          ? formatDateTime(announcement.published_at)
          : undefined
      }
    >
      <article className="panel px-4 py-5">
        <p className="whitespace-pre-line leading-relaxed text-violet-800">
          {announcement.body}
        </p>
      </article>

      <Link
        href="/comunicats"
        className="mt-5 inline-block font-display text-sm uppercase tracking-wide text-violet-700 hover:text-violet-950"
      >
        ← Tots els comunicats
      </Link>
    </PageShell>
  );
}
