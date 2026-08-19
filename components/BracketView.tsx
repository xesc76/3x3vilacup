'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import { bracketByRound, slotDisplay } from '@/lib/playoff';
import type {
  Category,
  CategoryPlayoff,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { FilterChips } from './FilterChips';

function SlotRow({
  name,
  resolved,
  score,
  showScore,
  isWinner,
}: {
  name: string;
  resolved: boolean;
  score: number;
  showScore: boolean;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${
          !resolved
            ? 'italic text-violet-400'
            : isWinner
              ? 'font-semibold text-violet-950'
              : 'font-medium text-violet-800'
        }`}
      >
        {name}
      </span>
      <span
        className={`w-9 shrink-0 text-right font-display text-xl leading-none tabular-nums ${
          showScore
            ? isWinner
              ? 'text-violet-950'
              : 'text-violet-400'
            : 'text-violet-200'
        }`}
      >
        {showScore ? score : '–'}
      </span>
    </div>
  );
}

export function BracketView({
  rounds,
  matches,
  teams,
  states,
}: {
  rounds: PlayoffRound[];
  matches: PlayoffMatchWithNames[];
  teams: Pick<Team, 'id' | 'name'>[];
  states: CategoryPlayoff[];
}) {
  // Comença per la primera categoria que tingui quadre muntat.
  const [category, setCategory] = useState<Category>(() => {
    const withBracket = CATEGORIES.find((c) =>
      rounds.some((r) => r.category === c.value)
    );
    return withBracket?.value ?? CATEGORIES[0].value;
  });

  const teamsById = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const categoryRounds = rounds.filter((r) => r.category === category);
  const roundIds = new Set(categoryRounds.map((r) => r.id));
  const categoryMatches = matches.filter((m) => roundIds.has(m.round_id));
  const bracket = bracketByRound(categoryRounds, categoryMatches);
  const active = states.find((s) => s.category === category)?.active ?? false;

  return (
    <div className="space-y-5">
      <FilterChips
        label="Categoria"
        value={category}
        onChange={(value) => value && setCategory(value)}
        options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
      />

      {!active && bracket.length > 0 && (
        <p className="border-l-4 border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          El play-off encara no ha començat. Aquí veus a quina hora i pista es
          jugarà cada creuament segons la posició amb què acabis el grup.
        </p>
      )}

      {bracket.length === 0 ? (
        <p className="panel px-4 py-10 text-center text-sm text-violet-400">
          Encara no hi ha quadre de play-off a{' '}
          {CATEGORY_LABEL[category]}.
        </p>
      ) : (
        <div className="space-y-6">
          {bracket.map(({ round, matches: roundMatches }) => (
            <section key={round.id}>
              <h2 className="eyebrow mb-2.5">
                <span className="h-3 w-1 bg-violet-200" />
                {round.name}
              </h2>

              {roundMatches.length === 0 ? (
                <p className="panel px-4 py-6 text-center text-sm text-violet-400">
                  Sense creuaments.
                </p>
              ) : (
                <div className="space-y-2">
                  {roundMatches.map((match) => {
                    const home = slotDisplay(
                      'home',
                      match,
                      categoryRounds,
                      categoryMatches,
                      teamsById
                    );
                    const away = slotDisplay(
                      'away',
                      match,
                      categoryRounds,
                      categoryMatches,
                      teamsById
                    );

                    const showScore = match.status !== 'programado';
                    const finished = match.status === 'finalizado';
                    const homeWins =
                      finished && match.home_score > match.away_score;
                    const awayWins =
                      finished && match.away_score > match.home_score;

                    const meta = [
                      match.starts_at ? formatTime(match.starts_at) : null,
                      match.court?.name,
                    ].filter(Boolean);

                    return (
                      <article
                        key={match.id}
                        className={`panel border-l-4 px-3.5 py-3 ${
                          match.status === 'en_juego'
                            ? 'border-l-acid-400'
                            : finished
                              ? 'border-l-violet-700'
                              : 'border-l-violet-100'
                        }`}
                      >
                        {meta.length > 0 && (
                          <p className="mb-2 font-display text-[11px] uppercase tracking-widest text-violet-400">
                            {meta.join(' · ')}
                          </p>
                        )}
                        <div className="space-y-1">
                          <SlotRow
                            name={home.name}
                            resolved={home.resolved}
                            score={match.home_score}
                            showScore={showScore}
                            isWinner={homeWins}
                          />
                          <SlotRow
                            name={away.name}
                            resolved={away.resolved}
                            score={match.away_score}
                            showScore={showScore}
                            isWinner={awayWins}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
