import type { Sponsor } from '@/lib/types';

export function SponsorsGrid({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        Amb el suport de
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sponsors.map((sponsor) => {
          const logo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              loading="lazy"
              className="max-h-12 w-auto max-w-full object-contain"
            />
          );

          return sponsor.website_url ? (
            <a
              key={sponsor.id}
              href={sponsor.website_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              title={sponsor.name}
              className="card flex h-24 items-center justify-center p-4 transition hover:shadow-md"
            >
              {logo}
            </a>
          ) : (
            <div
              key={sponsor.id}
              title={sponsor.name}
              className="card flex h-24 items-center justify-center p-4"
            >
              {logo}
            </div>
          );
        })}
      </div>
    </section>
  );
}
