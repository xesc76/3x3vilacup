import { TRIPLES_DIVISIONS } from './constants';
import type { TriplesResult } from './types';

/** Rànquing del concurs de triples: més punts primer, i a igualtat per nom. */
export function sortTriples(results: TriplesResult[]): TriplesResult[] {
  return [...results].sort(
    (a, b) =>
      b.score - a.score || a.participant.localeCompare(b.participant, 'ca')
  );
}

export type TriplesGroup = {
  key: string;
  label: string;
  smallBasket: boolean;
  rows: TriplesResult[];
};

/**
 * Rànquings separats per tipus de cistella i per categoria.
 *
 * Els que tiren a cistella petita no competeixen contra els que tiren a
 * cistella normal, així que van en taules a part. Els grups buits no
 * apareixen: si ningú tira a cistella petita, no se'n parla.
 */
export function groupTriples(results: TriplesResult[]): TriplesGroup[] {
  const groups: TriplesGroup[] = [];

  for (const smallBasket of [false, true]) {
    for (const division of TRIPLES_DIVISIONS) {
      const rows = sortTriples(
        results.filter(
          (r) =>
            r.division === division.value &&
            // Abans d'executar la migració 0003 la columna no hi és: tothom
            // compta com a cistella normal en comptes de desaparèixer.
            (r.small_basket ?? false) === smallBasket
        )
      );
      if (rows.length === 0) continue;

      groups.push({
        key: `${smallBasket ? 'petita' : 'gran'}-${division.value}`,
        label: smallBasket
          ? `${division.label} · cistella petita`
          : division.label,
        smallBasket,
        rows,
      });
    }
  }

  return groups;
}
