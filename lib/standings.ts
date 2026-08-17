import { POINTS_LOSS, POINTS_WIN } from './constants';
import type { MatchWithNames } from './types';

export type StandingRow = {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  points: number;
};

/**
 * Classificació calculada en viu a partir dels partits FINALITZATS.
 * Desempat: punts > diferència > punts a favor > nom.
 */
export function computeStandings(matches: MatchWithNames[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  const ensure = (id: string, name: string, logo: string | null) => {
    let row = rows.get(id);
    if (!row) {
      row = {
        teamId: id,
        teamName: name,
        logoUrl: logo,
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
        points: 0,
      };
      rows.set(id, row);
    }
    return row;
  };

  for (const m of matches) {
    if (m.status !== 'finalizado' || !m.home_team || !m.away_team) continue;

    const home = ensure(m.home_team.id, m.home_team.name, m.home_team.logo_url);
    const away = ensure(m.away_team.id, m.away_team.name, m.away_team.logo_url);

    home.played++;
    away.played++;
    home.pointsFor += m.home_score;
    home.pointsAgainst += m.away_score;
    away.pointsFor += m.away_score;
    away.pointsAgainst += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      away.lost++;
      home.points += POINTS_WIN;
      away.points += POINTS_LOSS;
    } else if (m.away_score > m.home_score) {
      away.won++;
      home.lost++;
      away.points += POINTS_WIN;
      home.points += POINTS_LOSS;
    } else {
      // En 3x3 no hi hauria d'haver empats, però si el marcador s'ha
      // desat empatat no volem petar la taula: mig punt a cadascú.
      home.points += (POINTS_WIN + POINTS_LOSS) / 2;
      away.points += (POINTS_WIN + POINTS_LOSS) / 2;
    }
  }

  return Array.from(rows.values())
    .map((r) => ({ ...r, diff: r.pointsFor - r.pointsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.diff - a.diff ||
        b.pointsFor - a.pointsFor ||
        a.teamName.localeCompare(b.teamName, 'ca')
    );
}
