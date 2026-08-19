'use client';

import { useState } from 'react';
import { GROUP_OPTIONS } from '@/lib/constants';
import { toTimeInput } from '@/lib/format';
import { playoffMatchLabel } from '@/lib/playoff';
import type {
  Court,
  PlayoffMatch,
  PlayoffMatchWithNames,
  PlayoffRound,
  SlotSource,
  Team,
} from '@/lib/types';

const SOURCE_LABELS: { value: SlotSource; label: string }[] = [
  { value: 'group_position', label: 'Posició de grup' },
  { value: 'winner', label: 'Guanyador d’un creuament' },
  { value: 'team', label: 'Equip directe' },
  { value: 'text', label: 'Text lliure' },
];

export type SlotForm = {
  source: SlotSource;
  group: string;
  rank: string;
  fromMatch: string;
  teamId: string;
  label: string;
};

export function slotFormFrom(
  match: PlayoffMatch,
  side: 'home' | 'away'
): SlotForm {
  return side === 'home'
    ? {
        source: match.home_source,
        group: match.home_group ?? '',
        rank: match.home_rank ? String(match.home_rank) : '',
        fromMatch: match.home_from_match ?? '',
        teamId: match.home_team_id ?? '',
        label: match.home_label ?? '',
      }
    : {
        source: match.away_source,
        group: match.away_group ?? '',
        rank: match.away_rank ? String(match.away_rank) : '',
        fromMatch: match.away_from_match ?? '',
        teamId: match.away_team_id ?? '',
        label: match.away_label ?? '',
      };
}

/** Converteix el formulari d'un costat a les columnes de la taula. */
export function slotPayload(form: SlotForm, side: 'home' | 'away') {
  const p = side === 'home' ? 'home' : 'away';
  return {
    [`${p}_source`]: form.source,
    [`${p}_group`]: form.source === 'group_position' ? form.group || null : null,
    [`${p}_rank`]:
      form.source === 'group_position' ? Number(form.rank) || null : null,
    [`${p}_from_match`]: form.source === 'winner' ? form.fromMatch || null : null,
    [`${p}_team_id`]: form.source === 'team' ? form.teamId || null : null,
    [`${p}_label`]: form.source === 'text' ? form.label.trim() || null : null,
  };
}

function SlotEditor({
  title,
  value,
  onChange,
  teams,
  otherMatches,
  rounds,
  allMatches,
}: {
  title: string;
  value: SlotForm;
  onChange: (next: SlotForm) => void;
  teams: Team[];
  otherMatches: PlayoffMatchWithNames[];
  rounds: PlayoffRound[];
  allMatches: PlayoffMatchWithNames[];
}) {
  return (
    <div className="rounded-sm bg-violet-50 p-3">
      <p className="label">{title}</p>

      <select
        value={value.source}
        onChange={(e) =>
          onChange({ ...value, source: e.target.value as SlotSource })
        }
        className="input"
      >
        {SOURCE_LABELS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {value.source === 'group_position' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            aria-label="Grup"
            value={value.group}
            onChange={(e) => onChange({ ...value, group: e.target.value })}
            className="input"
          >
            <option value="">Grup únic</option>
            {GROUP_OPTIONS.map((g) => (
              <option key={g} value={g}>
                Grup {g}
              </option>
            ))}
          </select>
          <select
            aria-label="Posició"
            value={value.rank}
            onChange={(e) => onChange({ ...value, rank: e.target.value })}
            className="input"
          >
            <option value="">Posició…</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
              <option key={r} value={r}>
                {r}è classificat
              </option>
            ))}
          </select>
        </div>
      )}

      {value.source === 'winner' && (
        <select
          aria-label="Creuament anterior"
          value={value.fromMatch}
          onChange={(e) => onChange({ ...value, fromMatch: e.target.value })}
          className="input mt-2"
        >
          <option value="">— Tria el creuament —</option>
          {otherMatches.map((m) => (
            <option key={m.id} value={m.id}>
              {playoffMatchLabel(m, rounds, allMatches)}
            </option>
          ))}
        </select>
      )}

      {value.source === 'team' && (
        <select
          aria-label="Equip"
          value={value.teamId}
          onChange={(e) => onChange({ ...value, teamId: e.target.value })}
          className="input mt-2"
        >
          <option value="">— Tria l’equip —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.group_name ? ` · Grup ${t.group_name}` : ''}
            </option>
          ))}
        </select>
      )}

      {value.source === 'text' && (
        <input
          aria-label="Text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Equip convidat"
          className="input mt-2"
        />
      )}
    </div>
  );
}

export function PlayoffMatchEditor({
  match,
  rounds,
  allMatches,
  teams,
  courts,
  playoffActive,
  onSave,
  onDelete,
  onScore,
}: {
  match: PlayoffMatchWithNames;
  rounds: PlayoffRound[];
  allMatches: PlayoffMatchWithNames[];
  teams: Team[];
  courts: Court[];
  playoffActive: boolean;
  onSave: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (match: PlayoffMatchWithNames) => Promise<void>;
  onScore: (
    match: PlayoffMatchWithNames,
    home: number,
    away: number,
    status: PlayoffMatch['status']
  ) => Promise<void>;
}) {
  const [home, setHome] = useState(() => slotFormFrom(match, 'home'));
  const [away, setAway] = useState(() => slotFormFrom(match, 'away'));
  const [courtId, setCourtId] = useState(match.court_id ?? '');
  const [time, setTime] = useState(
    match.starts_at ? toTimeInput(match.starts_at) : ''
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const label = playoffMatchLabel(match, rounds, allMatches);

  // Un creuament no es pot alimentar de si mateix.
  const otherMatches = allMatches.filter((m) => m.id !== match.id);

  async function save() {
    setBusy(true);
    setSaved(false);
    await onSave(match.id, {
      ...slotPayload(home, 'home'),
      ...slotPayload(away, 'away'),
      court_id: courtId || null,
      time,
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <article className="panel p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-display text-base uppercase tracking-wide text-violet-950">
          {label}
        </h4>
        <button
          type="button"
          onClick={() => onDelete(match)}
          className="btn-danger px-2.5 py-1 text-xs"
        >
          Treure
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SlotEditor
          title="Equip A"
          value={home}
          onChange={setHome}
          teams={teams}
          otherMatches={otherMatches}
          rounds={rounds}
          allMatches={allMatches}
        />
        <SlotEditor
          title="Equip B"
          value={away}
          onChange={setAway}
          teams={teams}
          otherMatches={otherMatches}
          rounds={rounds}
          allMatches={allMatches}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`court-${match.id}`}>
            Pista
          </label>
          <select
            id={`court-${match.id}`}
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="input"
          >
            <option value="">— Sense assignar —</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`time-${match.id}`}>
            Hora
          </label>
          <input
            id={`time-${match.id}`}
            type="time"
            step={300}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          {busy ? 'Desant…' : 'Desar creuament'}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-emerald-600">✓ Desat</span>
        )}
      </div>

      {playoffActive && (
        <PlayoffScore match={match} onScore={onScore} />
      )}
    </article>
  );
}

/** Marcador d'un creuament, només visible amb el play-off actiu. */
function PlayoffScore({
  match,
  onScore,
}: {
  match: PlayoffMatchWithNames;
  onScore: (
    match: PlayoffMatchWithNames,
    home: number,
    away: number,
    status: PlayoffMatch['status']
  ) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const homeName = match.resolved_home_team?.name ?? 'Equip A';
  const awayName = match.resolved_away_team?.name ?? 'Equip B';
  const ready = match.resolved_home_team_id && match.resolved_away_team_id;

  async function bump(side: 'home' | 'away', delta: number) {
    setBusy(true);
    const home = Math.max(0, match.home_score + (side === 'home' ? delta : 0));
    const away = Math.max(0, match.away_score + (side === 'away' ? delta : 0));
    await onScore(match, home, away, 'en_juego');
    setBusy(false);
  }

  async function finish() {
    if (match.home_score === match.away_score) {
      alert('En un play-off no pot quedar empatat: cal un guanyador.');
      return;
    }
    setBusy(true);
    await onScore(match, match.home_score, match.away_score, 'finalizado');
    setBusy(false);
  }

  return (
    <div className="mt-3 border-t border-violet-100 pt-3">
      {!ready ? (
        <p className="text-sm text-violet-500">
          Encara no se saben els dos equips d’aquest creuament.
        </p>
      ) : (
        <div className="space-y-2">
          {(['home', 'away'] as const).map((side) => (
            <div key={side} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-violet-950">
                {side === 'home' ? homeName : awayName}
              </span>
              <span className="w-9 text-right font-display text-2xl tabular-nums text-violet-950">
                {side === 'home' ? match.home_score : match.away_score}
              </span>
              {[1, 2, -1].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  disabled={busy || match.status === 'finalizado'}
                  onClick={() => bump(side, delta)}
                  className="btn-secondary px-2.5 py-1 text-xs"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            {match.status === 'finalizado' ? (
              <>
                <span className="rounded-sm bg-violet-900 px-2 py-1 font-display text-[11px] uppercase tracking-widest text-violet-100">
                  Finalitzat
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    onScore(match, match.home_score, match.away_score, 'en_juego')
                  }
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Reobrir
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={finish}
                className="btn-acid px-3 py-1.5 text-xs"
              >
                Finalitzar i passar el guanyador
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
