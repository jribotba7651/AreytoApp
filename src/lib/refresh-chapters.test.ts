import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project, Chapter } from '@/types/project';

vi.mock('./project-fs', () => ({
  listChapters: vi.fn(),
}));

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: {
    getState: vi.fn(),
  },
}));

import { listChapters } from './project-fs';
import { useProjectStore } from '@/stores/projectStore';
import { refreshChapters } from './refresh-chapters';

const mockListChapters = vi.mocked(listChapters);
const mockGetState = vi.mocked(useProjectStore.getState);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

const CAP_IN_PROGRESS: Chapter = {
  path: '/tmp/mi-libro/capitulos/cap-01.md',
  filename: 'cap-01.md',
  title: 'Capítulo 1',
  status: 'in-progress',
};

const CAP_FINISHED: Chapter = {
  path: '/tmp/mi-libro/capitulos-terminados/cap-00.md',
  filename: 'cap-00.md',
  title: 'Capítulo 0',
  status: 'finished',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('refreshChapters', () => {
  it('llama listChapters y actualiza el store con capítulos in-progress', async () => {
    const setChapters = vi.fn();
    mockGetState.mockReturnValue({ setChapters } as unknown as ReturnType<typeof useProjectStore.getState>);
    mockListChapters.mockResolvedValue({ ok: true, value: [CAP_IN_PROGRESS] });

    const result = await refreshChapters(PROJECT);

    expect(result.ok).toBe(true);
    expect(mockListChapters).toHaveBeenCalledWith(PROJECT);
    expect(setChapters).toHaveBeenCalledWith([CAP_IN_PROGRESS]);
  });

  it('filtra capítulos terminados antes de set en el store', async () => {
    const setChapters = vi.fn();
    mockGetState.mockReturnValue({ setChapters } as unknown as ReturnType<typeof useProjectStore.getState>);
    mockListChapters.mockResolvedValue({
      ok: true,
      value: [CAP_IN_PROGRESS, CAP_FINISHED],
    });

    await refreshChapters(PROJECT);

    expect(setChapters).toHaveBeenCalledWith([CAP_IN_PROGRESS]);
  });

  it('retorna error si listChapters falla', async () => {
    const setChapters = vi.fn();
    mockGetState.mockReturnValue({ setChapters } as unknown as ReturnType<typeof useProjectStore.getState>);
    mockListChapters.mockResolvedValue({
      ok: false,
      error: { kind: 'ReadFailed', path: '/tmp', reason: 'boom' },
    });

    const result = await refreshChapters(PROJECT);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Failed to list chapters');
    expect(setChapters).not.toHaveBeenCalled();
  });
});
