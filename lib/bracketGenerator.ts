/**
 * Generador automàtic del quadre d'eliminatòries.
 *
 * L'objectiu és que l'organització no hagi d'anar configurant creuament per
 * creuament: es tria quants equips passen i el quadre surt fet, amb els
 * emparellaments estàndard (1r contra últim classificat) i, si hi ha més
 * d'un grup, creuant grups perquè els primers no es trobin fins al final.
 */

export type GeneratedSlot =
  | { source: 'group_position'; group: string | null; rank: number }
  /** Guanyador d'un creuament d'una ronda anterior d'aquest mateix quadre. */
  | { source: 'winner'; roundIndex: number; slot: number };

export type GeneratedMatch = {
  slot: number;
  home: GeneratedSlot;
  away: GeneratedSlot;
};

export type GeneratedRound = {
  name: string;
  matches: GeneratedMatch[];
};

/** Quants equips poden passar segons els que hi ha a la categoria. */
export const BRACKET_SIZES = [2, 4, 8, 16] as const;
export type BracketSize = (typeof BRACKET_SIZES)[number];

function roundName(teamsInRound: number): string {
  switch (teamsInRound) {
    case 2:
      return 'Final';
    case 4:
      return 'Semifinals';
    case 8:
      return 'Quarts de final';
    case 16:
      return 'Vuitens de final';
    default:
      return `Ronda de ${teamsInRound}`;
  }
}

/**
 * Ordre clàssic de caps de sèrie: per a 8 dona [1,8,4,5,2,7,3,6], que és el
 * que fa que el 1r i el 2r només es puguin trobar a la final.
 */
function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const round = order.length * 2;
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed, round + 1 - seed);
    }
    order = next;
  }
  return order;
}

/**
 * Llista de places ordenades per qualitat: primer tots els primers de grup,
 * després tots els segons, etc. Amb dos grups això fa que el seed 1 sigui
 * "1r del Grup A" i el seed 4 "2n del Grup B", i el creuament 1-4 surti
 * creuat sol.
 */
function seedSlots(
  groups: (string | null)[],
  size: number
): { group: string | null; rank: number }[] {
  const slots: { group: string | null; rank: number }[] = [];
  const perGroup = Math.ceil(size / groups.length);

  for (let rank = 1; rank <= perGroup; rank++) {
    for (const group of groups) {
      slots.push({ group, rank });
      if (slots.length === size) return slots;
    }
  }

  return slots;
}

/**
 * Construeix el quadre sencer.
 *
 * @param groups Grups de la categoria. Llista buida o [null] = grup únic.
 * @param size   Equips que passen (2, 4, 8 o 16).
 */
export function generateBracket(
  groups: (string | null)[],
  size: BracketSize
): GeneratedRound[] {
  const usableGroups = groups.length > 0 ? groups : [null];
  const slots = seedSlots(usableGroups, size);
  const order = seedOrder(size);

  const rounds: GeneratedRound[] = [];

  // Primera ronda: emparella seeds segons l'ordre clàssic.
  const firstRound: GeneratedMatch[] = [];
  for (let i = 0; i < order.length; i += 2) {
    const homeSeed = order[i];
    const awaySeed = order[i + 1];
    const home = slots[homeSeed - 1];
    const away = slots[awaySeed - 1];

    firstRound.push({
      slot: firstRound.length,
      home: { source: 'group_position', group: home.group, rank: home.rank },
      away: { source: 'group_position', group: away.group, rank: away.rank },
    });
  }
  rounds.push({ name: roundName(size), matches: firstRound });

  // Rondes següents: cada creuament el juguen els guanyadors de dos
  // creuaments consecutius de la ronda anterior.
  let teamsLeft = size / 2;
  while (teamsLeft >= 2) {
    const previousIndex = rounds.length - 1;
    const previousMatches = rounds[previousIndex].matches;
    const matches: GeneratedMatch[] = [];

    for (let i = 0; i < previousMatches.length; i += 2) {
      matches.push({
        slot: matches.length,
        home: { source: 'winner', roundIndex: previousIndex, slot: i },
        away: { source: 'winner', roundIndex: previousIndex, slot: i + 1 },
      });
    }

    rounds.push({ name: roundName(teamsLeft), matches });
    teamsLeft = teamsLeft / 2;
  }

  return rounds;
}
