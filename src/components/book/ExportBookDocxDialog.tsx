import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExportScope } from '@/lib/export-service';

interface ExportBookDocxDialogProps {
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  loading: boolean;
}

function ExportBookDocxDialog({ onClose, onExport, loading }: ExportBookDocxDialogProps) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<ExportScope>('ambos');

  const OPTIONS: { value: ExportScope; label: string }[] = [
    { value: 'ambos', label: t('modal.exportScope.both') },
    { value: 'terminados', label: t('modal.exportScope.finished') },
    { value: 'en-progreso', label: t('modal.exportScope.inProgress') },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-medium text-text-primary mb-1">
          {t('modal.exportDocx.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('modal.exportDocx.description')}
        </p>

        <div className="space-y-2 mb-6">
          {OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="export-docx-scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="accent-accent"
              />
              <span className="text-sm text-text-primary">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors duration-150"
          >
            {t('modal.exportDocx.cancel')}
          </button>
          <button
            onClick={() => onExport(scope)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? t('modal.exportDocx.exporting') : t('modal.exportDocx.export')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportBookDocxDialog;
