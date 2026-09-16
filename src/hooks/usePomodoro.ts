import { useCallback, useEffect, useRef, useState } from 'react';
import { WORK_DURATION_MS, REST_DURATION_MS, playPomodoroBeep } from '@/lib/pomodoro';

export type PomodoroPhase = 'work' | 'rest';

export function usePomodoro() {
  const [phase, setPhase] = useState<PomodoroPhase | null>(null);
  const [remainingMs, setRemainingMs] = useState(WORK_DURATION_MS);
  const endTimeRef = useRef<number | null>(null);

  const start = useCallback((nextPhase: PomodoroPhase, duration: number) => {
    endTimeRef.current = Date.now() + duration;
    setPhase(nextPhase);
    setRemainingMs(duration);
  }, []);

  const stop = useCallback(() => {
    endTimeRef.current = null;
    setPhase(null);
    setRemainingMs(WORK_DURATION_MS);
  }, []);

  const toggle = useCallback(() => {
    if (phase) {
      stop();
    } else {
      start('work', WORK_DURATION_MS);
    }
  }, [phase, start, stop]);

  useEffect(() => {
    if (!phase) return;
    const interval = setInterval(() => {
      if (endTimeRef.current === null) return;
      const left = endTimeRef.current - Date.now();
      if (left <= 0) {
        playPomodoroBeep();
        if (phase === 'work') {
          start('rest', REST_DURATION_MS);
        } else {
          stop();
        }
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, start, stop]);

  return { phase, remainingMs, toggle, stop };
}
