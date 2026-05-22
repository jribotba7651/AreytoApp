import { useEffect } from 'react';
import { SHORTCUTS, matchShortcut } from '@/lib/keyboard-shortcuts';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { createChapter, updateProjectMeta, readChapter } from '@/lib/project-fs';
import { refreshChapters } from '@/lib/refresh-chapters';

export function useKeyboardShortcuts() {
  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const layout = useLayoutStore.getState();
      const project = useProjectStore.getState();

      // Cmd+S: always-on, even with modal open
      if (matchShortcut(e, SHORTCUTS.SAVE)) {
        e.preventDefault();
        await project.flushAutosave?.();
        return;
      }

      // All other shortcuts blocked when modal is open
      if (layout.showCloseChapterModal) return;

      if (!project.currentProject) {
        if (matchShortcut(e, SHORTCUTS.OPEN_PROJECT)) {
          e.preventDefault();
          project.triggerOpenProject?.();
        }
        return;
      }

      if (matchShortcut(e, SHORTCUTS.TAB_CHAPTER)) {
        e.preventDefault();
        layout.setActiveTab('capitulo');
        return;
      }
      if (matchShortcut(e, SHORTCUTS.TAB_BOOK)) {
        e.preventDefault();
        layout.setActiveTab('libro');
        return;
      }
      if (matchShortcut(e, SHORTCUTS.TAB_FINISHED)) {
        e.preventDefault();
        layout.setActiveTab('terminados');
        return;
      }
      if (matchShortcut(e, SHORTCUTS.REFRESH)) {
        e.preventDefault();
        await refreshChapters(project.currentProject);
        return;
      }
      if (matchShortcut(e, SHORTCUTS.CLOSE_CHAPTER)) {
        e.preventDefault();
        if (project.activeChapterPath) {
          layout.setShowCloseChapterModal(true);
        }
        return;
      }
      if (matchShortcut(e, SHORTCUTS.NEW_CHAPTER)) {
        e.preventDefault();
        const result = await createChapter(project.currentProject);
        if (!result.ok) return;
        project.addChapter(result.value);
        await updateProjectMeta(project.currentProject, { capituloActivo: result.value.filename });
        const read = await readChapter(result.value.path);
        const content = read.ok ? read.value : `# ${result.value.title}\n\n`;
        project.setActiveChapter(result.value.path, content);
        return;
      }
      if (matchShortcut(e, SHORTCUTS.CLOSE_PROJECT)) {
        e.preventDefault();
        project.closeProject();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
