import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ChapterColor } from '@/types/project';
import { readChapter, updateProjectMeta, renameChapterTitle, reorderChapters } from '@/lib/project-fs';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import ChapterListItem from './ChapterListItem';

function countWords(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}

function ChapterList() {
  const { t } = useTranslation();
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const activeChapterContent = useProjectStore((s) => s.activeChapterContent);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setCommits = useProjectStore((s) => s.setCommits);
  const setChapters = useProjectStore((s) => s.setChapters);
  const chapterWordGoal = useSettingsStore((s) => s.chapterWordGoal);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentProject || chapters.length === 0) return;
    let cancelled = false;
    async function load() {
      const counts: Record<string, number> = {};
      for (const ch of chapters) {
        if (ch.path === activeChapterPath) {
          counts[ch.path] = countWords(activeChapterContent);
        } else {
          const result = await readChapter(ch.path);
          if (result.ok) counts[ch.path] = countWords(result.value);
        }
      }
      if (!cancelled) setWordCounts(counts);
    }
    load();
    return () => { cancelled = true; };
  }, [currentProject, chapters, activeChapterPath, activeChapterContent]);

  // Only in-progress chapters are draggable
  const inProgressChapters = chapters.filter((c) => c.status === 'in-progress');
  const finishedChapters = chapters.filter((c) => c.status === 'finished');

  async function handleSelect(chapterPath: string, filename: string) {
    if (chapterPath === activeChapterPath || !currentProject) return;

    const read = await readChapter(chapterPath);
    if (!read.ok) {
      console.error('Error al leer capitulo:', read.error);
      return;
    }

    setActiveChapter(chapterPath, read.value);
    await updateProjectMeta(currentProject, { capituloActivo: filename });

    const commitsResult = await loadCommitsForActiveChapter(currentProject.rootPath, chapterPath);
    if (commitsResult.ok) setCommits(commitsResult.value);
  }

  async function handleRename(chapter: { path: string; filename: string }, newTitle: string) {
    const result = await renameChapterTitle(chapter.path, newTitle);
    if (!result.ok) return;

    setChapters(
      chapters.map((c) =>
        c.path === chapter.path ? { ...c, title: newTitle } : c
      )
    );

    if (chapter.path === activeChapterPath) {
      const store = useProjectStore.getState();
      store.updateContent(result.value);
      store.setLastSavedContent(result.value);
      store.incrementEditorVersion();
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  async function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex || !currentProject) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...inProgressChapters];
    const moved = reordered.splice(dragIndex, 1)[0];
    if (!moved) return;
    reordered.splice(dropIndex, 0, moved);

    const orderedFilenames = reordered.map((c) => c.filename);
    const result = await reorderChapters(currentProject, orderedFilenames);

    if (result.ok) {
      setChapters([...result.value, ...finishedChapters]);

      // Update active chapter path if it changed
      const wasActive = activeChapterPath;
      if (wasActive) {
        const activeFilename = wasActive.split('/').pop();
        const movedChapter = orderedFilenames.findIndex(
          (f) => f === activeFilename
        );
        const reorderedEntry = movedChapter >= 0 ? result.value[movedChapter] : undefined;
        if (reorderedEntry) {
          const newFilename = reorderedEntry.filename;
          const newPath = reorderedEntry.path;
          if (newPath !== wasActive) {
            const read = await readChapter(newPath);
            if (read.ok) {
              setActiveChapter(newPath, read.value);
              await updateProjectMeta(currentProject, { capituloActivo: newFilename });
            }
          }
        }
      }
    }

    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleColorChange(filename: string, color: ChapterColor | null) {
    if (!currentProject) return;
    const existing = currentProject.chapterColors ?? {};
    const updated = { ...existing };
    if (color) {
      updated[filename] = color;
    } else {
      delete updated[filename];
    }
    await useProjectStore.getState().updateProjectMeta({ chapterColors: updated });
  }

  if (chapters.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-text-tertiary">{t('sidebar.noChapters')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {inProgressChapters.map((chapter, i) => (
        <ChapterListItem
          key={chapter.path}
          chapter={chapter}
          index={i}
          isActive={chapter.path === activeChapterPath}
          onClick={() => handleSelect(chapter.path, chapter.filename)}
          onRename={(newTitle) => handleRename(chapter, newTitle)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragOver={dragOverIndex === i && dragIndex !== i}
          draggable
          wordCount={wordCounts[chapter.path] ?? 0}
          wordGoal={chapterWordGoal}
          chapterColor={currentProject?.chapterColors?.[chapter.filename]}
          onColorChange={(color) => handleColorChange(chapter.filename, color)}
        />
      ))}
      {finishedChapters.map((chapter, i) => (
        <ChapterListItem
          key={chapter.path}
          chapter={chapter}
          index={inProgressChapters.length + i}
          isActive={chapter.path === activeChapterPath}
          onClick={() => handleSelect(chapter.path, chapter.filename)}
          onRename={(newTitle) => handleRename(chapter, newTitle)}
          onDragStart={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
          onDragEnd={() => {}}
          isDragOver={false}
          draggable={false}
          wordCount={wordCounts[chapter.path] ?? 0}
          wordGoal={chapterWordGoal}
          chapterColor={currentProject?.chapterColors?.[chapter.filename]}
          onColorChange={(color) => handleColorChange(chapter.filename, color)}
        />
      ))}
    </div>
  );
}

export default ChapterList;
