import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import type { Announcement } from '@/lib/types';
import { ArrowIcon } from './Icons';

/**
 * Titular de l'últim comunicat publicat, amb data i hora. Enllaça al detall.
 * No es dibuixa res si encara no n'hi ha cap.
 */
export function LatestAnnouncement({
  announcement,
}: {
  announcement: Announcement | null;
}) {
  if (!announcement) return null;

  return (
    <section className="mb-10">
      <h2 className="eyebrow mb-3">
        <span className="h-3 w-1 bg-violet-200" />
        Últim comunicat
      </h2>

      <Link
        href={`/comunicats/${announcement.id}`}
        className="group block border-l-4 border-violet-700 bg-violet-50 px-4 py-3.5 transition hover:bg-violet-100"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-display text-lg uppercase leading-tight tracking-wide text-violet-950">
              {announcement.title}
            </span>
            {announcement.published_at && (
              <span className="mt-1 block text-xs text-violet-500">
                {formatDateTime(announcement.published_at)}
              </span>
            )}
          </span>
          <ArrowIcon className="mt-1 h-5 w-5 shrink-0 text-violet-400 transition group-hover:translate-x-1 group-hover:text-violet-900" />
        </span>
      </Link>

      <Link
        href="/comunicats"
        className="mt-2 inline-block font-display text-sm uppercase tracking-wide text-violet-700 hover:text-violet-950"
      >
        Veure tots els comunicats
      </Link>
    </section>
  );
}
