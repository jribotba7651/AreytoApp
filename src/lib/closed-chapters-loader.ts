import type { ClosedChapter, Project } from '@/types/project';
import { listChapters, readFile } from './project-fs';
import { listChapterTags } from './versioning';

function countWordsSimple(text: string): number {
  const stripped = text.replace(/^#+\s.*/gm, '').replace(/[*_~`>#\-\[\]()!]/g, '');
  const words = stripped.match(/\S+/g);
  return words ? words.length : 0;
}

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

  const closedPromises = finished.map(async (chapter) => {
    const match = /^cap-(\d+)\.md$/.exec(chapter.filename);
    const tagName = match?.[1] ? `cap-${match[1]}-final` : '';
    const tag = tags.find((t) => t.name === tagName);

    const read = await readFile(chapter.path);
    const wordCount = read.ok ? countWordsSimple(read.value) : 0;

    return {
      filename: chapter.filename,
      absolutePath: chapter.path,
      tagName: tagName || 'sin-tag',
      closedAt: tag?.timestamp ?? new Date().toISOString(),
      title: chapter.title,
      wordCount,
    };
  });

  const closed = await Promise.all(closedPromises);
  closed.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

  return { ok: true, value: closed };
}
