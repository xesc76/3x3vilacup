import type { SupabaseClient } from '@supabase/supabase-js';
import { MATCH_SELECT, type Category, type MatchWithNames } from './types';

export type MatchFilters = {
  category?: Category | null;
  courtId?: string | null;
};

/**
 * Constructor de consulta compartit entre servidor i navegador, perquè el
 * refresc en viu torni exactament les mateixes files que la càrrega inicial.
 */
export function matchesQuery(
  supabase: SupabaseClient,
  { category, courtId }: MatchFilters = {}
) {
  let query = supabase
    .from('matches')
    .select(MATCH_SELECT)
    .order('starts_at', { ascending: true });

  if (category) query = query.eq('category', category);
  if (courtId) query = query.eq('court_id', courtId);

  return query;
}

export async function fetchMatches(
  supabase: SupabaseClient,
  filters: MatchFilters = {}
): Promise<MatchWithNames[]> {
  const { data, error } = await matchesQuery(supabase, filters);
  if (error) throw error;
  return (data ?? []) as unknown as MatchWithNames[];
}
