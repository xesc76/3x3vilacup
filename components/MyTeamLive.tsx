'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { computeStandings, groupStandings } from '@/lib/standings';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type { Category, MatchWithNames, Team } from '@/lib/types';
import { FilterChips } from './FilterChips';
import { LiveIndicator } from './LiveIndicator';
import { MatchCard } from './MatchCard';
import { StandingsCriteria, StandingsTable } from './StandingsTable';

export function MyTeamLive({
  initialMatches,
  teams,
}: {
  initialMatches: MatchWithNames[];
  teams: Team[];
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
              {myMatches.length}{' '}
              {myMatches.length === 1 ? 'partit' : 'partits'} · {played}{' '}
              {played === 1 ? 'jugat' : 'jugats'}
            </p>
            <LiveIndicator live={live} />
          </div>

          <section>
            <h2 className="eyebrow mb-2.5 text-violet-950">
              <span className="h-3 w-1 bg-acid-400" />
              Partits de {team.name}
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
