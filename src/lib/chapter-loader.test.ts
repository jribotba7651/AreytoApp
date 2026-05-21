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
    mockReadChapter.mockResolvedValueOnce({ ok: true, value: '# Capítulo 1\n\nContenido.' });

    const result = await loadInitialChapter(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.path).toBe('/tmp/mi-libro/capitulos/cap-01.md');
      expect(result.value.content).toBe('# Capítulo 1\n\nContenido.');
    }
    expect(mockListChapters).not.toHaveBeenCalled();
  });

  it('cae al primer capítulo en progreso si capituloActivo falla', async () => {
    const project = { ...PROJECT, capituloActivo: 'cap-perdido.md' };
    mockReadChapter
      .mockResolvedValueOnce({ ok: false, error: { kind: 'ReadFailed', path: '/tmp/cap-perdido.md', reason: 'ENOENT' } })
      .mockResolvedValueOnce({ ok: true, value: '# Capítulo 2\n\nContenido.' });

    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [{ path: '/tmp/mi-libro/capitulos/cap-02.md', filename: 'cap-02.md', title: 'Capítulo 2', status: 'in-progress' }],
    });
    mockUpdateProjectMeta.mockResolvedValueOnce({ ok: true, value: { ...project, capituloActivo: 'cap-02.md' } });

    const result = await loadInitialChapter(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.path).toBe('/tmp/mi-libro/capitulos/cap-02.md');
    }
  });

  it('crea cap-01.md cuando no hay capítulos', async () => {
    mockListChapters.mockResolvedValueOnce({ ok: true, value: [] });
    mockCreateChapter.mockResolvedValueOnce({
      ok: true,
      value: { path: '/tmp/mi-libro/capitulos/cap-01.md', filename: 'cap-01.md', title: 'Capítulo 1', status: 'in-progress' },
    });
    mockUpdateProjectMeta.mockResolvedValueOnce({ ok: true, value: { ...PROJECT, capituloActivo: 'cap-01.md' } });

    const result = await loadInitialChapter(PROJECT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.path).toBe('/tmp/mi-libro/capitulos/cap-01.md');
    }
    expect(mockCreateChapter).toHaveBeenCalledWith(PROJECT, 'Capítulo 1');
  });
});
