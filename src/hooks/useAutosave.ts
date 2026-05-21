import { useCallback, useEffect, useRef } from 'react';
import { writeChapter } from '@/lib/project-fs';
import { commitChanges } from '@/lib/versioning';
import { useProjectStore } from '@/stores/projectStore';
import type { SaveStatus } from '@/stores/projectStore';

interface UseAutosaveOptions {
  content: string;
  chapterPath: string | null;
  projectPath: string | null;
  onStatusChange: (status: SaveStatus) => void;
  delay?: number;
}

interface UseAutosaveResult {
  flush: () => Promise<void>;
  syncSaved: (content: string) => void;
}

export function useAutosave({
  content,
  chapterPath,
  projectPath,
  onStatusChange,
  delay = 500,
}: UseAutosaveOptions): UseAutosaveResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(content);
  const isSavingRef = useRef(false);

  // Refs to always capture latest option values for the stable flush function
  const contentRef = useRef(content);
  const chapterPathRef = useRef(chapterPath);
  const projectPathRef = useRef(projectPath);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { chapterPathRef.current = chapterPath; }, [chapterPath]);
  useEffect(() => { projectPathRef.current = projectPath; }, [projectPath]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const doSave = useCallback(async (saveContent: string, savePath: string, saveProjPath: string | null) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    onStatusChangeRef.current('saving');

    const result = await writeChapter(savePath, saveContent);

    if (result.ok) {
      lastSavedRef.current = saveContent;
      onStatusChangeRef.current('saved');

      if (saveProjPath) {
        const commitResult = await commitChanges(saveProjPath, savePath);
        if (commitResult.ok && commitResult.value) {
          const hash = commitResult.value;
          const filename = savePath.split('/').pop() ?? savePath;
          useProjectStore.getState().prependCommit({
            hash,
            shortHash: hash.slice(0, 7),
            message: `autosave: ${filename}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } else {
      onStatusChangeRef.current('error');
    }

    isSavingRef.current = false;
  }, []);

  useEffect(() => {
    if (!chapterPath) return;
    if (content === lastSavedRef.current) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void doSave(content, chapterPath, projectPath);
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, chapterPath, projectPath, delay, doSave]);

  const flush = useCallback(async () => {
    const c = contentRef.current;
    const p = chapterPathRef.current;
    const pp = projectPathRef.current;

    if (!p || c === lastSavedRef.current) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    await doSave(c, p, pp);
  }, [doSave]);

  const syncSaved = useCallback((savedContent: string) => {
    lastSavedRef.current = savedContent;
  }, []);

  return { flush, syncSaved };
}
