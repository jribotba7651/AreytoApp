import { useState, useRef, useEffect } from 'react';
import type { Project } from '@/types/project';
import { createProject } from '@/lib/project-fs';
import { loadInitialChapter } from '@/lib/chapter-loader';
import { useProjectStore } from '@/stores/projectStore';

interface CreateProjectModalProps {
  folderPath: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

function CreateProjectModal({ folderPath, onClose, onCreated }: CreateProjectModalProps) {
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = nombre.trim().length > 0;

  async function handleCreate() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    const result = await createProject(folderPath, nombre.trim());

    if (!result.ok) {
      const { error: err } = result;
      if (err.kind === 'AlreadyExists') {
        setError('Ya existe un proyecto en esta carpeta.');
      } else if (err.kind === 'WriteFailed') {
        setError(`No se pudo crear el proyecto: ${err.reason}`);
      } else {
        setError('Error al crear el proyecto. Intenta de nuevo.');
      }
      setLoading(false);
      return;
    }

    const chapter = await loadInitialChapter(result.value);
    if (chapter.ok) {
      setActiveChapter(chapter.value.path, chapter.value.content);
    }

    onCreated(result.value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-sans font-medium text-text-primary mb-2">
          Crear proyecto
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Esta carpeta no tiene un proyecto. Puedes crear uno aquí.
        </p>

        <p className="font-mono text-xs text-text-tertiary mb-4 break-all leading-relaxed">
          {folderPath}
        </p>

        <input
          ref={inputRef}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nombre del proyecto"
          className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong mb-4"
        />

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
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateProjectModal;
