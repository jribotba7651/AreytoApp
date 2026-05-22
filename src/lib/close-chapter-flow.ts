import type { Chapter, Project } from '@/types/project';
import { closeChapter } from './project-fs';
import { tagChapter, commitAll } from './versioning';
import { useProjectStore } from '@/stores/projectStore';

export type CloseResult =
  | { ok: true; tagName: string; newPath: string }
  | { ok: false; error: string };

export async function performCloseChapter(
  project: Project,
  chapter: Chapter
): Promise<CloseResult> {
  // 1. Flush any pending autosave
  await useProjectStore.getState().flushAutosave?.();

  // 2. Create git tag while file is still in capitulos/
  const tagResult = await tagChapter(project.rootPath, chapter.filename);
  if (!tagResult.ok) {
    return { ok: false, error: `No se pudo crear el tag git: ${tagResult.error.kind}` };
  }

  // 3. Move file to capitulos-terminados/
  const moveResult = await closeChapter(project, chapter);
  if (!moveResult.ok) {
    return { ok: false, error: `No se pudo mover el archivo: ${moveResult.error.kind}` };
  }

  // 4. Commit the file move (non-fatal if it fails)
  const commitResult = await commitAll(project.rootPath, `close: ${chapter.filename}`);
  if (!commitResult.ok) {
    console.warn('Commit of chapter close failed:', commitResult.error);
  }

  return { ok: true, tagName: tagResult.value, newPath: moveResult.value.newPath };
}
