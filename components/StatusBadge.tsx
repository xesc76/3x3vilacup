import { STATUS_LABEL } from '@/lib/constants';
import type { MatchStatus } from '@/lib/types';

const STYLE: Record<MatchStatus, string> = {
  programado: 'bg-violet-50 text-violet-500',
  en_juego: 'bg-acid-400 text-violet-950',
  finalizado: 'bg-violet-900 text-violet-100',
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 font-display text-[11px] uppercase leading-none tracking-widest ${STYLE[status]}`}
    >
      {status === 'en_juego' && (
        <span className="h-1.5 w-1.5 animate-blink bg-violet-950" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
