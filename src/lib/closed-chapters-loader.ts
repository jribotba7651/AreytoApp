import type { ClosedChapter, Project } from '@/types/project';
import { listChapters } from './project-fs';
import { listChapterTags } from './versioning';

export async function loadClosedChapters(
  project: Project
): Promise<{ ok: true; value: ClosedChapter[] } | { ok: false; error: string }> {
  const [chaptersResult, tagsResult] = await Promise.all([
    listChapters(project),
    listChapterTags(project.rootPath),
  ]);

  if (!chaptersResult.ok) {
    return { ok: false, error: chaptersResult.error.kind };
  }

  const finished = chaptersResult.value.filter((c) => c.status === 'finished');
  const tags = tagsResult.ok ? tagsResult.value : [];

  const closed: ClosedChapter[] = finished.map((chapter) => {
    const match = /^cap-(\d+)\.md$/.exec(chapter.filename);
    const tagName = match?.[1] ? `cap-${match[1]}-final` : '';
    const tag = tags.find((t) => t.name === tagName);

    return {
      filename: chapter.filename,
      absolutePath: chapter.path,
      tagName: tagName || 'sin-tag',
      closedAt: tag?.timestamp ?? new Date().toISOString(),
    };
  });

  closed.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

  return { ok: true, value: closed };
}
