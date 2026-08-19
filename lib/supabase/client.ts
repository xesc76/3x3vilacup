'use client';

import { createBrowserClient } from '@supabase/ssr';
import { fetchWithTimeout } from './fetchWithTimeout';

/**
 * Client de Supabase per al navegador (components 'use client').
 * Fa servir la clau pública anon: només pot fer el que permetin les RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: fetchWithTimeout } }
  );
}
