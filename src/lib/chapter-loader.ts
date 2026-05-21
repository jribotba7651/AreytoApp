import type { Chapter, Project, ProjectResult } from '@/types/project';
import {
  listChapters,
  readChapter,
  createChapter,
  updateProjectMeta,
} from './project-fs';

export interface LoadedChapter {
  path: string;
  content: string;
}

export interface LoadResult {
  activeChapter: LoadedChapter;
  allChapters: Chapter[];
}

export async function loadInitialChapter(
  project: Project
): Promise<ProjectResult<LoadResult>> {
  const chaptersResult = await listChapters(project);
  if (!chaptersResult.ok) return chaptersResult;

  const inProgress = chaptersResult.value
    .filter((c) => c.status === 'in-progress')
    .sort((a, b) => a.filename.localeCompare(b.filename));

  // Rama 1: capituloActivo válido en proyecto.json
  if (project.capituloActivo) {
    const chapterPath = `${project.rootPath}/capitulos/${project.capituloActivo}`;
    const read = await readChapter(chapterPath);
    if (read.ok) {
      return {
        ok: true,
        value: {
          activeChapter: { path: chapterPath, content: read.value },
          allChapters: inProgress,
        },
      };
    }
    // Si el archivo no existe, caer a la siguiente rama
  }

  // Rama 2: usar el primer capítulo en progreso
  if (inProgress.length > 0) {
    const first = inProgress[0];
    if (!first) return { ok: false, error: { kind: 'ReadFailed', path: project.rootPath, reason: 'No chapter found' } };

    const read = await readChapter(first.path);
    if (!read.ok) return read;

    await updateProjectMeta(project, { capituloActivo: first.filename });

    return {
      ok: true,
      value: {
        activeChapter: { path: first.path, content: read.value },
        allChapters: inProgress,
      },
    };
  }

  // Rama 3: no hay capítulos, crear cap-01.md con placeholder via createChapter
  const created = await createChapter(project);
  if (!created.ok) return created;

  await updateProjectMeta(project, { capituloActivo: created.value.filename });

  const read = await readChapter(created.value.path);
  const content = read.ok ? read.value : `# ${created.value.title}\n\n`;

  return {
    ok: true,
    value: {
      activeChapter: { path: created.value.path, content },
      allChapters: [created.value],
    },
  };
}
