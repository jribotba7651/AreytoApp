import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { openProject } from '@/lib/project-fs';
import { setupProjectInStores } from '@/lib/open-project-flow';
import { useProjectStore } from '@/stores/projectStore';
import CreateProjectModal from './CreateProjectModal';
import ShortcutHint from '@/components/shared/ShortcutHint';
import type { Project } from '@/types/project';

interface WelcomeScreenProps {
  restoreMessage?: string | null;
}

function WelcomeScreen({ restoreMessage }: WelcomeScreenProps) {
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setTriggerOpenProject = useProjectStore((s) => s.setTriggerOpenProject);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(async () => {
    setError('');
    setLoading(true);

    let selected: string | string[] | null;
    try {
      selected = await open({
        directory: true,
        multiple: false,
        title: 'Selecciona la carpeta del proyecto',
      });
    } catch {
      setLoading(false);
      return;
    }

    if (!selected || Array.isArray(selected)) {
      setLoading(false);
      return;
    }

    const path = selected;
    const result = await openProject(path);

    if (result.ok) {
      try {
        await setupProjectInStores(result.value);
      } catch {
        setError('No se pudo cargar el capítulo activo.');
      }
      setLoading(false);
      return;
    }

    if (result.error.kind === 'NotAProject') {
      setPendingPath(path);
      setLoading(false);
      return;
    }

    setError('No se pudo abrir el proyecto. Intenta de nuevo.');
    setLoading(false);
  }, []);

  useEffect(() => {
    setTriggerOpenProject(handleOpen);
    return () => setTriggerOpenProject(null);
  }, [handleOpen, setTriggerOpenProject]);

  function handleCreated(project: Project) {
    setPendingPath(null);
    setCurrentProject(project);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-primary gap-3">
      <h1 className="font-serif text-4xl text-text-primary tracking-tight">
        Areyto
      </h1>
      <p className="text-sm text-text-secondary">
        Editor de escritura por capítulos
      </p>

      {restoreMessage && (
        <p className="text-sm text-text-secondary mt-1 max-w-sm text-center">
          {restoreMessage}. Selecciona uno nuevo abajo.
        </p>
      )}

      <div className="mt-6 relative">
        <button
          onClick={handleOpen}
          disabled={loading}
          className="px-5 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {loading ? 'Abriendo…' : 'Abrir proyecto'}
        </button>
        <div className="absolute top-1/2 left-full -translate-y-1/2 pl-2">
          <ShortcutHint text="⌘⇧O" />
        </div>
      </div>

      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}

      {pendingPath && (
        <CreateProjectModal
          folderPath={pendingPath}
          onClose={() => { setPendingPath(null); setLoading(false); }}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default WelcomeScreen;
