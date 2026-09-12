import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { FileText, FolderOpen } from 'lucide-react';
import { openProject } from '@/lib/project-fs';
import { setupProjectInStores, openProjectByPath } from '@/lib/open-project-flow';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import CreateProjectModal from './CreateProjectModal';
import ImportDocxModal from './ImportDocxModal';
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
  const recentProjects = useSettingsStore((s) => s.recentProjects);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [importDocxPath, setImportDocxPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleOpenRecent(path: string) {
    setError('');
    setLoading(true);
    const result = await openProjectByPath(path);
    if (!result.ok) {
      setError(t('welcome.errorOpen'));
    }
    setLoading(false);
  }

  function formatRelativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('welcome.lastEdited', { date: 'today' });
    if (days === 1) return t('welcome.lastEdited', { date: 'yesterday' });
    return t('welcome.lastEdited', { date: `${days}d ago` });
  }

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

  async function handleImportDocx() {
    setError('');
    try {
      const selected = await open({
        multiple: false,
        title: 'Selecciona un archivo .docx',
        filters: [{ name: 'Word', extensions: ['docx'] }],
      });
      if (selected && !Array.isArray(selected)) {
        setImportDocxPath(selected);
      }
    } catch {
      // User cancelled
    }
  }

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

      <button
        onClick={handleImportDocx}
        className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
      >
        <FileText size={14} />
        Importar de Word (.docx)
      </button>

      {recentProjects.length > 0 && (
        <div className="mt-6 w-full max-w-sm">
          <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2 px-1">
            {t('welcome.recentProjects')}
          </p>
          <ul className="flex flex-col gap-1">
            {recentProjects.map((rp) => (
              <li key={rp.path}>
                <button
                  onClick={() => handleOpenRecent(rp.path)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-bg-secondary transition-colors duration-150 disabled:opacity-40"
                >
                  <FolderOpen size={16} className="text-text-tertiary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{rp.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {formatRelativeDate(rp.lastOpened)}
                      {' · '}
                      {t('common.chapterCount', { count: rp.chapterCount })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {importDocxPath && (
        <ImportDocxModal
          docxPath={importDocxPath}
          onClose={() => setImportDocxPath(null)}
          onImported={() => setImportDocxPath(null)}
        />
      )}
    </div>
  );
}

export default WelcomeScreen;
