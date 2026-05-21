import { useEffect, useRef } from 'react';
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

export function useAutosave({
  content,
  chapterPath,
  projectPath,
  onStatusChange,
  delay = 500,
}: UseAutosaveOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(content);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!chapterPath) return;
    if (content === lastSavedRef.current) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      onStatusChange('saving');

      const result = await writeChapter(chapterPath, content);

      if (result.ok) {
        lastSavedRef.current = content;
        onStatusChange('saved');

        if (projectPath) {
          const commitResult = await commitChanges(projectPath, chapterPath);
          if (commitResult.ok && commitResult.value) {
            const hash = commitResult.value;
            const filename = chapterPath.split('/').pop() ?? chapterPath;
            const commit = {
              hash,
              shortHash: hash.slice(0, 7),
              message: `autosave: ${filename}`,
              timestamp: new Date().toISOString(),
            };
            useProjectStore.getState().prependCommit(commit);
          }
        }
      } else {
        onStatusChange('error');
      }

      isSavingRef.current = false;
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, chapterPath, projectPath, delay, onStatusChange]);
}
