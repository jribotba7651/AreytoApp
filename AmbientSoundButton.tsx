import { useEffect, useRef, useState } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { AMBIENT_SOUNDS } from '@/lib/ambient-sound';

function AmbientSoundButton() {
  const { t } = useTranslation();
  const { activeId, toggle, stop } = useAmbientSound();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(AMBIENT_DEFAULT_VOLUME * 100);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (activeId) {
      play(activeId, newVolume / 100);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        title={t('editor.ambient.title')}
        className={[
          'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-150',
          activeId ? 'text-accent' : 'text-text-tertiary hover:text-text-primary',
        ].join(' ')}
      >
        <Music size={12} />
      </button>

      {open && (
        <div className="absolute bottom-6 right-0 w-44 bg-bg-tertiary border border-border-default rounded-md p-1 z-50">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full mb-2"
          />
          {AMBIENT_SOUNDS.map((sound) => {
            const active = activeId === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => toggle(sound.id)}
                className={[
                  'w-full flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] rounded transition-colors duration-150',
                  active ? 'text-accent' : 'text-text-primary hover:bg-bg-secondary',
                ].join(' ')}
              >
                <span>{t(sound.labelKey)}</span>
                {active && <Volume2 size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AmbientSoundButton;
