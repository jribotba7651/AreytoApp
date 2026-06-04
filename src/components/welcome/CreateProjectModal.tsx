import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project } from '@/types/project';
import { createProject } from '@/lib/project-fs';
import { loadInitialChapter } from '@/lib/chapter-loader';
import { ensureGitInit } from '@/lib/versioning';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import { useProjectStore } from '@/stores/projectStore';

interface CreateProjectModalProps {
  folderPath: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

function CreateProjectModal({ folderPath, onClose, onCreated }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setChapters = useProjectStore((s) => s.setChapters);
  const setCommits = useProjectStore((s) => s.setCommits);
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
        setError(t('modal.createProject.errorAlreadyExists'));
      } else if (err.kind === 'WriteFailed') {
        setError(t('modal.createProject.errorWriteFailed', { reason: err.reason }));
      } else {
        setError(t('modal.createProject.errorGeneric'));
      }
      setLoading(false);
      return;
    }

    const chapter = await loadInitialChapter(result.value);
    if (chapter.ok) {
      setActiveChapter(chapter.value.activeChapter.path, chapter.value.activeChapter.content);
      setChapters(chapter.value.allChapters);

      const gitInit = await ensureGitInit(result.value.rootPath);
      if (!gitInit.ok) console.warn('Git init warning:', gitInit.error);

      const commitsResult = await loadCommitsForActiveChapter(
        result.value.rootPath,
        chapter.value.activeChapter.path
      );
      if (commitsResult.ok) setCommits(commitsResult.value);
    }

    onCreated(result.value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-sans font-medium text-text-primary mb-2">
          {t('modal.createProject.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('modal.createProject.description')}
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
          placeholder={t('modal.createProject.placeholder')}
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
            {t('modal.createProject.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="px-4 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? t('modal.createProject.creating') : t('modal.createProject.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateProjectModal;
