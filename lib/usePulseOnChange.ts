'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Retorna `true` durant `duration` ms just després que `value` canviï.
 * Pensat per disparar una animació breu (flaix, escala) quan arriba un
 * marcador nou per Realtime, sense dependre de cap llibreria d'animació.
 */
export function usePulseOnChange<T>(value: T, duration = 700) {
  const prev = useRef(value);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), duration);
    return () => clearTimeout(timer);
  }, [value, duration]);

  return pulsing;
}
