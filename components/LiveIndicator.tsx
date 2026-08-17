export function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest ${
        live ? 'text-violet-700' : 'text-violet-300'
      }`}
      title={
        live
          ? 'Connectat: els marcadors s’actualitzen sols'
          : 'Sense connexió en directe. Recarrega la pàgina per veure els últims resultats.'
      }
    >
      <span
        className={`h-2 w-2 ${
          live ? 'animate-blink bg-acid-400' : 'bg-violet-200'
        }`}
      />
      {live ? 'En directe' : 'Reconnectant'}
    </span>
  );
}
