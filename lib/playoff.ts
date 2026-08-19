import { computeStandings, groupStandings } from './standings';
import type {
  MatchWithNames,
  PlayoffMatch,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from './types';

/** Nom llegible d'un creuament: "Quarts de final 2". */
export function playoffMatchLabel(
  match: Pick<PlayoffMatch, 'id' | 'round_id' | 'slot'>,
  rounds: PlayoffRound[],
  allMatches: Pick<PlayoffMatch, 'id' | 'round_id' | 'slot'>[]
): string {
  const round = rounds.find((r) => r.id === match.round_id);
  if (!round) return 'Creuament';

  const siblings = allMatches
    .filter((m) => m.round_id === match.round_id)
    .sort((a, b) => a.slot - b.slot);

  // Amb un sol partit a la ronda (la final) no cal numerar-la.
  if (siblings.length <= 1) return round.name;

  const index = siblings.findIndex((m) => m.id === match.id);
  return `${round.name} ${index + 1}`;
}

// L'índex 0 no s'utilitza: els rànquings comencen a 1.
const ORDINAL = ['', '1r', '2n', '3r', '4t', '5è', '6è', '7è', '8è'];

function ordinal(rank: number) {
  return ORDINAL[rank] ?? `${rank}è`;
}

/**
 * Text que descriu d'on surt un equip d'un creuament, quan encara no se sap
 * qui és: "1r Grup A", "Guanyador Quarts de final 1"...
 */
export function describeSlot(
  side: 'home' | 'away',
  match: PlayoffMatch,
  rounds: PlayoffRound[],
  allMatches: PlayoffMatch[],
  teamsById: Map<string, Pick<Team, 'id' | 'name'>>
): string {
  const source = side === 'home' ? match.home_source : match.away_source;

  if (source === 'group_position') {
    const group = side === 'home' ? match.home_group : match.away_group;
    const rank = side === 'home' ? match.home_rank : match.away_rank;
    if (!rank) return 'Per determinar';
    return group ? `${ordinal(rank)} Grup ${group}` : `${ordinal(rank)}`;
  }

  if (source === 'winner') {
    const fromId =
      side === 'home' ? match.home_from_match : match.away_from_match;
    const from = allMatches.find((m) => m.id === fromId);
    if (!from) return 'Guanyador anterior';
    return `Guanyador ${playoffMatchLabel(from, rounds, allMatches)}`;
  }

  if (source === 'team') {
    const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
    return teamsById.get(teamId ?? '')?.name ?? 'Equip';
  }

  const label = side === 'home' ? match.home_label : match.away_label;
  return label?.trim() || 'Per determinar';
}

/**
 * Nom a ensenyar per a un costat del creuament: si ja se sap l'equip, el seu
 * nom; si no, la descripció de com s'hi arriba.
 */
export function slotDisplay(
  side: 'home' | 'away',
  match: PlayoffMatchWithNames,
  rounds: PlayoffRound[],
  allMatches: PlayoffMatchWithNames[],
  teamsById: Map<string, Pick<Team, 'id' | 'name'>>
): { name: string; resolved: boolean } {
  const resolved =
    side === 'home' ? match.resolved_home_team : match.resolved_away_team;

  if (resolved) return { name: resolved.name, resolved: true };

  return {
    name: describeSlot(side, match, rounds, allMatches, teamsById),
    resolved: false,
  };
}

/** Qui ha guanyat un creuament ja finalitzat. Null si encara no se sap. */
export function playoffWinnerId(match: PlayoffMatch): string | null {
  if (match.status !== 'finalizado') return null;
  if (match.home_score === match.away_score) return null;

  return match.home_score > match.away_score
    ? match.resolved_home_team_id
    : match.resolved_away_team_id;
}

export type SlotResolution = {
  matchId: string;
  side: 'home' | 'away';
  teamId: string | null;
};

/**
 * Resol els creuaments que depenen de la posició final de grup, fent servir
 * la classificació tal com estigui en aquest moment.
 *
 * S'executa en activar el play-off: a partir d'aquí la fase de grups queda
 * congelada, de manera que aquestes posicions ja no canvien.
 */
export function resolveGroupPositions(
  groupMatches: MatchWithNames[],
  playoffMatches: PlayoffMatch[]
): SlotResolution[] {
  const groups = groupStandings(computeStandings(groupMatches));

  const teamAt = (groupName: string | null, rank: number): string | null => {
    const group = groups.find((g) =>
      groupName ? g.group === groupName : g.group === null
    );
    // Amb un sol grup, l'admin pot no haver posat nom de grup al creuament.
    const fallback = groups.length === 1 ? groups[0] : undefined;
    const target = group ?? fallback;
    return target?.rows[rank - 1]?.teamId ?? null;
  };

  const out: SlotResolution[] = [];

  for (const match of playoffMatches) {
    if (match.home_source === 'group_position' && match.home_rank) {
      out.push({
        matchId: match.id,
        side: 'home',
        teamId: teamAt(match.home_group, match.home_rank),
      });
    }
    if (match.home_source === 'team') {
      out.push({
        matchId: match.id,
        side: 'home',
        teamId: match.home_team_id,
      });
    }

    if (match.away_source === 'group_position' && match.away_rank) {
      out.push({
        matchId: match.id,
        side: 'away',
        teamId: teamAt(match.away_group, match.away_rank),
      });
    }
    if (match.away_source === 'team') {
      out.push({
        matchId: match.id,
        side: 'away',
        teamId: match.away_team_id,
      });
    }
  }

  return out;
}

/**
 * Creuaments que s'alimenten del guanyador de `finishedMatch` i cal
 * actualitzar. Es crida cada cop que un partit d'eliminatòria es dona
 * per finalitzat.
 */
export function propagateWinner(
  finishedMatch: PlayoffMatch,
  allMatches: PlayoffMatch[]
): SlotResolution[] {
  const winnerId = playoffWinnerId(finishedMatch);
  const out: SlotResolution[] = [];

  for (const match of allMatches) {
    if (
      match.home_source === 'winner' &&
      match.home_from_match === finishedMatch.id
    ) {
      out.push({ matchId: match.id, side: 'home', teamId: winnerId });
    }
    if (
      match.away_source === 'winner' &&
      match.away_from_match === finishedMatch.id
    ) {
      out.push({ matchId: match.id, side: 'away', teamId: winnerId });
    }
  }

  return out;
}

/** Agrupa els creuaments per ronda, en ordre de ronda i de creuament. */
export function bracketByRound<T extends PlayoffMatch>(
  rounds: PlayoffRound[],
  matches: T[]
): { round: PlayoffRound; matches: T[] }[] {
  return [...rounds]
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((round) => ({
      round,
      matches: matches
        .filter((m) => m.round_id === round.id)
        .sort((a, b) => a.slot - b.slot),
    }));
}
