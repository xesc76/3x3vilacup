import type { TriplesResult } from './types';

/** Rànquing del concurs de triples: més punts primer, i a igualtat per nom. */
export function sortTriples(results: TriplesResult[]): TriplesResult[] {
  return [...results].sort(
    (a, b) =>
      b.score - a.score || a.participant.localeCompare(b.participant, 'ca')
  );
}
