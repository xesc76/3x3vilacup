import type { Category, MatchStatus, SponsorTier } from './types';

export const TOURNAMENT = {
  /** Marca oficial: tot junt i en minúscules. */
  name: '3x3vilacup',
  edition: '4a edició',
  date: '2026-08-23',
  dateLabel: 'Diumenge 23 d’agost de 2026',
  venue: 'Pavelló Poliesportiu Nou (La Gamba)',
  city: 'Vilafranca del Penedès',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Pavell%C3%B3+Poliesportiu+Nou+La+Gamba+Vilafranca+del+Pened%C3%A8s',
} as const;

export const CATEGORIES: {
  value: Category;
  label: string;
  years: string;
}[] = [
  { value: 'minibasquet', label: 'Minibàsquet', years: '2014-2017' },
  { value: 'infantil', label: 'Infantil', years: '2012-2013' },
  { value: 'cadet', label: 'Cadet', years: '2010-2011' },
  { value: 'junior', label: 'Júnior', years: '2008-2009' },
  { value: 'senior', label: 'Sènior', years: 'X-2007' },
];

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<Category, string>;

export const CATEGORY_ORDER: Category[] = CATEGORIES.map((c) => c.value);

export const STATUS_LABEL: Record<MatchStatus, string> = {
  programado: 'Programat',
  en_juego: 'En joc',
  finalizado: 'Finalitzat',
};

/** Grups possibles dins d'una categoria. */
export const GROUP_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Noms de ronda suggerits en crear el quadre de play-off. */
export const ROUND_PRESETS = [
  'Setzens de final',
  'Vuitens de final',
  'Quarts de final',
  'Semifinals',
  'Final',
  '3r i 4t lloc',
] as const;

export const TRIPLES_DIVISIONS: { value: 'noi' | 'noia'; label: string }[] = [
  { value: 'noi', label: 'Nois' },
  { value: 'noia', label: 'Noies' },
];

/**
 * Nivells de col·laboració, del que més aporta al que menys. L'ordre d'aquesta
 * llista és el que marca la mida del logotip i l'ordre de les seccions.
 */
export const SPONSOR_TIERS: {
  value: SponsorTier;
  /** Títol de la secció al web públic. */
  label: string;
  /** Etiqueta curta per als desplegables de l'admin. */
  short: string;
  /** Alçada màxima del logotip. */
  logoClass: string;
  /** Columnes de la graella. */
  gridClass: string;
}[] = [
  {
    value: 'principal',
    label: 'Patrocinador principal',
    short: 'Principal',
    logoClass: 'max-h-24',
    gridClass: 'grid-cols-1 sm:grid-cols-2',
  },
  {
    value: 'collaborador',
    label: 'Col·laboradors',
    short: 'Col·laborador',
    logoClass: 'max-h-16',
    gridClass: 'grid-cols-2 sm:grid-cols-3',
  },
  {
    value: 'patrocinador',
    label: 'Patrocinadors',
    short: 'Patrocinador',
    logoClass: 'max-h-10',
    gridClass: 'grid-cols-3 sm:grid-cols-4',
  },
];

export const SPONSOR_TIER_LABEL: Record<SponsorTier, string> =
  Object.fromEntries(
    SPONSOR_TIERS.map((t) => [t.value, t.short])
  ) as Record<SponsorTier, string>;
