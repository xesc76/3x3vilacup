/**
 * Sense timeout, una petició a Supabase que no rep resposta (Wi-Fi del
 * pavelló que talla, incident puntual de Supabase...) es queda penjada amb
 * el temps d'espera per defecte del sistema operatiu, que pot ser molt
 * llarg. Amb això, com a molt s'espera 6 segons i es dona per fallida: la
 * pàgina pot mostrar l'estat buit o l'error en lloc de quedar-se en blanc.
 */
const TIMEOUT_MS = 6000;

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}
