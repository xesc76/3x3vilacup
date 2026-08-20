import { CATEGORY_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import { bracketByRound, playoffMatchLabel } from '@/lib/playoff';
import type {
  Category,
  PlayoffMatchWithNames,
  PlayoffRound,
} from '@/lib/types';

/**
 * Partits d'eliminatòria al calendari, un cop activat el play-off d'aquella
 * categoria: mateixa informació que un partit de grups (hora, pista, equips)
 * més la ronda a la qual pertanyen.
 */
export function PlayoffSchedule({
  rounds,
  matches,
  activeCategories,
  teamId,
  title = 'Play-off',
}: {
  rounds: PlayoffRound[];
  matches: PlayoffMatchWithNames[];
  activeCategories: Category[];
  /** Si ve informat, només els creuaments d'aquest equip ("El meu equip"). */
  teamId?: string;
  title?: string;
}) {
  const activeRounds = rounds.filter((r) =>
    activeCategories.includes(r.category)
  );
  const roundIds = new Set(activeRounds.map((r) => r.id));
  const visible = matches.filter(
    (m) =>
      roundIds.has(m.round_id) &&
      (!teamId ||
        m.resolved_home_team_id === teamId ||
        m.resolved_away_team_id === teamId)
  );

  if (visible.length === 0) return null;

  const bracket = bracketByRound(activeRounds, visible);
  const roundName = new Map(activeRounds.map((r) => [r.id, r]));

  // Al calendari el que mana és l'hora, no la ronda.
  const ordered = [...visible].sort((a, b) => {
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    return a.starts_at.localeCompare(b.starts_at);
  });

  return (
    <section>
      <h2 className="eyebrow mb-2.5 text-violet-950">
        <span className="h-3 w-1 bg-acid-400" />
        {title}
      </h2>

      <div className="space-y-2">
        {ordered.map((match) => {
          const round = roundName.get(match.round_id);
          const label = round
            ? playoffMatchLabel(
                match,
                activeRounds,
                bracket.flatMap((b) => b.matches)
              )
            : 'Play-off';

          const showScore = match.status !== 'programado';
          const finished = match.status === 'finalizado';
          const homeWins = finished && match.home_score > match.away_score;
          const awayWins = finished && match.away_score > match.home_score;

          const meta = [
            match.court?.name,
            round ? CATEGORY_LABEL[round.category] : null,
            label,
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
              <p className="mb-2 flex min-w-0 items-baseline gap-2">
                <span className="font-display text-lg leading-none tabular-nums text-violet-950">
                  {match.starts_at ? formatTime(match.starts_at) : '--:--'}
                </span>
                <span className="truncate font-display text-[11px] uppercase tracking-widest text-violet-400">
                  {meta.join(' · ')}
                </span>
              </p>

              <div className="space-y-1">
                {(
                  [
                    {
                      team: match.resolved_home_team,
                      score: match.home_score,
                      wins: homeWins,
                    },
                    {
                      team: match.resolved_away_team,
                      score: match.away_score,
                      wins: awayWins,
                    },
                  ] as const
                ).map((side, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`min-w-0 flex-1 truncate text-[15px] ${
                        !side.team
                          ? 'italic text-violet-400'
                          : side.wins
                            ? 'font-semibold text-violet-950'
                            : 'font-medium text-violet-800'
                      }`}
                    >
                      {side.team?.name ?? 'Per determinar'}
                    </span>
                    <span
                      className={`w-9 shrink-0 text-right font-display text-xl leading-none tabular-nums ${
                        showScore
                          ? side.wins
                            ? 'text-violet-950'
                            : 'text-violet-400'
                          : 'text-violet-200'
                      }`}
                    >
                      {showScore ? side.score : '–'}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
