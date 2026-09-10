import type { Project } from '@/types/project';
import { openProject, readChapter } from './project-fs';
import { loadInitialChapter } from './chapter-loader';
import { ensureGitInit } from './versioning';
import { loadCommitsForActiveChapter } from './commit-loader';
import { readProjectState } from './settings';
import { ensureFrontmatterFiles } from './frontmatter-fs';
import { ensureBackmatterFiles } from './backmatter-fs';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';

export type OpenProjectResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setupProjectInStores(project: Project): Promise<void> {
  const chapter = await loadInitialChapter(project);
  if (!chapter.ok) throw new Error(chapter.error.kind);

  const store = useProjectStore.getState();
  store.setActiveChapter(chapter.value.activeChapter.path, chapter.value.activeChapter.content);
  store.setChapters(chapter.value.allChapters);
  store.setCurrentProject(project);

  const gitInit = await ensureGitInit(project.rootPath);
  if (!gitInit.ok) console.warn('Git init warning:', gitInit.error);

  const lang = useSettingsStore.getState().defaultProjectLanguage;
  await ensureFrontmatterFiles(project.rootPath, lang).catch((e) =>
    console.warn('Frontmatter init warning:', e)
  );

  await ensureBackmatterFiles(project.rootPath).catch((e) =>
    console.warn('Backmatter init warning:', e)
  );

  const commitsResult = await loadCommitsForActiveChapter(
    project.rootPath,
    chapter.value.activeChapter.path
  );
  if (commitsResult.ok) store.setCommits(commitsResult.value);

  // Restore the last active chapter from per-project state if it still exists
  const projectState = await readProjectState(project.rootPath).catch(() => null);
  if (projectState?.lastActiveChapterPath) {
    const absolutePath = `${project.rootPath}/${projectState.lastActiveChapterPath}`;
    const preferred = chapter.value.allChapters.find((c) => c.path === absolutePath);
    if (preferred) {
      const read = await readChapter(absolutePath);
      if (read.ok) {
        store.setActiveChapter(absolutePath, read.value);
        const preferredCommits = await loadCommitsForActiveChapter(project.rootPath, absolutePath);
        if (preferredCommits.ok) store.setCommits(preferredCommits.value);
      }
    }
  }
}

export async function openProjectByPath(path: string): Promise<OpenProjectResult> {
  const result = await openProject(path);
  if (!result.ok) return { ok: false, error: result.error.kind };

  try {
    await setupProjectInStores(result.value);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
