import type { MatchWithNames } from './types';

/**
 * Partits programats a la mateixa pista i a la mateixa hora.
 *
 * És l'error més fàcil de cometre muntant el calendari a mà i el més car de
 * descobrir el mateix dia del torneig: dos equips es planten a la mateixa
 * pista alhora. Retorna, per a cada partit conflictiu, quants n'hi ha en
 * aquella franja.
 */
export function findScheduleConflicts(
  matches: MatchWithNames[]
): Map<string, number> {
  const slots = new Map<string, string[]>();

  for (const match of matches) {
    // Sense pista assignada no hi ha conflicte possible.
    if (!match.court_id) continue;
    const key = `${match.court_id}|${match.starts_at}`;
    const list = slots.get(key);
    if (list) list.push(match.id);
    else slots.set(key, [match.id]);
  }

  const conflicts = new Map<string, number>();
  for (const ids of slots.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) conflicts.set(id, ids.length);
  }

  return conflicts;
}
