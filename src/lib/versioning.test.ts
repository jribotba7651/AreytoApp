import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureGitInit, commitChanges, listCommitsForFile } from './versioning';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

const PROJECT_PATH = '/tmp/mi-libro';
const ABS_CHAPTER_PATH = '/tmp/mi-libro/capitulos/cap-01.md';
const REL_CHAPTER_PATH = 'capitulos/cap-01.md';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureGitInit', () => {
  it('no hace nada si .git ya existe', async () => {
    mockInvoke.mockResolvedValueOnce(true); // git_repo_exists

    const result = await ensureGitInit(PROJECT_PATH);

    expect(result.ok).toBe(true);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('git_repo_exists', { repoPath: PROJECT_PATH });
  });

  it('llama git_init y git_initial_commit si no existe .git', async () => {
    mockInvoke
      .mockResolvedValueOnce(false)                          // git_repo_exists
      .mockResolvedValueOnce(undefined)                      // git_init
      .mockResolvedValueOnce('abc1234def5678901234567890'); // git_initial_commit

    const result = await ensureGitInit(PROJECT_PATH);

    expect(result.ok).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('git_init', { repoPath: PROJECT_PATH });
    expect(mockInvoke).toHaveBeenCalledWith('git_initial_commit', { repoPath: PROJECT_PATH });
  });

  it('retorna error si git_init falla', async () => {
    mockInvoke
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('git not found'));

    const result = await ensureGitInit(PROJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('InitFailed');
  });
});

describe('commitChanges', () => {
  it('retorna null si no hay cambios reales', async () => {
    mockInvoke.mockResolvedValueOnce(false); // git_has_changes

    const result = await commitChanges(PROJECT_PATH, ABS_CHAPTER_PATH);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith('git_has_changes', {
      repoPath: PROJECT_PATH,
      filePath: REL_CHAPTER_PATH,
    });
    expect(mockInvoke).not.toHaveBeenCalledWith('git_commit_file', expect.anything());
  });

  it('retorna hash si hay cambios y hace commit', async () => {
    const hash = 'abc1234def5678';
    mockInvoke
      .mockResolvedValueOnce(true)  // git_has_changes
      .mockResolvedValueOnce(hash); // git_commit_file

    const result = await commitChanges(PROJECT_PATH, ABS_CHAPTER_PATH);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(hash);
    expect(mockInvoke).toHaveBeenCalledWith('git_commit_file', {
      repoPath: PROJECT_PATH,
      filePath: REL_CHAPTER_PATH,
      message: 'autosave: cap-01.md',
    });
  });
});

describe('listCommitsForFile', () => {
  it('retorna lista de commits mapeados correctamente', async () => {
    mockInvoke.mockResolvedValueOnce([
      { hash: 'abc123full', short_hash: 'abc123', message: 'autosave: cap-01.md', timestamp: '2026-05-21T14:00:00+00:00' },
      { hash: 'def456full', short_hash: 'def456', message: 'Initial commit', timestamp: '2026-05-21T12:00:00+00:00' },
    ]);

    const result = await listCommitsForFile(PROJECT_PATH, ABS_CHAPTER_PATH);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.shortHash).toBe('abc123');
      expect(result.value[0]?.message).toBe('autosave: cap-01.md');
      expect(result.value[1]?.shortHash).toBe('def456');
    }
    expect(mockInvoke).toHaveBeenCalledWith('git_log_file', {
      repoPath: PROJECT_PATH,
      filePath: REL_CHAPTER_PATH,
      limit: 50,
    });
  });

  it('retorna lista vacía si el archivo no tiene commits', async () => {
    mockInvoke.mockResolvedValueOnce([]);

    const result = await listCommitsForFile(PROJECT_PATH, ABS_CHAPTER_PATH);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(0);
  });
});
