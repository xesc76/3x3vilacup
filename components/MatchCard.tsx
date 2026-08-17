import { CATEGORY_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import type { MatchWithNames } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

function TeamRow({
  name,
  logoUrl,
  score,
  showScore,
  isWinner,
}: {
  name: string;
  logoUrl: string | null;
  score: number;
  showScore: boolean;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
        />
      ) : (
        <span className="h-7 w-7 shrink-0 rounded-full bg-slate-100 ring-1 ring-slate-200" />
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${
          isWinner ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
        }`}
      >
        {name}
      </span>
      <span
        className={`w-9 shrink-0 text-right font-mono text-lg tabular-nums ${
          showScore
            ? isWinner
              ? 'font-bold text-slate-900'
              : 'font-semibold text-slate-600'
            : 'text-slate-300'
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
      className={`card p-3.5 ${
        match.status === 'en_juego' ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
          {formatTime(match.starts_at)}
        </span>
        <StatusBadge status={match.status} />
      </div>

      <div className="space-y-1.5">
        <TeamRow
          name={match.home_team?.name ?? 'Per determinar'}
          logoUrl={match.home_team?.logo_url ?? null}
          score={match.home_score}
          showScore={showScore}
          isWinner={homeWins}
        />
        <TeamRow
          name={match.away_team?.name ?? 'Per determinar'}
          logoUrl={match.away_team?.logo_url ?? null}
          score={match.away_score}
          showScore={showScore}
          isWinner={awayWins}
        />
      </div>

      {meta.length > 0 && (
        <p className="mt-2.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
          {meta.join(' · ')}
        </p>
      )}
    </article>
  );
}
