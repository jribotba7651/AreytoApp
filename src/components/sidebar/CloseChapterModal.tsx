import { useState, useEffect } from 'react';
import type { Chapter, Project } from '@/types/project';
import type { ConflictInfo } from '@/lib/close-chapter-flow';
import { checkCloseConflict, performCloseChapter } from '@/lib/close-chapter-flow';
import { loadClosedChapters } from '@/lib/closed-chapters-loader';
import { readChapter, updateProjectMeta } from '@/lib/project-fs';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import { useProjectStore } from '@/stores/projectStore';

interface CloseChapterModalProps {
  chapter: Chapter;
  project: Project;
  onClose: () => void;
}

function CloseChapterModal({ chapter, project, onClose }: CloseChapterModalProps) {
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const store = useProjectStore;

  useEffect(() => {
    checkCloseConflict(project.rootPath, chapter.filename).then(setConflictInfo);
  }, [project.rootPath, chapter.filename]);

  async function handleConfirm() {
    if (!conflictInfo) return;
    setLoading(true);
    setError('');

    const result = await performCloseChapter(
      project,
      chapter,
      conflictInfo.baseTagExists ? { explicitTagName: conflictInfo.suggestedTagName } : undefined
    );

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const state = store.getState();

    // Remove closed chapter from sidebar list
    const remaining = state.chapters.filter((c) => c.path !== chapter.path);
    state.setChapters(remaining);

    // Update proyecto.json if this was the active chapter
    if (state.activeChapterPath === chapter.path) {
      if (remaining.length > 0) {
        const next = remaining[0]!;
        const read = await readChapter(next.path);
        if (read.ok) {
          state.setActiveChapter(next.path, read.value);
          await updateProjectMeta(project, { capituloActivo: next.filename });
          const commits = await loadCommitsForActiveChapter(project.rootPath, next.path);
          if (commits.ok) state.setCommits(commits.value);
        }
      } else {
        state.clearActiveChapter();
        await updateProjectMeta(project, { capituloActivo: null });
      }
    }

    // Refresh closed chapters list
    const closed = await loadClosedChapters(project);
    if (closed.ok) state.setClosedChapters(closed.value);

    setLoading(false);
    onClose();
  }

  const checking = conflictInfo === null;
  const hasConflict = conflictInfo?.baseTagExists === true;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-2">
          Cerrar capítulo
        </h2>

        {checking ? (
          <p className="text-sm text-text-tertiary mb-4">Verificando…</p>
        ) : hasConflict ? (
          <p className="text-sm text-text-secondary mb-4">
            Este capítulo ya fue cerrado antes. El tag{' '}
            <code className="text-xs text-text-tertiary">{conflictInfo!.baseTagName}</code> existe
            en el historial. Vas a crear un nuevo tag{' '}
            <code className="text-xs text-text-tertiary">{conflictInfo!.suggestedTagName}</code> que
            marcará este nuevo momento como terminado. Los tags anteriores quedan como marcas históricas.
          </p>
        ) : (
          <p className="text-sm text-text-secondary mb-4">
            Vas a marcar <strong className="text-text-primary">{chapter.title}</strong> como terminado.
            El archivo se moverá a Terminados y quedará marcado con un tag de git.
          </p>
        )}

        {error && <p className="text-xs text-error mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || checking}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading
              ? 'Cerrando…'
              : hasConflict
              ? `Crear ${conflictInfo!.suggestedTagName}`
              : 'Cerrar capítulo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CloseChapterModal;
