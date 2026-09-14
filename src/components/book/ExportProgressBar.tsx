import { useTranslation } from 'react-i18next';

type ExportStep = 'assembling' | 'writing' | 'backup' | 'done';

interface ExportProgressBarProps {
  step: ExportStep;
}

const STEPS: ExportStep[] = ['assembling', 'writing', 'backup', 'done'];

const STEP_KEYS: Record<ExportStep, string> = {
  assembling: 'book.export.progressAssembling',
  writing: 'book.export.progressWriting',
  backup: 'book.export.progressBackup',
  done: 'book.export.progressDone',
};

function ExportProgressBar({ step }: ExportProgressBarProps) {
  const { t } = useTranslation();
  const currentIdx = STEPS.indexOf(step);
  const percent = step === 'done' ? 100 : ((currentIdx + 0.5) / STEPS.length) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-80">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          {t('book.export.progressTitle')}
        </h3>
        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary">{t(STEP_KEYS[step])}</p>
      </div>
    </div>
  );
}

export default ExportProgressBar;
export type { ExportStep };
