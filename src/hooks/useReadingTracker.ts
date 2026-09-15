import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';

const READING_TICK_MS = 10000;

export function useReadingTracker() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const editorViewMode = useLayoutStore((s) => s.editorViewMode);
  const currentProject = useProjectStore((s) => s.currentProject);

  const isReading = !!currentProject && (
    activeTab === 'libro' || editorViewMode === 'preview' || editorViewMode === 'split'
  );

  useEffect(() => {
    if (!isReading) return;
    const interval = setInterval(() => {
      void useSettingsStore.getState().addReadingSeconds(READING_TICK_MS / 1000);
    }, READING_TICK_MS);
    return () => clearInterval(interval);
  }, [isReading]);
}