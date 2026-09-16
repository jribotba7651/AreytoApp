import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minimize2 } from 'lucide-react';
import pkg from '../package.json';
import TopTabs from '@/components/layout/TopTabs';
import ChapterTabContent from '@/components/layout/ChapterTabContent';
import BookTabContent from '@/components/layout/BookTabContent';
import FinishedTabContent from '@/components/layout/FinishedTabContent';
import SettingsTabContent from '@/components/settings/SettingsTabContent';
import StatsTabContent from '@/components/layout/StatsTabContent';
import EditorPanel from '@/components/panels/EditorPanel';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import CommandPalette from '@/components/command-palette/CommandPalette';
import GlobalSearch from '@/components/global-search/GlobalSearch';
import ChapterNotesSearch from '@/components/global-search/ChapterNotesSearch';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMenuEvents } from '@/hooks/useMenuEvents';
import { useSettingsPersistence } from '@/hooks/useSettingsPersistence';
import { useProjectWatcher } from '@/hooks/useProjectWatcher';
import { useReadingTracker } from '@/hooks/useReadingTracker';
import { readGlobalSettings, pathExists } from '@/lib/settings';
import { openProjectByPath } from '@/lib/open-project-flow';

function App() {
  const { t } = useTranslation();
  const activeTab = useLayoutStore((s) => s.activeTab);
  const focusMode = useLayoutStore((s) => s.focusMode);
  const toggleFocusMode = useLayoutStore((s) => s.toggleFocusMode);
  const showCommandPalette = useLayoutStore((s) => s.showCommandPalette);
  const showGlobalSearch = useLayoutStore((s) => s.showGlobalSearch);
  const showChapterNotesSearch = useLayoutStore((s) => s.showChapterNotesSearch);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    document.title = `Areyto ${pkg.version}`;
  }, []);

  useKeyboardShortcuts();
  useMenuEvents();
  useSettingsPersistence();
  useProjectWatcher();
  useReadingTracker();

  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    useSettingsStore.getState().load();
  }, []);

  useEffect(() => {
    if (themeMode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => {
    async function restoreSession() {
      try {
        const settings = await readGlobalSettings();

        if (settings.panels) {
          const { sidebar, editor, terminal, versions } = settings.panels;
          const partial: Record<string, number> = {};
          if (sidebar !== undefined) partial.sidebar = sidebar;
          if (editor !== undefined) partial.editor = editor;
          if (terminal !== undefined) partial.terminal = terminal;
          if (versions !== undefined) partial.versions = versions;
          if (Object.keys(partial).length > 0) {
            useLayoutStore.getState().setSizes(partial);
          }
        }

        if (
          settings.editorViewMode === 'edit' ||
          settings.editorViewMode === 'preview' ||
          settings.editorViewMode === 'split'
        ) {
          useLayoutStore.getState().setEditorViewMode(settings.editorViewMode);
        }

        if (settings.lastProjectPath) {
          const exists = await pathExists(settings.lastProjectPath);
          if (!exists) {
            setRestoreMessage(
              t('app.restoreError', { path: settings.lastProjectPath })
            );
          } else {
            await openProjectByPath(settings.lastProjectPath);
          }
        }
      } catch (err) {
        console.warn('Session restore failed:', err);
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, []);

  if (isRestoring) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <span className="text-sm text-text-primary">{t('common.loading')}</span>
      </div>
    );
  }

  if (!currentProject) {
    return <WelcomeScreen restoreMessage={restoreMessage} />;
  }

  if (focusMode) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
        <div className="relative flex-1 min-h-0">
          <EditorPanel />
          <button
            onClick={toggleFocusMode}
            title={`${t('shortcuts.focusMode')} (\u2318\u21e7D)`}
            className="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded bg-bg-secondary/80 border border-border-subtle text-text-tertiary hover:text-text-primary transition-colors duration-150"
          >
            <Minimize2 size={14} />
          </button>
         {showCommandPalette && <CommandPalette />}
         {showGlobalSearch && <GlobalSearch />}
         {showChapterNotesSearch && <ChapterNotesSearch />}
        </div>
      </div>
    );
  }


  return (
    <div id="app-shell" className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      <TopTabs />
      <main className="flex-1 min-h-0">
        {activeTab === 'capitulo' && <ChapterTabContent />}
        {activeTab === 'libro' && <BookTabContent />}
        {activeTab === 'terminados' && <FinishedTabContent />}
        {activeTab === 'ajustes' && <SettingsTabContent />}
        {activeTab === 'stats' && <StatsTabContent />}
      </main>
      {showCommandPalette && <CommandPalette />}
      {showGlobalSearch && <GlobalSearch />}
      {showChapterNotesSearch && <ChapterNotesSearch />}
    </div>
  );
}

export default App;
