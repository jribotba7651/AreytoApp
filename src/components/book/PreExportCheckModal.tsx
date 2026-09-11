import { useTranslation } from 'react-i18next';

interface PreExportCheckModalProps {
  problems: string[];
  onContinue: () => void;
  onCancel: () => void;
}

function PreExportCheckModal({ problems, onContinue, onCancel }: PreExportCheckModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-medium text-text-primary mb-1">
          {t('modal.preExportCheck.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('modal.preExportCheck.description')}
        </p>

        <ul className="space-y-2 mb-6">
          {problems.map((problem) => (
            <li key={problem} className="flex items-start gap-2 text-sm text-warning">
              <span className="shrink-0 mt-0.5">&#x26A0;</span>
              <span>{problem}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            {t('modal.preExportCheck.cancel')}
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent transition-colors duration-150"
          >
            {t('modal.preExportCheck.continueAnyway')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreExportCheckModal;
