import type { Project, ProjectResult } from '@/types/project';
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

export async function loadInitialChapter(
  project: Project
): Promise<ProjectResult<LoadedChapter>> {
  // Rama 1: capituloActivo válido en proyecto.json
  if (project.capituloActivo) {
    const chapterPath = `${project.rootPath}/capitulos/${project.capituloActivo}`;
    const read = await readChapter(chapterPath);
    if (read.ok) {
      return { ok: true, value: { path: chapterPath, content: read.value } };
    }
    // Si el archivo no existe, caer a siguiente rama
  }

  // Rama 2: listar capítulos en progreso y cargar el primero
  const chapters = await listChapters(project);
  if (!chapters.ok) return chapters;

  const inProgress = chapters.value.filter((c) => c.status === 'in-progress');
  if (inProgress.length > 0) {
    const first = inProgress[0];
    if (!first) return { ok: false, error: { kind: 'ReadFailed', path: project.rootPath, reason: 'No chapter found' } };

    const read = await readChapter(first.path);
    if (!read.ok) return read;

    // Actualizar capituloActivo en proyecto.json
    await updateProjectMeta(project, { capituloActivo: first.filename });

    return { ok: true, value: { path: first.path, content: read.value } };
  }

  // Rama 3: no hay capítulos, crear cap-01.md
  const created = await createChapter(project, 'Capítulo 1');
  if (!created.ok) return created;

  const updated = await updateProjectMeta(project, { capituloActivo: created.value.filename });
  if (!updated.ok) return updated;

  return { ok: true, value: { path: created.value.path, content: `# Capítulo 1\n\n` } };
}
