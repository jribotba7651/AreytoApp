import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const setTriggerOpenProject = useProjectStore((s) => s.setTriggerOpenProject);
  const setTriggerNewProject = useProjectStore((s) => s.setTriggerNewProject);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
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
        title: t('welcome.dialogTitle'),
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
        setError(t('welcome.errorLoad'));
      }
      setLoading(false);
      return;
    }

    if (result.error.kind === 'NotAProject') {
      setPendingPath(path);
      setLoading(false);
      return;
    }

    setError(t('welcome.errorOpen'));
    setLoading(false);
  }, [t]);

  const handleNew = useCallback(() => {
    setError('');
    setShowNewProjectModal(true);
  }, []);

  useEffect(() => {
    setTriggerOpenProject(handleOpen);
    return () => setTriggerOpenProject(null);
  }, [handleOpen, setTriggerOpenProject]);

  useEffect(() => {
    setTriggerNewProject(handleNew);
    return () => setTriggerNewProject(null);
  }, [handleNew, setTriggerNewProject]);

  // Fire pending action set by useMenuEvents when a project was open at the time of the event
  useEffect(() => {
    const store = useProjectStore.getState();
    if (store.pendingMenuAction === 'open') {
      store.setPendingMenuAction(null);
      handleOpen();
    } else if (store.pendingMenuAction === 'new') {
      store.setPendingMenuAction(null);
      handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(project: Project) {
    setPendingPath(null);
    setCurrentProject(project);
  }

  function handleNewCreated(project: Project) {
    setShowNewProjectModal(false);
    setCurrentProject(project);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-primary gap-3">
      <h1 className="font-serif text-4xl text-text-primary tracking-tight">
        Areyto
      </h1>
      <p className="text-sm text-text-secondary">
        {t('welcome.tagline')}
      </p>

      {restoreMessage && (
        <p className="text-sm text-text-secondary mt-1 max-w-sm text-center">
          {restoreMessage}{t('welcome.restoreMessageSuffix')}
        </p>
      )}

      <div className="mt-6 relative">
        <button
          onClick={handleOpen}
          disabled={loading}
          className="px-5 py-2 text-sm bg-accent-muted text-text-primary rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {loading ? t('welcome.opening') : t('welcome.openProject')}
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

      {showNewProjectModal && (
        <CreateProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={handleNewCreated}
        />
      )}
    </div>
  );
}

export default WelcomeScreen;
