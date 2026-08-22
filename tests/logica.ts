/** Revisió completa de la lògica. Fitxer temporal: s'esborra en acabar. */
import { computeStandings, groupStandings } from '../lib/standings';
import {
  propagateWinner,
  resolveGroupPositions,
  playoffWinnerId,
  bracketByRound,
  describeSlot,
} from '../lib/playoff';
import { generateBracket } from '../lib/bracketGenerator';
import { groupTriples, sortTriples } from '../lib/triples';
import { findScheduleConflicts } from '../lib/schedule';
import { SPONSOR_TIERS } from '../lib/constants';
import type {
  MatchWithNames,
  PlayoffMatch,
  PlayoffRound,
  Sponsor,
  TriplesResult,
} from '../lib/types';

let fails = 0;
const eq = (name: string, a: unknown, b: unknown) => {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x === y) console.log(`  OK   ${name}`);
  else {
    fails++;
    console.log(`  FAIL ${name}\n       esperat:  ${y}\n       obtingut: ${x}`);
  }
};

let n = 0;
const team = (id: string, g: string | null) => ({
  id,
  name: id,
  logo_url: null,
  group_name: g,
});
const M = (
  h: string, hg: string | null, hs: number,
  a: string, ag: string | null, as_: number,
  status: MatchWithNames['status'] = 'finalizado'
): MatchWithNames =>
  ({
    id: `m${++n}`, category: 'cadet', court_id: null,
    starts_at: '2026-08-23T09:00:00Z',
    home_team_id: h, away_team_id: a,
    home_score: hs, away_score: as_, status, round: null,
    created_at: '', updated_at: '',
    home_team: team(h, hg), away_team: team(a, ag), court: null,
  }) as MatchWithNames;

console.log('\n── CLASSIFICACIÓ ─────────────────────────────');
eq('ordena per victòries',
  computeStandings([M('A', 'A', 21, 'B', 'A', 10), M('A', 'A', 21, 'C', 'A', 12), M('B', 'A', 21, 'C', 'A', 15)])
    .map((r) => r.teamId), ['A', 'B', 'C']);

eq('desempata per punts a favor',
  computeStandings([M('A', 'A', 30, 'C', 'A', 5), M('B', 'A', 21, 'C', 'A', 20), M('C', 'A', 9, 'A', 'A', 9)])
    .findIndex((r) => r.teamId === 'A'), 0);

eq('desempata per enfrontament directe',
  computeStandings([M('A', 'A', 10, 'B', 'A', 15), M('A', 'A', 20, 'C', 'A', 5), M('B', 'A', 15, 'C', 'A', 20)])
    .map((r) => r.teamId)[0], 'B');

eq('ignora els partits no acabats',
  computeStandings([M('A', 'A', 99, 'B', 'A', 0, 'en_juego')]).length, 0);

eq('separa grups',
  groupStandings(computeStandings([M('A1', 'A', 21, 'A2', 'A', 1), M('B1', 'B', 21, 'B2', 'B', 1)]))
    .map((g) => g.group), ['A', 'B']);

eq('grup únic quan no hi ha grups',
  groupStandings(computeStandings([M('X', null, 21, 'Y', null, 1)])).map((g) => g.group), [null]);

console.log('\n── QUADRE AUTOMÀTIC ──────────────────────────');
{
  const show = (s: any) => s.source === 'group_position' ? `${s.rank}${s.group ?? ''}` : `G${s.roundIndex}.${s.slot}`;
  const p = (r: any, i: number) => r[i].matches.map((m: any) => `${show(m.home)}-${show(m.away)}`);
  eq('4 equips, 1 grup', p(generateBracket([null], 4), 0), ['1-4', '2-3']);
  eq('4 equips, 2 grups (creuat)', p(generateBracket(['A', 'B'], 4), 0), ['1A-2B', '1B-2A']);
  eq('8 equips, 1 grup', p(generateBracket([null], 8), 0), ['1-8', '4-5', '2-7', '3-6']);
  eq('rondes de 8', generateBracket([null], 8).map((r) => r.name), ['Quarts de final', 'Semifinals', 'Final']);
  eq('final sola amb 2', generateBracket(['A', 'B'], 2).map((r) => r.name), ['Final']);
}

console.log('\n── PLAY-OFF ──────────────────────────────────');
const PM = (o: Partial<PlayoffMatch>): PlayoffMatch => ({
  id: 'p', round_id: 'r', slot: 0, court_id: null, starts_at: null,
  home_source: 'text', home_group: null, home_rank: null, home_from_match: null,
  home_team_id: null, home_label: null,
  away_source: 'text', away_group: null, away_rank: null, away_from_match: null,
  away_team_id: null, away_label: null,
  resolved_home_team_id: null, resolved_away_team_id: null,
  home_score: 0, away_score: 0, status: 'programado',
  created_at: '', updated_at: '', ...o,
});

{
  const grups = [M('A1', 'A', 21, 'A2', 'A', 1), M('B1', 'B', 21, 'B2', 'B', 1)];
  const semi = PM({ id: 's1', home_source: 'group_position', home_group: 'A', home_rank: 1, away_source: 'group_position', away_group: 'B', away_rank: 2 });
  const res = resolveGroupPositions(grups, [semi]);
  eq('resol 1r Grup A', res.find((r) => r.side === 'home')?.teamId, 'A1');
  eq('resol 2n Grup B', res.find((r) => r.side === 'away')?.teamId, 'B2');
}
{
  const grups = [M('X', null, 21, 'Y', null, 1)];
  const semi = PM({ id: 's', home_source: 'group_position', home_group: 'A', home_rank: 1 });
  eq('grup únic encara que el creuament digui Grup A',
    resolveGroupPositions(grups, [semi])[0].teamId, 'X');
}
{
  const s1 = PM({ id: 's1', resolved_home_team_id: 'A1', resolved_away_team_id: 'B2', home_score: 21, away_score: 14, status: 'finalizado' });
  const fin = PM({ id: 'f', round_id: 'r2', home_source: 'winner', home_from_match: 's1' });
  eq('guanyador', playoffWinnerId(s1), 'A1');
  eq('propaga a la final', propagateWinner(s1, [s1, fin]), [{ matchId: 'f', side: 'home', teamId: 'A1' }]);
  eq('reobrir buida la final',
    propagateWinner({ ...s1, status: 'en_juego' }, [s1, fin]), [{ matchId: 'f', side: 'home', teamId: null }]);
  eq('empat no dona guanyador', playoffWinnerId({ ...s1, away_score: 21 }), null);
}
{
  const rounds: PlayoffRound[] = [
    { id: 'r1', category: 'cadet', name: 'Semifinals', sort_order: 0, created_at: '' },
    { id: 'r2', category: 'cadet', name: 'Final', sort_order: 1, created_at: '' },
  ];
  const ms = [PM({ id: 'a', round_id: 'r1', slot: 0 }), PM({ id: 'b', round_id: 'r1', slot: 1 }), PM({ id: 'c', round_id: 'r2', slot: 0 })];
  eq('ordena les rondes', bracketByRound(rounds, ms).map((b) => b.round.name), ['Semifinals', 'Final']);
  eq('descriu posició de grup',
    describeSlot('home', PM({ home_source: 'group_position', home_group: 'A', home_rank: 1 }), rounds, ms, new Map()),
    '1r Grup A');
  eq('descriu guanyador previ',
    describeSlot('home', PM({ home_source: 'winner', home_from_match: 'a' }), rounds, ms, new Map()),
    'Guanyador Semifinals 1');
  eq('text lliure',
    describeSlot('home', PM({ home_source: 'text', home_label: 'Convidat' }), rounds, ms, new Map()),
    'Convidat');
  eq('sense dades no peta',
    describeSlot('home', PM({ home_source: 'group_position' }), rounds, ms, new Map()),
    'Per determinar');
}

console.log('\n── TRIPLES ───────────────────────────────────');
const T = (d: 'noi' | 'noia', p: string, s: number, sb: boolean): TriplesResult =>
  ({ id: p, division: d, participant: p, club: null, score: s, small_basket: sb, created_at: '' });
{
  const g = groupTriples([T('noi', 'a', 5, false), T('noi', 'b', 9, true), T('noia', 'c', 7, false)]);
  eq('grups i ordre', g.map((x) => x.label), ['Nois', 'Noies', 'Nois · cistella petita']);
  eq('ordena per punts', sortTriples([T('noi', 'x', 3, false), T('noi', 'y', 8, false)]).map((r) => r.participant), ['y', 'x']);
  // Sense la migració 0003 la columna no hi és: no han de desaparèixer.
  const vell = [{ id: '1', division: 'noi', participant: 'v', club: null, score: 4 }] as unknown as TriplesResult[];
  eq('tolera small_basket absent', groupTriples(vell).map((x) => x.label), ['Nois']);
}

console.log('\n── NIVELLS DE COL·LABORADOR ──────────────────');
{
  const S = (name: string, tier: unknown): Sponsor =>
    ({ id: name, name, logo_url: '', website_url: null, tier, sort_order: 1, active: true, created_at: '' }) as Sponsor;
  const byTier = (list: Sponsor[]) =>
    SPONSOR_TIERS.map((t) => list.filter((s) => (s.tier ?? 'patrocinador') === t.value).length);
  eq('reparteix pels tres nivells', byTier([S('a', 'principal'), S('b', 'collaborador'), S('c', 'patrocinador')]), [1, 1, 1]);
  eq('tolera tier absent (cau al nivell base)', byTier([S('x', undefined)]), [0, 0, 1]);
  eq('tres nivells definits', SPONSOR_TIERS.length, 3);
}

console.log('\n── SOLAPAMENTS DE CALENDARI ──────────────────');
{
  const mk = (id: string, court: string | null, t: string): MatchWithNames =>
    ({ ...M('A', null, 0, 'B', null, 0, 'programado'), id, court_id: court, starts_at: t }) as MatchWithNames;
  const c = findScheduleConflicts([
    mk('1', 'p1', 'T1'), mk('2', 'p1', 'T1'), mk('3', 'p1', 'T2'),
    mk('4', 'p2', 'T1'), mk('5', null, 'T1'), mk('6', null, 'T1'),
  ]);
  eq('detecta els dos de la mateixa pista i hora', [...c.keys()].sort(), ['1', '2']);
  eq('compta quants n hi ha a la franja', c.get('1'), 2);
  eq('ignora els que no tenen pista', c.has('5'), false);
  eq('no marca els que no xoquen', c.has('3'), false);
}

console.log(fails === 0 ? '\n✅ TOTS ELS TESTS PASSEN\n' : `\n❌ ${fails} TESTS FALLEN\n`);
process.exit(fails === 0 ? 0 : 1);
