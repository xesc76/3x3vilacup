export function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        live ? 'text-emerald-600' : 'text-slate-400'
      }`}
      title={
        live
          ? 'Connectat: els marcadors s’actualitzen sols'
          : 'Sense connexió en directe. Recarrega la pàgina per veure els últims resultats.'
      }
    >
      <span
        className={`h-2 w-2 rounded-full ${
          live ? 'animate-pulse-dot bg-emerald-500' : 'bg-slate-300'
        }`}
      />
      {live ? 'En directe' : 'Reconnectant…'}
    </span>
  );
}
