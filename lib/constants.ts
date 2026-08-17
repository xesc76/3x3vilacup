import type { Category, MatchStatus } from './types';

export const TOURNAMENT = {
  name: 'Vila Cup 3x3',
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

/**
 * Punts de classificació. Per defecte, reglament FIBA 3x3:
 * victòria = 2, derrota = 1. Canvia aquí si el torneig fa servir 3/0.
 */
export const POINTS_WIN = 2;
export const POINTS_LOSS = 1;
