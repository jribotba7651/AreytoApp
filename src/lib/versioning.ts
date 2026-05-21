import { invoke } from '@tauri-apps/api/core';
import type { Commit, GitError, GitResult } from '@/types/git';

interface CommitInfo {
  hash: string;
  short_hash: string;
  message: string;
  timestamp: string;
}

function ok<T>(value: T): GitResult<T> {
  return { ok: true, value };
}

function fail<T>(error: GitError): GitResult<T> {
  return { ok: false, error };
}

function relativePath(projectRoot: string, absolutePath: string): string {
  if (absolutePath.startsWith(projectRoot + '/')) {
    return absolutePath.slice(projectRoot.length + 1);
  }
  return absolutePath;
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

function mapCommitInfo(info: CommitInfo): Commit {
  return {
    hash: info.hash,
    shortHash: info.short_hash,
    message: info.message,
    timestamp: info.timestamp,
  };
}

export async function ensureGitInit(projectPath: string): Promise<GitResult<void>> {
  try {
    const exists = await invoke<boolean>('git_repo_exists', { repoPath: projectPath });
    if (exists) return ok(undefined);

    await invoke('git_init', { repoPath: projectPath });
    await invoke('git_initial_commit', { repoPath: projectPath });
    return ok(undefined);
  } catch (e) {
    return fail({ kind: 'InitFailed', reason: String(e) });
  }
}

export async function commitChanges(
  projectPath: string,
  absoluteFilePath: string
): Promise<GitResult<string | null>> {
  const relPath = relativePath(projectPath, absoluteFilePath);

  try {
    const hasChanges = await invoke<boolean>('git_has_changes', {
      repoPath: projectPath,
      filePath: relPath,
    });

    if (!hasChanges) return ok(null);

    const message = `autosave: ${basename(relPath)}`;
    const hash = await invoke<string>('git_commit_file', {
      repoPath: projectPath,
      filePath: relPath,
      message,
    });

    return ok(hash);
  } catch (e) {
    return fail({ kind: 'CommitFailed', reason: String(e) });
  }
}

export async function listCommitsForFile(
  projectPath: string,
  absoluteFilePath: string,
  limit = 50
): Promise<GitResult<Commit[]>> {
  const relPath = relativePath(projectPath, absoluteFilePath);

  try {
    const infos = await invoke<CommitInfo[]>('git_log_file', {
      repoPath: projectPath,
      filePath: relPath,
      limit,
    });

    return ok(infos.map(mapCommitInfo));
  } catch (e) {
    return fail({ kind: 'LogFailed', reason: String(e) });
  }
}
