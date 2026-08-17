'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_LABEL, STATUS_LABEL } from '@/lib/constants';
import { formatTime } from '@/lib/format';
import { useLiveMatches } from '@/lib/useLiveMatches';
import type { Category, Court, MatchStatus, MatchWithNames } from '@/lib/types';
import { FilterChips } from '@/components/FilterChips';
import { LiveIndicator } from '@/components/LiveIndicator';
import { StatusBadge } from '@/components/StatusBadge';

export function MatchPicker({
  initialMatches,
  courts,
}: {
  initialMatches: MatchWithNames[];
  courts: Court[];
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [court, setCourt] = useState<string | null>(null);
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const { matches, live } = useLiveMatches(initialMatches);

  const visible = useMemo(
    () =>
      matches.filter(
        (m) =>
          (!category || m.category === category) &&
          (!court || m.court_id === court) &&
          (!status || m.status === status)
      ),
    [matches, category, court, status]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <FilterChips
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[
            { value: null, label: 'Totes' },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
        />
        {courts.length > 1 && (
          <FilterChips
            label="Pista"
            value={court}
            onChange={setCourt}
            options={[
              { value: null, label: 'Totes' },
              ...courts.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        )}
        <FilterChips
          label="Estat"
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: 'Tots' },
            { value: 'en_juego' as MatchStatus, label: STATUS_LABEL.en_juego },
            {
              value: 'programado' as MatchStatus,
              label: STATUS_LABEL.programado,
            },
            {
              value: 'finalizado' as MatchStatus,
              label: STATUS_LABEL.finalizado,
            },
          ]}
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <p className="text-sm text-slate-500">
          {visible.length} {visible.length === 1 ? 'partit' : 'partits'}
        </p>
        <LiveIndicator live={live} />
      </div>

      {visible.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-500">
          Cap partit amb aquests filtres.{' '}
          <Link href="/admin/partits" className="font-semibold text-brand-600">
            Crear-ne un
          </Link>
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((m) => (
            <Link
              key={m.id}
              href={`/admin/partit/${m.id}`}
              className="card flex items-center gap-3 p-3 transition hover:shadow-md active:bg-slate-50"
            >
              <span className="w-12 shrink-0 font-mono text-sm font-bold tabular-nums text-slate-700">
                {formatTime(m.starts_at)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {m.home_team?.name ?? '—'} vs {m.away_team?.name ?? '—'}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {[CATEGORY_LABEL[m.category], m.court?.name, m.round]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-lg font-bold tabular-nums text-slate-900">
                  {m.status === 'programado'
                    ? '–'
                    : `${m.home_score}-${m.away_score}`}
                </span>
              </span>
              <StatusBadge status={m.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
