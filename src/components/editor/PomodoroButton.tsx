import { Timer, PauseCircle, Reset } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePomodoro } from '@/hooks/usePomodoro';
import { formatTime } from '@/lib/pomodoro';

function PomodoroButton() {
  const { t } = useTranslation();
  const { phase, remainingMs, toggle, stop } = usePomodoro();
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const title = phase
    ? phase === 'work'
      ? `${t('editor.pomodoro.title')} - ${t('editor.pomodoro.work')}`
      : `${t('editor.pomodoro.title')} - ${t('editor.pomodoro.rest')}`
    : t('editor.pomodoro.title');

  const color = phase === 'work' ? 'text-accent' : phase === 'rest' ? 'text-success' : 'text-text-tertiary hover:text-text-primary';

  const handlePause = () => {
    if (phase) {
      stop();
    }
  };

  const handleReset = () => {
    stop();
    setCyclesCompleted(0);
  };

  useEffect(() => {
    if (!phase) return;
    const interval = setInterval(() => {
      if (endTimeRef.current === null) return;
      const left = endTimeRef.current - Date.now();
      if (left <= 0) {
        playPomodoroBeep();
        if (phase === 'work') {
          setCyclesCompleted(prev => prev + 1);
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

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggle}
        title={title}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-150"
      >
        <Timer size={12} className={color} />
        {phase && (
          <span className="text-[11px] tabular-nums text-text-tertiary">{formatTime(remainingMs)}</span>
        )}
      </button>
      <button
        onClick={handlePause}
        title={t('editor.pomodoro.pause')}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-150"
      >
        <PauseCircle size={12} className="text-text-tertiary hover:text-text-primary" />
      </button>
      <button
        onClick={handleReset}
        title={t('editor.pomodoro.reset')}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-150"
      >
        <Reset size={12} className="text-text-tertiary hover:text-text-primary" />
      </button>
      <span className="text-[11px] tabular-nums text-text-tertiary">{t('editor.pomodoro.cyclesCompleted', { count: cyclesCompleted })}</span>
    </div>
  );
}

export default PomodoroButton;
