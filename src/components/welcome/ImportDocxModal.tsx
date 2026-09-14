import { useState, useRef, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { importDocxToNewProject } from '@/lib/import-docx-flow';

interface ImportDocxModalProps {
  docxPath: string;
  onClose: () => void;
  onImported: () => void;
}

function ImportDocxModal({ docxPath, onClose, onImported }: ImportDocxModalProps) {
  const defaultName = docxPath.split('/').pop()?.replace(/\.docx$/i, '') ?? 'importado';
  const [nombre, setNombre] = useState(defaultName);
  const [parentDir, setParentDir] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = nombre.trim().length > 0 && parentDir.length > 0;

  async function handlePickFolder() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Selecciona la carpeta donde crear el proyecto',
      });
      if (selected && !Array.isArray(selected)) {
        setParentDir(selected);
      }
    } catch {
      // User cancelled
    }
  }

  async function handleImport() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    const result = await importDocxToNewProject({
      docxPath,
      parentDir,
      projectName: nombre.trim(),
    });

    if (result.ok) {
      onImported();
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleImport();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-sans font-medium text-text-primary mb-2">
          Importar de Word
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Se creará un proyecto nuevo con los capítulos del documento.
        </p>

        <p className="font-mono text-xs text-text-tertiary mb-4 break-all leading-relaxed">
          {docxPath.split('/').pop()}
        </p>

        <label className="block text-xs text-text-secondary mb-1">Nombre del proyecto</label>
        <input
          ref={inputRef}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nombre del proyecto"
          className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong mb-4"
        />

        <label className="block text-xs text-text-secondary mb-1">Carpeta destino</label>
        <button
          onClick={handlePickFolder}
          className="w-full text-left bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors duration-150 mb-1"
        >
          {parentDir || 'Seleccionar carpeta…'}
        </button>
        {parentDir && (
          <p className="font-mono text-xs text-text-tertiary mb-4 break-all leading-relaxed">
            {parentDir}/{nombre.trim()}
          </p>
        )}
        {!parentDir && <div className="mb-4" />}

        {error && (
          <p className="text-xs text-error mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!isValid || loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportDocxModal;
