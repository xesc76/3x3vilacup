'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  ROUND_PRESETS,
  TOURNAMENT,
} from '@/lib/constants';
import { fromTimeInput } from '@/lib/format';
import {
  BRACKET_SIZES,
  generateBracket,
  type BracketSize,
} from '@/lib/bracketGenerator';
import {
  bracketByRound,
  propagateWinner,
  resolveGroupPositions,
} from '@/lib/playoff';
import type {
  Category,
  CategoryPlayoff,
  Court,
  MatchWithNames,
  PlayoffMatch,
  PlayoffMatchWithNames,
  PlayoffRound,
  Team,
} from '@/lib/types';
import { FilterChips } from '@/components/FilterChips';
import { ErrorNote } from './Feedback';
import { PlayoffMatchEditor } from './PlayoffMatchEditor';

export function PlayoffAdmin({
  rounds,
  playoffMatches,
  groupMatches,
  teams,
  courts,
  states,
}: {
  rounds: PlayoffRound[];
  playoffMatches: PlayoffMatchWithNames[];
  groupMatches: MatchWithNames[];
  teams: Team[];
  courts: Court[];
  states: CategoryPlayoff[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [category, setCategory] = useState<Category>(CATEGORIES[0].value);
  const [newRound, setNewRound] = useState<string>(ROUND_PRESETS[2]);
  const [bracketSize, setBracketSize] = useState<BracketSize>(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active =
    states.find((s) => s.category === category)?.active ?? false;

  const categoryRounds = rounds.filter((r) => r.category === category);
  const roundIds = new Set(categoryRounds.map((r) => r.id));
  const categoryMatches = playoffMatches.filter((m) => roundIds.has(m.round_id));
  const categoryTeams = teams.filter((t) => t.category === category);
  const bracket = bracketByRound(categoryRounds, categoryMatches);

  /**
   * Crea el quadre sencer d'un cop: rondes, creuaments i els enllaços de
   * "guanyador de". Substitueix el que hi hagi a la categoria.
   */
  async function autoGenerate() {
    const label = CATEGORY_LABEL[category];
    if (
      !confirm(
        `Generar el quadre de ${label} per als ${bracketSize} millors?\n\n` +
          (categoryRounds.length > 0
            ? 'AVÍS: s’esborrarà el quadre que ja hi ha en aquesta categoria.'
            : 'Després podràs ajustar hora i pista de cada creuament.')
      )
    )
      return;

    setBusy(true);
    setError(null);

    // Fora el quadre anterior (els creuaments cauen en cascada).
    if (categoryRounds.length > 0) {
      const { error } = await supabase
        .from('playoff_rounds')
        .delete()
        .in(
          'id',
          categoryRounds.map((r) => r.id)
        );
      if (error) {
        setBusy(false);
        return setError(error.message);
      }
    }

    const groups = Array.from(
      new Set(categoryTeams.map((t) => t.group_name ?? null))
    ).sort((a, b) => (a ?? '').localeCompare(b ?? '', 'ca'));

    const spec = generateBracket(groups, bracketSize);

    // Cal crear ronda a ronda per poder enllaçar els "guanyador de" amb els
    // identificadors reals dels creuaments ja creats.
    const createdMatchIds: string[][] = [];

    for (const [roundIndex, round] of spec.entries()) {
      const { data: roundRow, error: roundError } = await supabase
        .from('playoff_rounds')
        .insert({ category, name: round.name, sort_order: roundIndex })
        .select('id')
        .single();

      if (roundError || !roundRow) {
        setBusy(false);
        return setError(roundError?.message ?? 'No s’ha pogut crear la ronda.');
      }

      const rows = round.matches.map((m) => {
        const side = (slot: (typeof m)['home']) =>
          slot.source === 'group_position'
            ? {
                source: 'group_position' as const,
                group: slot.group,
                rank: slot.rank,
                from: null as string | null,
              }
            : {
                source: 'winner' as const,
                group: null,
                rank: null,
                from: createdMatchIds[slot.roundIndex]?.[slot.slot] ?? null,
              };

        const home = side(m.home);
        const away = side(m.away);

        return {
          round_id: roundRow.id,
          slot: m.slot,
          home_source: home.source,
          home_group: home.group,
          home_rank: home.rank,
          home_from_match: home.from,
          away_source: away.source,
          away_group: away.group,
          away_rank: away.rank,
          away_from_match: away.from,
        };
      });

      const { data: matchRows, error: matchError } = await supabase
        .from('playoff_matches')
        .insert(rows)
        .select('id, slot');

      if (matchError || !matchRows) {
        setBusy(false);
        return setError(
          matchError?.message ?? 'No s’han pogut crear els creuaments.'
        );
      }

      const ordered = [...matchRows].sort((a, b) => a.slot - b.slot);
      createdMatchIds[roundIndex] = ordered.map((r) => r.id);
    }

    setBusy(false);
    router.refresh();
  }

  async function addRound() {
    const name = newRound.trim();
    if (!name) return;

    setBusy(true);
    setError(null);
    const { error } = await supabase.from('playoff_rounds').insert({
      category,
      name,
      sort_order: categoryRounds.length,
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function deleteRound(round: PlayoffRound) {
    if (
      !confirm(
        `Esborrar «${round.name}»? També s’esborraran els seus creuaments.`
      )
    )
      return;

    const { error } = await supabase
      .from('playoff_rounds')
      .delete()
      .eq('id', round.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function addMatch(round: PlayoffRound) {
    const slot = categoryMatches.filter((m) => m.round_id === round.id).length;

    const { error } = await supabase.from('playoff_matches').insert({
      round_id: round.id,
      slot,
      home_source: 'group_position',
      away_source: 'group_position',
    });
    if (error) return setError(error.message);
    router.refresh();
  }

  async function saveMatch(id: string, payload: Record<string, unknown>) {
    const { time, ...rest } = payload as { time?: string };
    const starts_at = time ? fromTimeInput(time, TOURNAMENT.date) : null;

    const { error } = await supabase
      .from('playoff_matches')
      .update({ ...rest, starts_at })
      .eq('id', id);

    if (error) setError(error.message);
    else router.refresh();
  }

  async function deleteMatch(match: PlayoffMatchWithNames) {
    if (!confirm('Treure aquest creuament del quadre?')) return;

    const { error } = await supabase
      .from('playoff_matches')
      .delete()
      .eq('id', match.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  /**
   * Desa el marcador i, si el partit es dona per acabat, escriu el guanyador
   * als creuaments que en depenen. Si es reobre, els buida: si no, un canvi
   * d'última hora deixaria la ronda següent amb l'equip equivocat.
   */
  async function saveScore(
    match: PlayoffMatchWithNames,
    home: number,
    away: number,
    status: PlayoffMatch['status']
  ) {
    setError(null);

    const { error: scoreError } = await supabase
      .from('playoff_matches')
      .update({ home_score: home, away_score: away, status })
      .eq('id', match.id);

    if (scoreError) return setError(scoreError.message);

    const updated: PlayoffMatch = {
      ...match,
      home_score: home,
      away_score: away,
      status,
    };

    for (const step of propagateWinner(updated, categoryMatches)) {
      const column =
        step.side === 'home'
          ? 'resolved_home_team_id'
          : 'resolved_away_team_id';

      const { error } = await supabase
        .from('playoff_matches')
        .update({ [column]: step.teamId })
        .eq('id', step.matchId);

      if (error) return setError(error.message);
    }

    router.refresh();
  }

  async function activatePlayoff() {
    const label = CATEGORY_LABEL[category];
    if (
      !confirm(
        `Activar el play-off de ${label}?\n\nEs congelarà la fase de grups (no es podran tocar més els resultats) i els creuaments agafaran la classificació tal com està ara.`
      )
    )
      return;

    setBusy(true);
    setError(null);

    // 1. Resol els creuaments que depenen de la posició final de grup.
    const resolutions = resolveGroupPositions(
      groupMatches.filter((m) => m.category === category),
      categoryMatches
    );

    for (const step of resolutions) {
      const column =
        step.side === 'home'
          ? 'resolved_home_team_id'
          : 'resolved_away_team_id';

      const { error } = await supabase
        .from('playoff_matches')
        .update({ [column]: step.teamId })
        .eq('id', step.matchId);

      if (error) {
        setBusy(false);
        return setError(error.message);
      }
    }

    // 2. Congela la categoria. Es fa l'últim: si algun pas anterior falla,
    //    la fase de grups encara es pot editar i es pot tornar a provar.
    const { error } = await supabase
      .from('category_playoff')
      .update({ active: true, activated_at: new Date().toISOString() })
      .eq('category', category);

    setBusy(false);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function deactivatePlayoff() {
    const label = CATEGORY_LABEL[category];
    if (
      !confirm(
        `Tornar ${label} a fase de grups?\n\nS’esborraran els resultats dels partits d’eliminatòria i els equips assignats al quadre. Es podran tornar a editar els resultats de la fase de grups.`
      )
    )
      return;

    setBusy(true);
    setError(null);

    // Desfà tot el que va fer l'activació: equips resolts i marcadors.
    for (const match of categoryMatches) {
      const { error } = await supabase
        .from('playoff_matches')
        .update({
          resolved_home_team_id: null,
          resolved_away_team_id: null,
          home_score: 0,
          away_score: 0,
          status: 'programado',
        })
        .eq('id', match.id);

      if (error) {
        setBusy(false);
        return setError(error.message);
      }
    }

    const { error } = await supabase
      .from('category_playoff')
      .update({ active: false, activated_at: null })
      .eq('category', category);

    setBusy(false);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <FilterChips
        label="Categoria"
        value={category}
        onChange={(value) => value && setCategory(value)}
        options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
      />

      <div
        className={`border-l-4 px-4 py-3 ${
          active
            ? 'border-acid-400 bg-acid-50'
            : 'border-violet-200 bg-violet-50'
        }`}
      >
        <p className="font-display text-lg uppercase tracking-wide text-violet-950">
          {active ? 'Play-off actiu' : 'Fase de grups'}
        </p>
        <p className="mt-1 text-sm text-violet-600">
          {active
            ? 'Els resultats de la fase de grups estan congelats. Els creuaments ja tenen equip assignat.'
            : 'Munta el quadre ara. Quan la fase de grups s’acabi, activa el play-off i els equips s’ompliran sols segons la classificació.'}
        </p>

        <div className="mt-3">
          {active ? (
            <button
              type="button"
              onClick={deactivatePlayoff}
              disabled={busy}
              className="btn-secondary"
            >
              Tornar a fase de grups
            </button>
          ) : (
            <button
              type="button"
              onClick={activatePlayoff}
              disabled={busy || categoryMatches.length === 0}
              className="btn-acid"
            >
              Activar play-off
            </button>
          )}
        </div>

        {!active && categoryMatches.length === 0 && (
          <p className="mt-2 text-xs text-violet-500">
            Primer crea alguna ronda i algun creuament.
          </p>
        )}
      </div>

      <ErrorNote error={error} />

      {!active && (
        <div className="panel border-l-4 border-l-acid-400 p-3.5">
          <p className="font-display text-lg uppercase tracking-wide text-violet-950">
            Generar el quadre automàticament
          </p>
          <p className="mb-3 mt-1 text-sm text-violet-600">
            Tria quants equips passen i es crea tot el quadre fet: rondes,
            creuaments i els enllaços de «guanyador de». Els emparellaments
            surten estàndard (1r contra últim) i, si hi ha més d’un grup, ja
            van creuats.
          </p>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label" htmlFor="bracket-size">
                Equips que passen
              </label>
              <select
                id="bracket-size"
                value={bracketSize}
                onChange={(e) =>
                  setBracketSize(Number(e.target.value) as BracketSize)
                }
                className="input"
              >
                {BRACKET_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} equips
                    {size > categoryTeams.length ? ' (no n’hi ha prou)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={autoGenerate}
              disabled={busy || categoryTeams.length < 2}
              className="btn-acid"
            >
              {busy ? 'Generant…' : 'Generar quadre'}
            </button>
          </div>

          <p className="mt-2 text-xs text-violet-500">
            {categoryTeams.length} equips a {CATEGORY_LABEL[category]}
            {categoryRounds.length > 0 &&
              ' · generar-lo de nou substituirà el quadre actual'}
          </p>
        </div>
      )}

      {!active && (
        <div className="panel p-3.5">
          <p className="label">O crear una ronda a mà</p>
          <div className="flex flex-wrap gap-2">
            <input
              list="round-presets"
              value={newRound}
              onChange={(e) => setNewRound(e.target.value)}
              placeholder="Quarts de final"
              className="input flex-1"
            />
            <datalist id="round-presets">
              {ROUND_PRESETS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={addRound}
              disabled={busy}
              className="btn-primary"
            >
              Afegir ronda
            </button>
          </div>
        </div>
      )}

      {bracket.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-violet-500">
          Encara no hi ha cap ronda a {CATEGORY_LABEL[category]}.
        </p>
      ) : (
        <div className="space-y-6">
          {bracket.map(({ round, matches }) => (
            <section key={round.id}>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h3 className="eyebrow">
                  <span className="h-3 w-1 bg-violet-200" />
                  {round.name}
                </h3>
                {!active && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addMatch(round)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      + Creuament
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRound(round)}
                      className="btn-danger px-3 py-1.5 text-xs"
                    >
                      Esborrar ronda
                    </button>
                  </div>
                )}
              </div>

              {matches.length === 0 ? (
                <p className="panel p-5 text-center text-sm text-violet-500">
                  Cap creuament en aquesta ronda.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <PlayoffMatchEditor
                      key={match.id}
                      match={match}
                      rounds={categoryRounds}
                      allMatches={categoryMatches}
                      teams={categoryTeams}
                      courts={courts}
                      playoffActive={active}
                      onSave={saveMatch}
                      onDelete={deleteMatch}
                      onScore={saveScore}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
