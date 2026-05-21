import type { Project } from '@/types/project';
import type { BookData, BookSection } from '@/types/book';
import { listChapters, readChapter } from './project-fs';

export async function loadBook(project: Project): Promise<BookData> {
  const chaptersResult = await listChapters(project);
  if (!chaptersResult.ok) {
    return { projectName: project.nombre, sections: [] };
  }

  const inProgress = chaptersResult.value
    .filter((c) => c.status === 'in-progress')
    .sort((a, b) => a.filename.localeCompare(b.filename));

  const sections: BookSection[] = await Promise.all(
    inProgress.map(async (chapter) => {
      const result = await readChapter(chapter.path);
      if (result.ok) {
        return { kind: 'chapter' as const, chapter, content: result.value };
      }
      return { kind: 'chapter-error' as const, chapter, reason: result.error.kind };
    })
  );

  return { projectName: project.nombre, sections };
}
