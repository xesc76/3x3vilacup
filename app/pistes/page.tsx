import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Court } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';
import { ArrowIcon } from '@/components/Icons';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pistes',
};

export default async function Pistes() {
  const supabase = createClient();
  const { data } = await supabase.from('courts').select('*').order('sort_order');
  const courts = (data ?? []) as Court[];

  return (
    <PageShell
      title="Pistes"
      subtitle="Tria una pista per veure’n els partits en directe i les fotos."
    >
      {courts.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Encara no hi ha pistes donades d’alta.
        </p>
      ) : (
        <ul className="border-t border-violet-100">
          {courts.map((court) => (
            <li key={court.id}>
              <Link
                href={`/pista/${court.id}`}
                className="group flex items-center justify-between gap-3 border-b border-violet-100 py-4 transition hover:bg-violet-50"
              >
                <span className="font-display text-2xl uppercase tracking-wide text-violet-950">
                  {court.name}
                </span>
                <ArrowIcon className="h-5 w-5 text-violet-300 transition group-hover:translate-x-1 group-hover:text-violet-900" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
