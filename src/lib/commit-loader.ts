import type { GitResult, Commit } from '@/types/git';
import { listCommitsForFile } from './versioning';

export async function loadCommitsForActiveChapter(
  projectPath: string,
  activeChapterAbsolutePath: string
): Promise<GitResult<Commit[]>> {
  return listCommitsForFile(projectPath, activeChapterAbsolutePath, 50);
}
