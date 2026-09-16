import { useCallback, useEffect, useRef, useState } from 'react';
import { AMBIENT_SOUNDS, AMBIENT_DEFAULT_VOLUME, type AmbientSoundId } from '@/lib/ambient-sound';

export function useAmbientSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<AmbientSoundId | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveId(null);
  }, []);

  const play = useCallback(
    (id: AmbientSoundId, volume: number) => {
      const sound = AMBIENT_SOUNDS.find((s) => s.id === id);
      if (!sound) return;
      stop();
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = volume;
      audio.play().catch((err) => {
        console.error('Failed to play ambient sound:', err);
        setActiveId(null);
      });
      audioRef.current = audio;
      setActiveId(id);
    },
    [stop]
  );

  const toggle = useCallback(
    (id: AmbientSoundId) => {
      if (activeId === id) stop();
      else play(id, AMBIENT_DEFAULT_VOLUME);
    },
    [activeId, play, stop]
  );

  useEffect(() => stop, [stop]);

  return { activeId, toggle, stop };
}
