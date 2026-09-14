import { useState, useEffect, useRef } from 'react';

export function useSessionTimer(active: boolean): string {
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 60_000);
    return () => clearInterval(interval);
  }, [active]);

  const totalMinutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
