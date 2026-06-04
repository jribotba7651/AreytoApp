import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClosedChapter, Project } from '@/types/project';

vi.mock('./project-fs', () => ({
  reopenChapter: vi.fn(),
  listChapters: vi.fn(),
  readChapter: vi.fn(),
}));

vi.mock('./versioning', () => ({
  commitAll: vi.fn(),
  listCommitsForFile: vi.fn(),
}));

vi.mock('./closed-chapters-loader', () => ({
  loadClosedChapters: vi.fn(),
}));

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: { getState: vi.fn() },
}));

vi.mock('@/stores/layoutStore', () => ({
  useLayoutStore: { getState: vi.fn() },
}));

import { reopenChapter, listChapters, readChapter } from './project-fs';
import { commitAll, listCommitsForFile } from './versioning';
import { loadClosedChapters } from './closed-chapters-loader';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { performReopenChapter } from './reopen-chapter-flow';

const mockReopenChapter = vi.mocked(reopenChapter);
const mockListChapters = vi.mocked(listChapters);
const mockReadChapter = vi.mocked(readChapter);
const mockCommitAll = vi.mocked(commitAll);
const mockListCommitsForFile = vi.mocked(listCommitsForFile);
const mockLoadClosedChapters = vi.mocked(loadClosedChapters);
const mockProjectGetState = vi.mocked(useProjectStore.getState);
const mockLayoutGetState = vi.mocked(useLayoutStore.getState);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-22T00:00:00.000Z',
  capituloActivo: null,
};

const CLOSED_CHAPTER: ClosedChapter = {
  filename: 'cap-01.md',
  absolutePath: '/tmp/mi-libro/capitulos-terminados/cap-01.md',
  tagName: 'cap-01-final',
  closedAt: '2026-05-22T10:00:00.000Z',
};

const NEW_PATH = '/tmp/mi-libro/capitulos/cap-01.md';

function makeStoreState(overrides: Record<string, unknown> = {}) {
  return {
    setChapters: vi.fn(),
    setClosedChapters: vi.fn(),
    setActiveChapter: vi.fn(),
    setCommits: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useProjectStore.getState>;
}

function makeLayoutState() {
  return {
    setActiveTab: vi.fn(),
  } as unknown as ReturnType<typeof useLayoutStore.getState>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProjectGetState.mockReturnValue(makeStoreState());
  mockLayoutGetState.mockReturnValue(makeLayoutState());
  mockCommitAll.mockResolvedValue({ ok: true, value: undefined });
  mockListChapters.mockResolvedValue({ ok: true, value: [] });
  mockReadChapter.mockResolvedValue({ ok: true, value: '# Cap 1\n\n' });
  mockLoadClosedChapters.mockResolvedValue({ ok: true, value: [] });
  mockListCommitsForFile.mockResolvedValue({ ok: true, value: [] });
});

describe('performReopenChapter', () => {
  it('mueve el archivo de capitulos-terminados/ a capitulos/', async () => {
    mockReopenChapter.mockResolvedValue({ ok: true, value: { newPath: NEW_PATH } });

    await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(mockReopenChapter).toHaveBeenCalledWith(CLOSED_CHAPTER);
  });

  it('hace commit con mensaje "reopen: cap-01.md"', async () => {
    mockReopenChapter.mockResolvedValue({ ok: true, value: { newPath: NEW_PATH } });

    await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(mockCommitAll).toHaveBeenCalledWith(PROJECT.rootPath, 'reopen: cap-01.md');
  });

  it('refresca chapters y closedChapters en el store', async () => {
    mockReopenChapter.mockResolvedValue({ ok: true, value: { newPath: NEW_PATH } });
    const inProgress = [{ path: NEW_PATH, filename: 'cap-01.md', title: 'Cap 1', status: 'in-progress' as const }];
    mockListChapters.mockResolvedValue({ ok: true, value: inProgress });
    const closedList: ClosedChapter[] = [];
    mockLoadClosedChapters.mockResolvedValue({ ok: true, value: closedList });

    const storeState = makeStoreState();
    mockProjectGetState.mockReturnValue(storeState);

    await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(storeState.setChapters).toHaveBeenCalledWith(inProgress);
    expect(storeState.setClosedChapters).toHaveBeenCalledWith(closedList);
  });

  it('activa el capítulo reabierto con su contenido', async () => {
    mockReopenChapter.mockResolvedValue({ ok: true, value: { newPath: NEW_PATH } });
    mockReadChapter.mockResolvedValue({ ok: true, value: '# Cap 1\n\n' });

    const storeState = makeStoreState();
    mockProjectGetState.mockReturnValue(storeState);

    await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(storeState.setActiveChapter).toHaveBeenCalledWith(NEW_PATH, '# Cap 1\n\n');
  });

  it('retorna error si el move falla', async () => {
    mockReopenChapter.mockResolvedValue({
      ok: false,
      error: { kind: 'WriteFailed', path: CLOSED_CHAPTER.absolutePath, reason: 'boom' },
    });

    const result = await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('WriteFailed');
    expect(mockCommitAll).not.toHaveBeenCalled();
  });

  it('cambia el tab activo a "capitulo" después del reopen', async () => {
    mockReopenChapter.mockResolvedValue({ ok: true, value: { newPath: NEW_PATH } });
    const layoutState = makeLayoutState();
    mockLayoutGetState.mockReturnValue(layoutState);

    await performReopenChapter(PROJECT, CLOSED_CHAPTER);

    expect(layoutState.setActiveTab).toHaveBeenCalledWith('capitulo');
  });
});
