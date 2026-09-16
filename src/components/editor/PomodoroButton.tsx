import { Timer, Pause, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePomodoro } from '@/hooks/usePomodoro';
import { formatTime } from '@/lib/pomodoro';

function PomodoroButton() {
  const { t } = useTranslation();
  const { phase, remainingMs, toggle } = usePomodoro();

  const title = phase
    ? phase === 'work'
      ? `${t('editor.pomodoro.title')} - ${t('editor.pomodoro.work')}`
      : `${t('editor.pomodoro.title')} - ${t('editor.pomodoro.rest')}`
    : t('editor.pomodoro.title');

  const color = phase === 'work' ? 'text-accent' : phase === 'rest' ? 'text-success' : 'text-text-tertiary hover:text-text-primary';

  const icon = phase ? (phase === 'work' ? <Pause size={12} /> : <Play size={12} />) : <Timer size={12} />;

  return (
    <button
      onClick={toggle}
      title={title}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-150 ${color}`}
    >
      {icon}
      {phase && (
        <span className="text-[11px] tabular-nums text-text-tertiary">{formatTime(remainingMs)}</span>
      )}
    </button>
  );
}

export default PomodoroButton;
