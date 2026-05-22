import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureGitInit, commitChanges, listCommitsForFile, readFileAtCommit, restoreFile, tagExists, findNextAvailableTag, tagChapter } from './versioning';

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

describe('readFileAtCommit', () => {
  it('retorna el contenido del archivo en el commit especificado', async () => {
    const content = '# Capítulo 1\n\nContenido antiguo.';
    mockInvoke.mockResolvedValueOnce(content);

    const result = await readFileAtCommit(PROJECT_PATH, ABS_CHAPTER_PATH, 'abc1234');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(content);
    expect(mockInvoke).toHaveBeenCalledWith('git_show_file_at_commit', {
      repoPath: PROJECT_PATH,
      commitHash: 'abc1234',
      filePath: REL_CHAPTER_PATH,
    });
  });

  it('retorna error si el commit no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('unknown commit'));

    const result = await readFileAtCommit(PROJECT_PATH, ABS_CHAPTER_PATH, 'deadbeef');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('LogFailed');
  });
});

describe('tagExists', () => {
  it('retorna true si el tag existe', async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const result = await tagExists(PROJECT_PATH, 'cap-01-final');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('git_tag_exists', {
      repoPath: PROJECT_PATH,
      tagName: 'cap-01-final',
    });
  });

  it('retorna false si el tag no existe', async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const result = await tagExists(PROJECT_PATH, 'cap-01-final');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(false);
  });
});

describe('findNextAvailableTag', () => {
  it('retorna el base si no hay conflicto', async () => {
    mockInvoke.mockResolvedValueOnce([]); // git_list_tags_matching returns empty

    const result = await findNextAvailableTag(PROJECT_PATH, 'cap-01-final');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('cap-01-final');
  });

  it('retorna -2 si solo el base existe', async () => {
    mockInvoke.mockResolvedValueOnce(['cap-01-final']); // base exists, no -2

    const result = await findNextAvailableTag(PROJECT_PATH, 'cap-01-final');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('cap-01-final-2');
  });

  it('salta números usados (-2 existe, retorna -3)', async () => {
    mockInvoke.mockResolvedValueOnce(['cap-01-final', 'cap-01-final-2']); // -3 free

    const result = await findNextAvailableTag(PROJECT_PATH, 'cap-01-final');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('cap-01-final-3');
  });
});

describe('tagChapter', () => {
  it('usa explicitTagName cuando se pasa', async () => {
    mockInvoke.mockResolvedValueOnce(undefined); // git_tag

    const result = await tagChapter(PROJECT_PATH, 'cap-01.md', { explicitTagName: 'cap-01-final-2' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('cap-01-final-2');
    expect(mockInvoke).toHaveBeenCalledWith('git_tag', {
      repoPath: PROJECT_PATH,
      tagName: 'cap-01-final-2',
    });
  });
});

describe('restoreFile', () => {
  it('escribe contenido antiguo, crea commit restore y retorna ambos', async () => {
    const oldContent = '# Capítulo 1\n\nContenido viejo.';
    const restoreHash = 'abc1234fullhash';

    mockInvoke
      .mockResolvedValueOnce(oldContent)    // git_show_file_at_commit
      .mockResolvedValueOnce(undefined)     // write_text_file (writeChapter)
      .mockResolvedValueOnce(true)          // git_has_changes
      .mockResolvedValueOnce(restoreHash);  // git_commit_file

    const result = await restoreFile(PROJECT_PATH, ABS_CHAPTER_PATH, 'abc1234');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toBe(oldContent);
      expect(result.value.commit.message).toBe('restore: cap-01.md from abc1234');
      expect(result.value.commit.hash).toBe(restoreHash);
    }
  });
});
