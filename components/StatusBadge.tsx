import { STATUS_LABEL, STATUS_STYLE } from '@/lib/constants';
import type { MatchStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {status === 'en_juego' && (
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red-600" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
