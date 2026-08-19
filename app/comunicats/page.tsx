import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import type { Announcement } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { ArrowIcon } from '@/components/Icons';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Comunicats',
};

export default async function ComunicatsPage() {
  const supabase = createClient();

  // La política RLS ja amaga els esborranys, però ho filtrem també aquí
  // per no dependre només d'això.
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  const announcements = (data ?? []) as Announcement[];

  return (
    <PageShell
      title="Comunicats"
      subtitle="Avisos de l’organització, del més recent al més antic."
    >
      {announcements.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Encara no hi ha cap comunicat.
        </p>
      ) : (
        <ul className="border-t border-violet-100">
          {announcements.map((item) => (
            <li key={item.id}>
              <Link
                href={`/comunicats/${item.id}`}
                className="group flex items-start justify-between gap-3 border-b border-violet-100 py-4 transition hover:bg-violet-50"
              >
                <span className="min-w-0">
                  <span className="block font-display text-xl uppercase leading-tight tracking-wide text-violet-950">
                    {item.title}
                  </span>
                  {item.published_at && (
                    <span className="mt-1 block text-xs text-violet-400">
                      {formatDateTime(item.published_at)}
                    </span>
                  )}
                </span>
                <ArrowIcon className="mt-1 h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-1 group-hover:text-violet-900" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
