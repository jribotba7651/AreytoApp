import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useProjectStore } from '@/stores/projectStore';
import { refreshChapters } from '@/lib/refresh-chapters';
import { readChapter } from '@/lib/project-fs';
import { decideReload, isSameChapterFile } from '@/lib/watcher-reconcile';

const DEBOUNCE_MS = 300;

export function useProjectWatcher() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const rootPath = currentProject?.rootPath ?? null;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPathsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!rootPath) return;

    let unlisten: (() => void) | null = null;
    let cancelled = false;

    async function setup() {
      try {
        await invoke('watch_project', { path: rootPath });
      } catch (err) {
        console.error('watch_project failed:', err);
        return;
      }

      if (cancelled) return;

      unlisten = await listen<string[]>('project-files-changed', (event) => {
        for (const p of event.payload) {
          pendingPathsRef.current.add(p);
        }

        if (debounceRef.current !== null) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
          const paths = new Set(pendingPathsRef.current);
          pendingPathsRef.current.clear();
          void handleChanges(paths);
        }, DEBOUNCE_MS);
      });
    }

    async function handleChanges(changedPaths: Set<string>) {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;

      const hasSectionChange = Array.from(changedPaths).some(
        (p) => p.includes('/frontmatter/') || p.includes('/backmatter/')
      );

      if (hasSectionChange) {
        useProjectStore.getState().incrementSectionVersion();
      }

      await refreshChapters(project);

      const { activeChapterPath, activeChapterContent, lastSavedContent } =
        useProjectStore.getState();

      if (!activeChapterPath) return;

      const isActiveChanged = Array.from(changedPaths).some(
        (p) => isSameChapterFile(p, activeChapterPath)
      );
      if (!isActiveChanged) return;

      const readResult = await readChapter(activeChapterPath);
      if (!readResult.ok) return;

      const diskContent = readResult.value;
      const decision = decideReload({ diskContent, editorContent: activeChapterContent, lastSavedContent });

      if (decision === 'ignore') return;

      const store = useProjectStore.getState();

      if (decision === 'reload') {
        store.updateContent(diskContent);
        store.syncAutosaveSaved?.(diskContent);
        store.incrementEditorVersion();
        return;
      }

      // decision === 'prompt'
      store.setExternalChangePending({ path: activeChapterPath, diskContent });
    }

    void setup();

    return () => {
      cancelled = true;
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      pendingPathsRef.current.clear();
      unlisten?.();
      invoke('unwatch_project').catch(() => {});
    };
  }, [rootPath]);
}
