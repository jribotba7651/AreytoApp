import { useState } from 'react';
import type { ExportScope } from '@/lib/export-service';

interface ExportBookDocxDialogProps {
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  loading: boolean;
}

const OPTIONS: { value: ExportScope; label: string }[] = [
  { value: 'ambos', label: 'Ambos (terminados + en progreso)' },
  { value: 'terminados', label: 'Solo terminados' },
  { value: 'en-progreso', label: 'Solo en progreso' },
];

function ExportBookDocxDialog({ onClose, onExport, loading }: ExportBookDocxDialogProps) {
  const [scope, setScope] = useState<ExportScope>('ambos');

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-medium text-text-primary mb-1">Exportar a Word</h2>
        <p className="text-sm text-text-secondary mb-4">
          Elige qué capítulos incluir en el archivo .docx exportado vía pandoc.
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
            Cancelar
          </button>
          <button
            onClick={() => onExport(scope)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Exportando…' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportBookDocxDialog;
