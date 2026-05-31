import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { writeGlobalSettings, writeProjectState } from '@/lib/settings';
import type { GlobalSettings } from '@/lib/settings';

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let id: ReturnType<typeof setTimeout> | null = null;
  return (...args: T) => {
    if (id !== null) clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

export function useSettingsPersistence() {
  const currentProjectPath = useProjectStore((s) => s.currentProject?.rootPath);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const sidebarSize = useLayoutStore((s) => s.sizes.sidebar);
  const editorSize = useLayoutStore((s) => s.sizes.editor);
  const terminalSize = useLayoutStore((s) => s.sizes.terminal);
  const versionsSize = useLayoutStore((s) => s.sizes.versions);
  const editorViewMode = useLayoutStore((s) => s.editorViewMode);
  const autoCommit = useSettingsStore((s) => s.autoCommit);
  const autosaveIntervalMs = useSettingsStore((s) => s.autosaveIntervalMs);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const editorFontFamily = useSettingsStore((s) => s.editorFontFamily);
  const editorFontSize = useSettingsStore((s) => s.editorFontSize);
  const defaultProjectLanguage = useSettingsStore((s) => s.defaultProjectLanguage);
  const bookFontFamily = useSettingsStore((s) => s.bookFontFamily);
  const bookFontSize = useSettingsStore((s) => s.bookFontSize);

  const persistGlobal = useRef(
    debounce((settings: GlobalSettings) => {
      writeGlobalSettings(settings).catch((err) =>
        console.warn('Failed to persist global settings:', err)
      );
    }, 300)
  ).current;

  const persistProject = useRef(
    debounce((projectPath: string, relativeChapterPath: string) => {
      writeProjectState(projectPath, {
        lastActiveChapterPath: relativeChapterPath,
        version: 1,
      }).catch((err) => console.warn('Failed to persist project state:', err));
    }, 300)
  ).current;

  useEffect(() => {
    persistGlobal({
      lastProjectPath: currentProjectPath,
      panels: {
        sidebar: sidebarSize,
        editor: editorSize,
        terminal: terminalSize,
        versions: versionsSize,
      },
      editorViewMode,
      autoCommit,
      autosaveIntervalMs,
      themeMode,
      editorFontFamily,
      editorFontSize,
      defaultProjectLanguage,
      bookFontFamily,
      bookFontSize,
      version: 1,
    });
  }, [currentProjectPath, sidebarSize, editorSize, terminalSize, versionsSize, editorViewMode, autoCommit, autosaveIntervalMs, themeMode, editorFontFamily, editorFontSize, defaultProjectLanguage, bookFontFamily, bookFontSize]);

  useEffect(() => {
    if (!currentProjectPath || !activeChapterPath) return;
    const relative = activeChapterPath.startsWith(currentProjectPath + '/')
      ? activeChapterPath.slice(currentProjectPath.length + 1)
      : activeChapterPath;
    persistProject(currentProjectPath, relative);
  }, [currentProjectPath, activeChapterPath]);
}
