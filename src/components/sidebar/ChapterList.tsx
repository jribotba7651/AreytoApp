import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { readChapter, updateProjectMeta, renameChapterTitle } from '@/lib/project-fs';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import ChapterListItem from './ChapterListItem';

function ChapterList() {
  const { t } = useTranslation();
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setCommits = useProjectStore((s) => s.setCommits);
  const setChapters = useProjectStore((s) => s.setChapters);

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

    // Update chapters list with new title
    setChapters(
      chapters.map((c) =>
        c.path === chapter.path ? { ...c, title: newTitle } : c
      )
    );

    // If this is the active chapter, update its content too
    if (chapter.path === activeChapterPath) {
      const store = useProjectStore.getState();
      store.updateContent(result.value);
      store.setLastSavedContent(result.value);
      store.incrementEditorVersion();
    }
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
      {chapters.map((chapter) => (
        <ChapterListItem
          key={chapter.path}
          chapter={chapter}
          isActive={chapter.path === activeChapterPath}
          onClick={() => handleSelect(chapter.path, chapter.filename)}
          onRename={(newTitle) => handleRename(chapter, newTitle)}
        />
      ))}
    </div>
  );
}

export default ChapterList;
