import type { ClosedChapter, Project } from '@/types/project';
import { reopenChapter, listChapters, readChapter } from './project-fs';
import { commitAll, listCommitsForFile } from './versioning';
import { loadClosedChapters } from './closed-chapters-loader';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';

export type ReopenResult =
  | { ok: true; newPath: string }
  | { ok: false; error: { kind: string } };

export async function performReopenChapter(
  project: Project,
  closedChapter: ClosedChapter
): Promise<ReopenResult> {
  // 1. Move file from capitulos-terminados/ to capitulos/
  const moveResult = await reopenChapter(closedChapter);
  if (!moveResult.ok) {
    return { ok: false, error: { kind: moveResult.error.kind } };
  }

  const { newPath } = moveResult.value;

  // 2. Commit the move (non-fatal — same pattern as performCloseChapter)
  const commitResult = await commitAll(project.rootPath, `reopen: ${closedChapter.filename}`);
  if (!commitResult.ok) {
    console.warn('Commit of chapter reopen failed:', commitResult.error);
  }

  // 3. Refresh sidebar chapters
  const chaptersResult = await listChapters(project);
  if (chaptersResult.ok) {
    const inProgress = chaptersResult.value.filter((c) => c.status === 'in-progress');
    useProjectStore.getState().setChapters(inProgress);
  }

  // 4. Refresh closed chapters list
  const closedResult = await loadClosedChapters(project);
  if (closedResult.ok) {
    useProjectStore.getState().setClosedChapters(closedResult.value);
  }

  // 5. Load content and activate the reopened chapter
  const contentResult = await readChapter(newPath);
  if (contentResult.ok) {
    useProjectStore.getState().setActiveChapter(newPath, contentResult.value);

    // 6. Refresh commit history for the reopened chapter
    const commitsResult = await listCommitsForFile(project.rootPath, newPath, 50);
    if (commitsResult.ok) {
      useProjectStore.getState().setCommits(commitsResult.value);
    }
  }

  // 7. Switch to Capítulo Activo tab so the user sees the reopened chapter
  useLayoutStore.getState().setActiveTab('capitulo');

  return { ok: true, newPath };
}
