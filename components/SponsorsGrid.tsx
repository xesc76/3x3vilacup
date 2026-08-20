import { SPONSOR_TIERS } from '@/lib/constants';
import type { Sponsor } from '@/lib/types';

function SponsorLogo({
  sponsor,
  logoClass,
}: {
  sponsor: Sponsor;
  logoClass: string;
}) {
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      loading="lazy"
      className={`w-auto max-w-full object-contain ${logoClass}`}
    />
  );

  const shared = 'flex items-center justify-center bg-white p-4';

  return sponsor.website_url ? (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      title={sponsor.name}
      className={`${shared} transition hover:bg-violet-50`}
    >
      {logo}
    </a>
  ) : (
    <div title={sponsor.name} className={shared}>
      {logo}
    </div>
  );
}

/**
 * Col·laboradors agrupats pels tres nivells d'aportació. La jerarquia es veu
 * en la mida del logotip i en quants n'hi caben per fila: el principal ocupa
 * el doble que un patrocinador.
 */
export function SponsorsGrid({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;

  // El `?? 'patrocinador'` cobreix la finestra entre desplegar aquest codi i
  // executar la migració 0003: sense ell, els col·laboradors desapareixerien
  // del web perquè cap fila tindria encara nivell.
  const byTier = SPONSOR_TIERS.map((tier) => ({
    ...tier,
    sponsors: sponsors
      .filter((s) => (s.tier ?? 'patrocinador') === tier.value)
      .sort((a, b) => a.sort_order - b.sort_order),
  })).filter((tier) => tier.sponsors.length > 0);

  if (byTier.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="eyebrow justify-center">
        <span className="h-px w-8 bg-violet-200" />
        Amb el suport de
        <span className="h-px w-8 bg-violet-200" />
      </h2>

      <div className="mt-5 space-y-7">
        {byTier.map((tier) => (
          <div key={tier.value}>
            <p className="mb-2 text-center font-display text-[11px] uppercase tracking-[0.25em] text-violet-400">
              {tier.label}
            </p>
            <div className={`grid gap-px bg-violet-100 ${tier.gridClass}`}>
              {tier.sponsors.map((sponsor) => (
                <SponsorLogo
                  key={sponsor.id}
                  sponsor={sponsor}
                  logoClass={tier.logoClass}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
