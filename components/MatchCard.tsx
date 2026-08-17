import { CATEGORY_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import type { MatchStatus, MatchWithNames } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

/** Filet vertical de l'esquerra: dona l'estat d'un cop d'ull des de lluny. */
const ACCENT: Record<MatchStatus, string> = {
  programado: 'border-l-violet-100',
  en_juego: 'border-l-acid-400',
  finalizado: 'border-l-violet-700',
};

function TeamRow({
  name,
  logoUrl,
  score,
  showScore,
  /** Només un cop acabat el partit atenuem el perdedor. */
  dimmed,
  isWinner,
}: {
  name: string;
  logoUrl: string | null;
  score: number;
  showScore: boolean;
  dimmed: boolean;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-violet-100"
        />
      ) : (
        <span
          aria-hidden
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-50 font-display text-xs text-violet-400"
        >
          {name.charAt(0)}
        </span>
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${
          isWinner
            ? 'font-semibold text-violet-950'
            : 'font-medium text-violet-800'
        }`}
      >
        {name}
      </span>
      <span
        className={`w-10 shrink-0 text-right font-display text-2xl leading-none tabular-nums ${
          !showScore
            ? 'text-violet-200'
            : dimmed
              ? 'text-violet-400'
              : 'text-violet-950'
        }`}
      >
        {showScore ? score : '–'}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  showCourt = true,
  showCategory = true,
}: {
  match: MatchWithNames;
  showCourt?: boolean;
  showCategory?: boolean;
}) {
  const showScore = match.status !== 'programado';
  const finished = match.status === 'finalizado';
  const homeWins = finished && match.home_score > match.away_score;
  const awayWins = finished && match.away_score > match.home_score;

  const meta = [
    showCourt ? match.court?.name : null,
    showCategory ? CATEGORY_LABEL[match.category] : null,
    match.round,
  ].filter(Boolean);

  return (
    <article
      className={`panel border-l-4 px-3.5 py-3 ${ACCENT[match.status]}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-lg leading-none tabular-nums text-violet-950">
            {formatTime(match.starts_at)}
          </span>
          {meta.length > 0 && (
            <span className="truncate font-display text-[11px] uppercase tracking-widest text-violet-400">
              {meta.join(' · ')}
            </span>
          )}
        </p>
        <StatusBadge status={match.status} />
      </div>

      <div className="space-y-1">
        <TeamRow
          name={match.home_team?.name ?? 'Per determinar'}
          logoUrl={match.home_team?.logo_url ?? null}
          score={match.home_score}
          showScore={showScore}
          dimmed={finished && !homeWins}
          isWinner={homeWins}
        />
        <TeamRow
          name={match.away_team?.name ?? 'Per determinar'}
          logoUrl={match.away_team?.logo_url ?? null}
          score={match.away_score}
          showScore={showScore}
          dimmed={finished && !awayWins}
          isWinner={awayWins}
        />
      </div>
    </article>
  );
}
