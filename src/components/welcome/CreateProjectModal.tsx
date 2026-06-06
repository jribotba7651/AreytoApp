import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import type { Project } from '@/types/project';
import { createProject, createProjectInNewFolder } from '@/lib/project-fs';
import { loadInitialChapter } from '@/lib/chapter-loader';
import { ensureGitInit } from '@/lib/versioning';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import { useProjectStore } from '@/stores/projectStore';

interface CreateProjectModalProps {
  folderPath?: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

function CreateProjectModal({ folderPath, onClose, onCreated }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setChapters = useProjectStore((s) => s.setChapters);
  const setCommits = useProjectStore((s) => s.setCommits);
  const [nombre, setNombre] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isNewMode = folderPath === undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = nombre.trim().length > 0 && (!isNewMode || parentPath !== null);

  async function handleChooseLocation() {
    let selected: string | string[] | null;
    try {
      selected = await open({
        directory: true,
        multiple: false,
        title: t('modal.createProject.chooseLocation'),
      });
    } catch {
      return;
    }
    if (selected && !Array.isArray(selected)) {
      setParentPath(selected);
      setError('');
    }
  }

  async function handleCreate() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    const result = isNewMode
      ? await createProjectInNewFolder(parentPath!, nombre.trim())
      : await createProject(folderPath!, nombre.trim());

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
          {isNewMode
            ? t('modal.createProject.descriptionNew')
            : t('modal.createProject.description')}
        </p>

        {isNewMode ? (
          <div className="mb-4">
            <p className="text-xs text-text-tertiary mb-1">{t('modal.createProject.locationLabel')}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleChooseLocation}
                className="px-3 py-1.5 text-xs bg-bg-secondary border border-border-default rounded hover:border-border-strong transition-colors duration-150 text-text-secondary hover:text-text-primary"
              >
                {t('modal.createProject.chooseLocation')}
              </button>
              <span className="font-mono text-xs text-text-tertiary truncate">
                {parentPath ?? t('modal.createProject.noLocationSelected')}
              </span>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-text-tertiary mb-4 break-all leading-relaxed">
            {folderPath}
          </p>
        )}

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
