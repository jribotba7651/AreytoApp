import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadInitialChapter } from './chapter-loader';
import type { Project } from '@/types/project';

vi.mock('./project-fs', () => ({
  listChapters: vi.fn(),
  readChapter: vi.fn(),
  createChapter: vi.fn(),
  updateProjectMeta: vi.fn(),
}));

import { listChapters, readChapter, createChapter, updateProjectMeta } from './project-fs';
const mockListChapters = vi.mocked(listChapters);
const mockReadChapter = vi.mocked(readChapter);
const mockCreateChapter = vi.mocked(createChapter);
const mockUpdateProjectMeta = vi.mocked(updateProjectMeta);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadInitialChapter', () => {
  it('carga el capituloActivo válido si existe en proyecto.json', async () => {
    const project = { ...PROJECT, capituloActivo: 'cap-01.md' };
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [{ path: '/tmp/mi-libro/capitulos/cap-01.md', filename: 'cap-01.md', title: 'Capítulo 1', status: 'in-progress' }],
    });
    mockReadChapter.mockResolvedValueOnce({ ok: true, value: '# Capítulo 1\n\nContenido.' });

    const result = await loadInitialChapter(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activeChapter.path).toBe('/tmp/mi-libro/capitulos/cap-01.md');
      expect(result.value.activeChapter.content).toBe('# Capítulo 1\n\nContenido.');
      expect(result.value.allChapters).toHaveLength(1);
    }
    expect(mockCreateChapter).not.toHaveBeenCalled();
  });

  it('cae al primer capítulo en progreso si capituloActivo falla', async () => {
    const project = { ...PROJECT, capituloActivo: 'cap-perdido.md' };
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [{ path: '/tmp/mi-libro/capitulos/cap-02.md', filename: 'cap-02.md', title: 'Capítulo 2', status: 'in-progress' as const }],
    });
    mockReadChapter
      .mockResolvedValueOnce({ ok: false, error: { kind: 'ReadFailed', path: '/tmp/cap-perdido.md', reason: 'ENOENT' } })
      .mockResolvedValueOnce({ ok: true, value: '# Capítulo 2\n\nContenido.' });
    mockUpdateProjectMeta.mockResolvedValueOnce({ ok: true, value: { ...project, capituloActivo: 'cap-02.md' } });

    const result = await loadInitialChapter(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activeChapter.path).toBe('/tmp/mi-libro/capitulos/cap-02.md');
      expect(result.value.allChapters).toHaveLength(1);
    }
  });

  it('crea cap-01.md cuando no hay capítulos y retorna lista de uno', async () => {
    mockListChapters.mockResolvedValueOnce({ ok: true, value: [] });
    mockCreateChapter.mockResolvedValueOnce({
      ok: true,
      value: { path: '/tmp/mi-libro/capitulos/cap-01.md', filename: 'cap-01.md', title: 'Capítulo 1', status: 'in-progress' },
    });
    mockUpdateProjectMeta.mockResolvedValueOnce({ ok: true, value: { ...PROJECT, capituloActivo: 'cap-01.md' } });

    const result = await loadInitialChapter(PROJECT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.activeChapter.path).toBe('/tmp/mi-libro/capitulos/cap-01.md');
      expect(result.value.allChapters).toHaveLength(1);
      expect(result.value.allChapters[0]?.filename).toBe('cap-01.md');
    }
    expect(mockCreateChapter).toHaveBeenCalledWith(PROJECT, 'Capítulo 1');
  });

  it('retorna lista ordenada de todos los capítulos en progreso', async () => {
    const project = { ...PROJECT, capituloActivo: 'cap-01.md' };
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [
        { path: '/tmp/mi-libro/capitulos/cap-02.md', filename: 'cap-02.md', title: 'Capítulo 2', status: 'in-progress' as const },
        { path: '/tmp/mi-libro/capitulos/cap-01.md', filename: 'cap-01.md', title: 'Capítulo 1', status: 'in-progress' as const },
        { path: '/tmp/mi-libro/capitulos-terminados/cap-00.md', filename: 'cap-00.md', title: 'Capítulo 0', status: 'finished' as const },
      ],
    });
    mockReadChapter.mockResolvedValueOnce({ ok: true, value: '# Capítulo 1' });

    const result = await loadInitialChapter(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Solo capítulos en progreso, ordenados por filename
      expect(result.value.allChapters).toHaveLength(2);
      expect(result.value.allChapters[0]?.filename).toBe('cap-01.md');
      expect(result.value.allChapters[1]?.filename).toBe('cap-02.md');
    }
  });
});
