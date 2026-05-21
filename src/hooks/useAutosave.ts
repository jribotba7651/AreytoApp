import { useEffect, useRef } from 'react';
import { writeChapter } from '@/lib/project-fs';
import type { SaveStatus } from '@/stores/projectStore';

interface UseAutosaveOptions {
  content: string;
  chapterPath: string | null;
  onStatusChange: (status: SaveStatus) => void;
  delay?: number;
}

export function useAutosave({
  content,
  chapterPath,
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
  }, [content, chapterPath, delay, onStatusChange]);
}
