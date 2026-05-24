import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadBook } from './book-loader';
import type { Project } from '@/types/project';

vi.mock('./project-fs', () => ({
  listChapters: vi.fn(),
  readChapter: vi.fn(),
}));

vi.mock('./frontmatter-fs', () => ({
  readTitulo: vi.fn(),
  readCopyright: vi.fn(),
  readDedicatoria: vi.fn(),
}));

vi.mock('./backmatter-fs', () => ({
  readAgradecimientos: vi.fn(),
}));

import { listChapters, readChapter } from './project-fs';
import { readTitulo, readCopyright, readDedicatoria } from './frontmatter-fs';
import { readAgradecimientos } from './backmatter-fs';
const mockListChapters = vi.mocked(listChapters);
const mockReadChapter = vi.mocked(readChapter);
const mockReadTitulo = vi.mocked(readTitulo);
const mockReadCopyright = vi.mocked(readCopyright);
const mockReadDedicatoria = vi.mocked(readDedicatoria);
const mockReadAgradecimientos = vi.mocked(readAgradecimientos);

const PROJECT: Project = {
  rootPath: '/tmp/mi-libro',
  nombre: 'Mi Libro',
  creado: '2026-05-21T00:00:00.000Z',
  capituloActivo: null,
};

const makeChapter = (filename: string, status: 'in-progress' | 'finished' = 'in-progress') => ({
  filename,
  path: `/tmp/mi-libro/capitulos/${filename}`,
  title: filename.replace('.md', ''),
  status,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockReadTitulo.mockResolvedValue(null);
  mockReadCopyright.mockResolvedValue(null);
  mockReadDedicatoria.mockResolvedValue(null);
  mockReadAgradecimientos.mockResolvedValue(null);
});

describe('loadBook', () => {
  it('retorna sections vacías si listChapters falla', async () => {
    mockListChapters.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'ReadFailed', path: '/tmp', reason: 'ENOENT' },
    });

    const result = await loadBook(PROJECT);

    expect(result.projectName).toBe('Mi Libro');
    expect(result.sections).toHaveLength(0);
    expect(result.frontmatter).toEqual({ titulo: null, copyright: null, dedicatoria: null });
    expect(result.backmatter).toEqual({ agradecimientos: null });
  });

  it('incluye frontmatter cuando los archivos existen', async () => {
    mockListChapters.mockResolvedValueOnce({ ok: true, value: [] });
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'Mi Libro', autor: 'Yo' });
    mockReadCopyright.mockResolvedValueOnce({ ano: 2025, titular: 'Yo', licencia: 'MIT' });
    mockReadDedicatoria.mockResolvedValueOnce({ contenido: 'Para ti.' });

    const result = await loadBook(PROJECT);

    expect(result.frontmatter.titulo).toEqual({ titulo: 'Mi Libro', autor: 'Yo' });
    expect(result.frontmatter.copyright).toEqual({ ano: 2025, titular: 'Yo', licencia: 'MIT' });
    expect(result.frontmatter.dedicatoria).toEqual({ contenido: 'Para ti.' });
  });

  it('incluye backmatter cuando el archivo existe', async () => {
    mockListChapters.mockResolvedValueOnce({ ok: true, value: [] });
    mockReadAgradecimientos.mockResolvedValueOnce({ contenido: 'Gracias a todos.' });

    const result = await loadBook(PROJECT);

    expect(result.backmatter.agradecimientos).toEqual({ contenido: 'Gracias a todos.' });
  });

  it('frontmatter y backmatter null cuando los archivos no existen', async () => {
    mockListChapters.mockResolvedValueOnce({ ok: true, value: [] });

    const result = await loadBook(PROJECT);

    expect(result.frontmatter.titulo).toBeNull();
    expect(result.frontmatter.copyright).toBeNull();
    expect(result.frontmatter.dedicatoria).toBeNull();
    expect(result.backmatter.agradecimientos).toBeNull();
  });

  it('ordena los capítulos por filename ascendente', async () => {
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [makeChapter('cap-03.md'), makeChapter('cap-01.md'), makeChapter('cap-02.md')],
    });
    mockReadChapter.mockResolvedValue({ ok: true, value: '# Capítulo' });

    const result = await loadBook(PROJECT);

    expect(result.sections[0]?.kind === 'chapter' && result.sections[0].chapter.filename).toBe('cap-01.md');
    expect(result.sections[1]?.kind === 'chapter' && result.sections[1].chapter.filename).toBe('cap-02.md');
    expect(result.sections[2]?.kind === 'chapter' && result.sections[2].chapter.filename).toBe('cap-03.md');
  });

  it('filtra solo capítulos in-progress', async () => {
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [
        makeChapter('cap-01.md', 'in-progress'),
        makeChapter('cap-02.md', 'finished'),
        makeChapter('cap-03.md', 'in-progress'),
      ],
    });
    mockReadChapter.mockResolvedValue({ ok: true, value: '# Capítulo' });

    const result = await loadBook(PROJECT);

    expect(result.sections).toHaveLength(2);
    expect(result.sections.every((s) => s.chapter.status === 'in-progress')).toBe(true);
  });

  it('marca como chapter-error los capítulos que fallan al leer', async () => {
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [makeChapter('cap-01.md'), makeChapter('cap-02.md')],
    });
    mockReadChapter
      .mockResolvedValueOnce({ ok: true, value: '# Capítulo 1' })
      .mockResolvedValueOnce({ ok: false, error: { kind: 'ReadFailed', path: '', reason: 'ENOENT' } });

    const result = await loadBook(PROJECT);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0]?.kind).toBe('chapter');
    expect(result.sections[1]?.kind).toBe('chapter-error');
    if (result.sections[1]?.kind === 'chapter-error') {
      expect(result.sections[1].reason).toBe('ReadFailed');
    }
  });

  it('carga contenidos en paralelo y preserva el orden', async () => {
    mockListChapters.mockResolvedValueOnce({
      ok: true,
      value: [makeChapter('cap-01.md'), makeChapter('cap-02.md'), makeChapter('cap-03.md')],
    });

    let resolveOrder: string[] = [];
    mockReadChapter
      .mockImplementationOnce(() => new Promise((r) => setTimeout(() => {
        resolveOrder.push('cap-01');
        r({ ok: true, value: '# Cap 1' });
      }, 30)))
      .mockImplementationOnce(() => new Promise((r) => setTimeout(() => {
        resolveOrder.push('cap-02');
        r({ ok: true, value: '# Cap 2' });
      }, 10)))
      .mockImplementationOnce(() => new Promise((r) => setTimeout(() => {
        resolveOrder.push('cap-03');
        r({ ok: true, value: '# Cap 3' });
      }, 20)));

    const result = await loadBook(PROJECT);

    // Resolve order fue cap-02, cap-03, cap-01 (por delays)
    expect(resolveOrder).toEqual(['cap-02', 'cap-03', 'cap-01']);
    // Pero el resultado sigue en orden cap-01, cap-02, cap-03
    expect(result.sections[0]?.chapter.filename).toBe('cap-01.md');
    expect(result.sections[1]?.chapter.filename).toBe('cap-02.md');
    expect(result.sections[2]?.chapter.filename).toBe('cap-03.md');
  });
});
