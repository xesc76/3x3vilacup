'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { computeStandings, groupStandings } from '@/lib/standings';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type {
  Category,
  CategoryPlayoff,
  MatchWithNames,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { FilterChips } from './FilterChips';
import { LiveIndicator } from './LiveIndicator';
import { MatchCard } from './MatchCard';
import { PlayoffSchedule } from './PlayoffSchedule';
import { StandingsCriteria, StandingsTable } from './StandingsTable';

export function MyTeamLive({
  initialMatches,
  teams,
  playoffRounds,
  playoffMatches,
  playoffStates,
}: {
  initialMatches: MatchWithNames[];
  teams: Team[];
  playoffRounds: PlayoffRound[];
  playoffMatches: PlayoffMatchWithNames[];
  playoffStates: CategoryPlayoff[];
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const { matches, live } = useLiveMatches(initialMatches);

  const teamsInCategory = useMemo(
    () => (category ? teams.filter((t) => t.category === category) : []),
    [teams, category]
  );

  const team = useMemo(
    () => teams.find((t) => t.id === teamId) ?? null,
    [teams, teamId]
  );

  const myMatches = useMemo(
    () =>
      team
        ? matches.filter(
            (m) => m.home_team_id === team.id || m.away_team_id === team.id
          )
        : [],
    [matches, team]
  );

  // La classificació que li interessa a l'equip és la del seu grup.
  const myStandings = useMemo(() => {
    if (!team) return null;
    const rows = computeStandings(
      matches.filter((m) => m.category === team.category)
    );
    const groups = groupStandings(rows);
    return (
      groups.find((g) => g.rows.some((r) => r.teamId === team.id)) ?? null
    );
  }, [matches, team]);

  const played = myMatches.filter((m) => m.status === 'finalizado').length;

  // Posició dins del seu grup (1-based). Null si encara no ha jugat res.
  const position = useMemo(() => {
    if (!team || !myStandings) return null;
    const index = myStandings.rows.findIndex((r) => r.teamId === team.id);
    return index === -1 ? null : index + 1;
  }, [team, myStandings]);

  const myRow = myStandings?.rows.find((r) => r.teamId === team?.id) ?? null;

  // Amb el play-off actiu, l'equip ha de veure també els seus creuaments.
  const playoffActive = team
    ? (playoffStates.find((s) => s.category === team.category)?.active ?? false)
    : false;

  const myPlayoffCount = useMemo(() => {
    if (!team || !playoffActive) return 0;
    return playoffMatches.filter(
      (m) =>
        m.resolved_home_team_id === team.id ||
        m.resolved_away_team_id === team.id
    ).length;
  }, [team, playoffActive, playoffMatches]);

  return (
    <div className="space-y-5">
      <FilterChips
        label="Categoria"
        value={category}
        onChange={(value) => {
          setCategory(value);
          setTeamId(null);
        }}
        options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
      />

      {category && (
        <div>
          <label className="label" htmlFor="team-picker">
            Equip
          </label>
          <select
            id="team-picker"
            value={teamId ?? ''}
            onChange={(e) => setTeamId(e.target.value || null)}
            className="input"
          >
            <option value="">— Tria el teu equip —</option>
            {teamsInCategory.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.group_name ? ` · Grup ${t.group_name}` : ''}
              </option>
            ))}
          </select>
          {teamsInCategory.length === 0 && (
            <p className="mt-2 text-sm text-violet-400">
              Encara no hi ha equips en aquesta categoria.
            </p>
          )}
        </div>
      )}

      {!category && (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Tria una categoria i després el teu equip.
        </p>
      )}

      {team && (
        <>
          <div className="flex items-center justify-between border-t border-violet-100 pt-3">
            <p className="font-display text-xs uppercase tracking-widest text-violet-400">
              {myMatches.length + myPlayoffCount}{' '}
              {myMatches.length + myPlayoffCount === 1 ? 'partit' : 'partits'} ·{' '}
              {played} {played === 1 ? 'jugat' : 'jugats'}
              {myPlayoffCount > 0 && ` · ${myPlayoffCount} de play-off`}
            </p>
            <LiveIndicator live={live} />
          </div>

          {position && myRow && (
            <div className="flex items-center gap-4 border-l-4 border-acid-400 bg-acid-50 px-4 py-3.5">
              <span className="font-display text-5xl leading-none tabular-nums text-violet-950">
                {position}
                <span className="text-2xl">
                  {position === 1 ? 'r' : position === 2 ? 'n' : position === 3 ? 'r' : 't'}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg uppercase leading-tight tracking-wide text-violet-950">
                  {myStandings?.group
                    ? `del Grup ${myStandings.group}`
                    : 'de la classificació'}
                </span>
                <span className="mt-0.5 block text-sm text-violet-600">
                  {myRow.won} {myRow.won === 1 ? 'victòria' : 'victòries'} ·{' '}
                  {myRow.lost} {myRow.lost === 1 ? 'derrota' : 'derrotes'} ·{' '}
                  {myRow.pointsFor} punts a favor
                </span>
              </span>
            </div>
          )}

          {/* Els creuaments van primer: amb el play-off actiu són el que
              l'equip vol saber ara mateix. */}
          {playoffActive && (
            <PlayoffSchedule
              rounds={playoffRounds}
              matches={playoffMatches}
              activeCategories={[team.category]}
              teamId={team.id}
              title={`Play-off de ${team.name}`}
            />
          )}

          <section>
            <h2 className="eyebrow mb-2.5">
              <span className="h-3 w-1 bg-violet-200" />
              {playoffActive ? 'Fase de grups' : `Partits de ${team.name}`}
            </h2>
            {myMatches.length === 0 ? (
              <p className="panel px-4 py-8 text-center text-sm text-violet-400">
                Aquest equip encara no té cap partit programat.
              </p>
            ) : (
              <div className="space-y-2">
                {myMatches.map((m) => (
                  <MatchCard key={m.id} match={m} showCategory={false} />
                ))}
              </div>
            )}
          </section>

          {myStandings && (
            <section>
              <h2 className="eyebrow mb-2.5">
                <span className="h-3 w-1 bg-violet-200" />
                Classificació
                {myStandings.group ? ` · Grup ${myStandings.group}` : ''}
              </h2>
              <StandingsTable rows={myStandings.rows} highlightTeamId={team.id} />
              <div className="mt-3">
                <StandingsCriteria />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
