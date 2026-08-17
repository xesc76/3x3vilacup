import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Court } from '@/lib/types';
import { PageShell } from '@/components/SiteChrome';

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
        <p className="card p-6 text-center text-sm text-slate-500">
          Encara no hi ha pistes donades d’alta.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {courts.map((court) => (
            <Link
              key={court.id}
              href={`/pista/${court.id}`}
              className="card flex items-center justify-between p-4 transition hover:shadow-md"
            >
              <span className="text-lg font-bold text-slate-900">
                {court.name}
              </span>
              <span className="text-brand-600">→</span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
