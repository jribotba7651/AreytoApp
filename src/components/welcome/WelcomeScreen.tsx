import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { openProject } from '@/lib/project-fs';
import { loadInitialChapter } from '@/lib/chapter-loader';
import { ensureGitInit } from '@/lib/versioning';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import { useProjectStore } from '@/stores/projectStore';
import CreateProjectModal from './CreateProjectModal';
import type { Project } from '@/types/project';

function WelcomeScreen() {
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setChapters = useProjectStore((s) => s.setChapters);
  const setCommits = useProjectStore((s) => s.setCommits);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setError('');
    setLoading(true);

    let selected: string | string[] | null;
    try {
      selected = await open({ directory: true, multiple: false, title: 'Selecciona la carpeta del proyecto' });
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
      const chapter = await loadInitialChapter(result.value);
      if (!chapter.ok) {
        setError('No se pudo cargar el capítulo activo.');
        setLoading(false);
        return;
      }
      setActiveChapter(chapter.value.activeChapter.path, chapter.value.activeChapter.content);
      setChapters(chapter.value.allChapters);
      setCurrentProject(result.value);

      const gitInit = await ensureGitInit(result.value.rootPath);
      if (!gitInit.ok) console.warn('Git init warning:', gitInit.error);

      const commitsResult = await loadCommitsForActiveChapter(
        result.value.rootPath,
        chapter.value.activeChapter.path
      );
      if (commitsResult.ok) setCommits(commitsResult.value);
      return;
    }

    if (result.error.kind === 'NotAProject') {
      setPendingPath(path);
      setLoading(false);
      return;
    }

    setError('No se pudo abrir el proyecto. Intenta de nuevo.');
    setLoading(false);
  }

  function handleCreated(project: Project) {
    setPendingPath(null);
    setCurrentProject(project);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-primary gap-3">
      <h1 className="font-serif text-4xl text-text-primary tracking-tight">
        Writers Den
      </h1>
      <p className="text-sm text-text-secondary">
        Editor de escritura por capítulos
      </p>

      <div className="mt-6">
        <button
          onClick={handleOpen}
          disabled={loading}
          className="px-5 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {loading ? 'Abriendo…' : 'Abrir proyecto'}
        </button>
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
