import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Chapter, Project } from '@/types/project';

vi.mock('./project-fs', () => ({
  closeChapter: vi.fn(),
}));

vi.mock('./versioning', () => ({
  tagChapter: vi.fn(),
  tagExists: vi.fn(),
  findNextAvailableTag: vi.fn(),
  commitAll: vi.fn(),
}));

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: { getState: vi.fn() },
}));

import { closeChapter } from './project-fs';
import { tagChapter, tagExists, findNextAvailableTag, commitAll } from './versioning';
import { useProjectStore } from '@/stores/projectStore';
import { checkCloseConflict, performCloseChapter } from './close-chapter-flow';

const mockCloseChapter = vi.mocked(closeChapter);
const mockTagChapter = vi.mocked(tagChapter);
const mockTagExists = vi.mocked(tagExists);
const mockFindNextAvailableTag = vi.mocked(findNextAvailableTag);
const mockCommitAll = vi.mocked(commitAll);
const mockGetState = vi.mocked(useProjectStore.getState);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-22T00:00:00.000Z',
  capituloActivo: null,
};

const CHAPTER: Chapter = {
  path: '/tmp/mi-libro/capitulos/cap-01.md',
  filename: 'cap-01.md',
  title: 'Capítulo 1',
  status: 'in-progress',
};

function makeStore() {
  return {
    flushAutosave: null,
  } as unknown as ReturnType<typeof useProjectStore.getState>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetState.mockReturnValue(makeStore());
  mockCommitAll.mockResolvedValue({ ok: true, value: undefined });
  mockCloseChapter.mockResolvedValue({ ok: true, value: { newPath: '/tmp/mi-libro/capitulos-terminados/cap-01.md' } });
});

describe('checkCloseConflict', () => {
  it('detecta correctamente caso sin conflicto', async () => {
    mockTagExists.mockResolvedValue({ ok: true, value: false });

    const info = await checkCloseConflict('/tmp/mi-libro', 'cap-01.md');

    expect(info.baseTagExists).toBe(false);
    expect(info.baseTagName).toBe('cap-01-final');
    expect(info.suggestedTagName).toBe('cap-01-final');
  });

  it('detecta correctamente caso con conflicto y sugiere -2', async () => {
    mockTagExists.mockResolvedValue({ ok: true, value: true });
    mockFindNextAvailableTag.mockResolvedValue({ ok: true, value: 'cap-01-final-2' });

    const info = await checkCloseConflict('/tmp/mi-libro', 'cap-01.md');

    expect(info.baseTagExists).toBe(true);
    expect(info.baseTagName).toBe('cap-01-final');
    expect(info.suggestedTagName).toBe('cap-01-final-2');
  });
});

describe('performCloseChapter', () => {
  it('usa explicitTagName cuando se pasa en options', async () => {
    mockTagChapter.mockResolvedValue({ ok: true, value: 'cap-01-final-2' });

    await performCloseChapter(PROJECT, CHAPTER, { explicitTagName: 'cap-01-final-2' });

    expect(mockTagChapter).toHaveBeenCalledWith(
      PROJECT.rootPath,
      CHAPTER.filename,
      { explicitTagName: 'cap-01-final-2' }
    );
  });

  it('llama tagChapter sin explicitTagName cuando no hay conflicto', async () => {
    mockTagChapter.mockResolvedValue({ ok: true, value: 'cap-01-final' });

    await performCloseChapter(PROJECT, CHAPTER);

    expect(mockTagChapter).toHaveBeenCalledWith(
      PROJECT.rootPath,
      CHAPTER.filename,
      { explicitTagName: undefined }
    );
  });

  it('retorna error si tagChapter falla', async () => {
    mockTagChapter.mockResolvedValue({ ok: false, error: { kind: 'TagFailed', reason: 'already exists' } });

    const result = await performCloseChapter(PROJECT, CHAPTER);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('TagFailed');
    expect(mockCloseChapter).not.toHaveBeenCalled();
  });

  it('retorna error estructurado si closeChapter falla', async () => {
    mockTagChapter.mockResolvedValue({ ok: true, value: 'cap-01-final' });
    mockCloseChapter.mockResolvedValue({
      ok: false,
      error: { kind: 'WriteFailed', path: CHAPTER.path, reason: 'permission denied' },
    });

    const result = await performCloseChapter(PROJECT, CHAPTER);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('WriteFailed');
  });
});
