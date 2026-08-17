/**
 * El torneig és presencial a Vilafranca: sempre volem mostrar l'hora local
 * de Catalunya, encara que el mòbil de qui mira estigui en un altre fus.
 */
const TIME_ZONE = 'Europe/Madrid';

const timeFmt = new Intl.DateTimeFormat('ca-ES', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

const dayFmt = new Intl.DateTimeFormat('ca-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: TIME_ZONE,
});

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function formatDay(iso: string) {
  return dayFmt.format(new Date(iso));
}

/** ISO -> valor per a un <input type="datetime-local"> en hora de Vilafranca. */
export function toDatetimeLocal(iso: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}

/** Valor d'un <input type="datetime-local"> -> ISO UTC, interpretant-lo com a hora de Vilafranca. */
export function fromDatetimeLocal(value: string) {
  // Provem el desfasament d'estiu i el d'hivern i ens quedem amb el que
  // torna a produir el mateix text un cop formatat en hora local.
  for (const offset of ['+02:00', '+01:00']) {
    const candidate = new Date(`${value}:00${offset}`);
    if (toDatetimeLocal(candidate.toISOString()) === value) {
      return candidate.toISOString();
    }
  }
  return new Date(value).toISOString();
}
