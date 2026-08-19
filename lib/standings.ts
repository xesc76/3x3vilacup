import type { MatchWithNames } from './types';

export type StandingRow = {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  groupName: string | null;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
};

/**
 * Criteris de classificació del torneig (els va fixar el client):
 *   1. Nombre de victòries
 *   2. Punts a favor
 *   3. Enfrontament directe entre els equips implicats
 */
export function computeStandings(matches: MatchWithNames[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  const ensure = (
    id: string,
    name: string,
    logo: string | null,
    groupName: string | null
  ) => {
    let row = rows.get(id);
    if (!row) {
      row = {
        teamId: id,
        teamName: name,
        logoUrl: logo,
        groupName,
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
      };
      rows.set(id, row);
    }
    return row;
  };

  const finished = matches.filter(
    (m) => m.status === 'finalizado' && m.home_team && m.away_team
  );

  for (const m of finished) {
    const home = ensure(
      m.home_team!.id,
      m.home_team!.name,
      m.home_team!.logo_url,
      m.home_team!.group_name ?? null
    );
    const away = ensure(
      m.away_team!.id,
      m.away_team!.name,
      m.away_team!.logo_url,
      m.away_team!.group_name ?? null
    );

    home.played++;
    away.played++;
    home.pointsFor += m.home_score;
    home.pointsAgainst += m.away_score;
    away.pointsFor += m.away_score;
    away.pointsAgainst += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      away.lost++;
    } else if (m.away_score > m.home_score) {
      away.won++;
      home.lost++;
    }
    // En 3x3 no hi ha empats; si el marcador queda empatat no compta com
    // a victòria per a ningú, però els punts a favor sí que hi sumen.
  }

  const all = Array.from(rows.values()).map((r) => ({
    ...r,
    diff: r.pointsFor - r.pointsAgainst,
  }));

  return all.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;

    const h2h = headToHead(a.teamId, b.teamId, finished);
    if (h2h !== 0) return h2h;

    return a.teamName.localeCompare(b.teamName, 'ca');
  });
}

/**
 * Desempat per enfrontament directe.
 *
 * Amb dos equips és el resultat del partit que van jugar. Amb tres o més
 * empatats, comparar-los de dos en dos pot donar un ordre incoherent
 * (A guanya B, B guanya C, C guanya A), així que es mira el balanç de
 * victòries de cada equip només dins dels partits entre els empatats.
 *
 * Retorna <0 si `a` va davant, >0 si va darrere, 0 si segueixen empatats.
 */
function headToHead(
  a: string,
  b: string,
  finished: MatchWithNames[]
): number {
  let winsA = 0;
  let winsB = 0;
  let scoredA = 0;
  let scoredB = 0;

  for (const m of finished) {
    const home = m.home_team!.id;
    const away = m.away_team!.id;
    const involvesBoth =
      (home === a && away === b) || (home === b && away === a);
    if (!involvesBoth) continue;

    const aScore = home === a ? m.home_score : m.away_score;
    const bScore = home === b ? m.home_score : m.away_score;

    scoredA += aScore;
    scoredB += bScore;
    if (aScore > bScore) winsA++;
    else if (bScore > aScore) winsB++;
  }

  if (winsA !== winsB) return winsB - winsA;
  // Si s'han repartit les victòries, decideixen els punts d'aquests partits.
  return scoredB - scoredA;
}

/** Agrupa la classificació per grup dins d'una categoria. */
export function groupStandings(
  rows: StandingRow[]
): { group: string | null; rows: StandingRow[] }[] {
  const byGroup = new Map<string, StandingRow[]>();

  for (const row of rows) {
    const key = row.groupName ?? '';
    const list = byGroup.get(key);
    if (list) list.push(row);
    else byGroup.set(key, [row]);
  }

  return Array.from(byGroup.entries())
    .map(([group, groupRows]) => ({
      group: group === '' ? null : group,
      rows: groupRows,
    }))
    .sort((a, b) => (a.group ?? '').localeCompare(b.group ?? '', 'ca'));
}
