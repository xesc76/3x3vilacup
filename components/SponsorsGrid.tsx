import type { Sponsor } from '@/lib/types';

export function SponsorsGrid({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="eyebrow justify-center">
        <span className="h-px w-8 bg-violet-200" />
        Amb el suport de
        <span className="h-px w-8 bg-violet-200" />
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-px bg-violet-100 sm:grid-cols-3 lg:grid-cols-4">
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
              className="flex h-24 items-center justify-center bg-white p-4 transition hover:bg-violet-50"
            >
              {logo}
            </a>
          ) : (
            <div
              key={sponsor.id}
              title={sponsor.name}
              className="flex h-24 items-center justify-center bg-white p-4"
            >
              {logo}
            </div>
          );
        })}
      </div>
    </section>
  );
}
