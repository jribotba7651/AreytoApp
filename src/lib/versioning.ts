import { invoke } from '@tauri-apps/api/core';
import type { Commit, GitError, GitResult, TagInfo } from '@/types/git';
import { writeChapter } from './project-fs';

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
  absoluteFilePath: string,
  options?: { customMessage?: string }
): Promise<GitResult<string | null>> {
  const relPath = relativePath(projectPath, absoluteFilePath);

  try {
    const hasChanges = await invoke<boolean>('git_has_changes', {
      repoPath: projectPath,
      filePath: relPath,
    });

    if (!hasChanges) return ok(null);

    const message = options?.customMessage ?? `autosave: ${basename(relPath)}`;
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

export async function readFileAtCommit(
  projectPath: string,
  absoluteFilePath: string,
  commitHash: string
): Promise<GitResult<string>> {
  const relPath = relativePath(projectPath, absoluteFilePath);

  try {
    const content = await invoke<string>('git_show_file_at_commit', {
      repoPath: projectPath,
      commitHash,
      filePath: relPath,
    });
    return ok(content);
  } catch (e) {
    return fail({ kind: 'LogFailed', reason: String(e) });
  }
}

export async function restoreFile(
  projectPath: string,
  absoluteFilePath: string,
  commitHash: string
): Promise<GitResult<{ commit: Commit; content: string }>> {
  const read = await readFileAtCommit(projectPath, absoluteFilePath, commitHash);
  if (!read.ok) return read;

  const write = await writeChapter(absoluteFilePath, read.value);
  if (!write.ok) {
    return fail({ kind: 'CommitFailed', reason: 'Failed to write restored content' });
  }

  const filename = basename(relativePath(projectPath, absoluteFilePath));
  const shortHash = commitHash.slice(0, 7);
  const message = `restore: ${filename} from ${shortHash}`;
  const committed = await commitChanges(projectPath, absoluteFilePath, { customMessage: message });

  if (!committed.ok) return committed;

  const hash = committed.value ?? commitHash;
  const commit: Commit = {
    hash,
    shortHash: hash.slice(0, 7),
    message,
    timestamp: new Date().toISOString(),
  };

  return ok({ commit, content: read.value });
}

// --- Tag operations ---

interface RawTagInfo {
  name: string;
  timestamp: string;
  commit_subject: string;
}

function mapTagInfo(raw: RawTagInfo): TagInfo {
  return { name: raw.name, timestamp: raw.timestamp, commitSubject: raw.commit_subject };
}

export async function tagChapter(
  projectPath: string,
  filename: string
): Promise<GitResult<string>> {
  const match = /^cap-(\d+)\.md$/.exec(filename);
  if (!match?.[1]) return fail({ kind: 'TagFailed', reason: 'invalid filename' });

  const tagName = `cap-${match[1]}-final`;
  try {
    await invoke('git_tag', { repoPath: projectPath, tagName });
    return ok(tagName);
  } catch (e) {
    return fail({ kind: 'TagFailed', reason: String(e) });
  }
}

export async function listChapterTags(projectPath: string): Promise<GitResult<TagInfo[]>> {
  try {
    const raw = await invoke<RawTagInfo[]>('git_list_chapter_tags', { repoPath: projectPath });
    return ok(raw.map(mapTagInfo));
  } catch (e) {
    return fail({ kind: 'TagFailed', reason: String(e) });
  }
}

export async function commitAll(projectPath: string, message: string): Promise<GitResult<void>> {
  try {
    await invoke('git_commit_all', { repoPath: projectPath, message });
    return ok(undefined);
  } catch (e) {
    return fail({ kind: 'CommitFailed', reason: String(e) });
  }
}
