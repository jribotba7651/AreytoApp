import { useProjectStore } from '@/stores/projectStore';
import { readChapter, updateProjectMeta } from '@/lib/project-fs';
import { loadCommitsForActiveChapter } from '@/lib/commit-loader';
import ChapterListItem from './ChapterListItem';

function ChapterList() {
  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterPath = useProjectStore((s) => s.activeChapterPath);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const setCommits = useProjectStore((s) => s.setCommits);

  async function handleSelect(chapterPath: string, filename: string) {
    if (chapterPath === activeChapterPath || !currentProject) return;

    const read = await readChapter(chapterPath);
    if (!read.ok) {
      console.error('Error al leer capítulo:', read.error);
      return;
    }

    setActiveChapter(chapterPath, read.value);
    await updateProjectMeta(currentProject, { capituloActivo: filename });

    const commitsResult = await loadCommitsForActiveChapter(currentProject.rootPath, chapterPath);
    if (commitsResult.ok) setCommits(commitsResult.value);
  }

  if (chapters.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-text-tertiary">Sin capítulos</p>
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
        />
      ))}
    </div>
  );
}

export default ChapterList;
