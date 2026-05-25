import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/frontmatter-fs', () => ({
  readTitulo: vi.fn().mockResolvedValue(null),
  readCopyright: vi.fn().mockResolvedValue(null),
  readDedicatoria: vi.fn().mockResolvedValue(null),
  readMetadata: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/backmatter-fs', () => ({
  readAgradecimientos: vi.fn().mockResolvedValue(null),
}));

import { invoke } from '@tauri-apps/api/core';
import { readTitulo, readCopyright, readDedicatoria } from '@/lib/frontmatter-fs';
import { readAgradecimientos } from '@/lib/backmatter-fs';
import { exportBookMarkdown, exportBookDocx, countExportableFiles, buildExportAdditions } from './export-service';

const mockInvoke = vi.mocked(invoke);
const mockReadTitulo = vi.mocked(readTitulo);
const mockReadCopyright = vi.mocked(readCopyright);
const mockReadDedicatoria = vi.mocked(readDedicatoria);
const mockReadAgradecimientos = vi.mocked(readAgradecimientos);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: list_dir returns empty array (no chapters → empty TOC); other commands succeed.
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_dir') return Promise.resolve([]);
    return Promise.resolve(undefined);
  });
});

describe('exportBookMarkdown', () => {
  it('scope ambos → includeTerminados=true, includeEnProgreso=true, sin frontmatter/backmatter', async () => {
    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: true,
      outputPath: '/out.md',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('scope terminados → includeTerminados=true, includeEnProgreso=false', async () => {
    await exportBookMarkdown('/proyecto', { scope: 'terminados' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: false,
      outputPath: '/out.md',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('scope en-progreso → includeTerminados=false, includeEnProgreso=true', async () => {
    await exportBookMarkdown('/proyecto', { scope: 'en-progreso' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: false,
      includeEnProgreso: true,
      outputPath: '/out.md',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('propaga el error si invoke falla en export_book_markdown', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'export_book_markdown') return Promise.reject(new Error('write failed'));
      if (cmd === 'list_dir') return Promise.resolve([]);
      return Promise.resolve(undefined);
    });
    await expect(
      exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md')
    ).rejects.toThrow('write failed');
  });

  it('con frontmatter lleno pasa prependContent al command', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'Mi libro', autor: 'Juan', subtitulo: undefined });
    mockReadCopyright.mockResolvedValueOnce({ ano: 2024, titular: 'Juan', licencia: 'Todos los derechos reservados' });

    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');

    const exportCall = mockInvoke.mock.calls.find((c) => c[0] === 'export_book_markdown');
    const callArgs = exportCall![1] as Record<string, unknown>;
    expect(typeof callArgs.prependContent).toBe('string');
    expect(callArgs.prependContent as string).toContain('# Mi libro');
    expect(callArgs.prependContent as string).toContain('**Juan**');
    expect(callArgs.appendContent).toBeNull();
    expect(callArgs.indiceContent).toBeNull();
    expect(callArgs.chapterSlugs).toEqual({});
  });

  it('con backmatter lleno pasa appendContent al command', async () => {
    mockReadAgradecimientos.mockResolvedValueOnce({ contenido: 'Gracias a todos.' });

    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');

    const exportCall = mockInvoke.mock.calls.find((c) => c[0] === 'export_book_markdown');
    const callArgs = exportCall![1] as Record<string, unknown>;
    expect(callArgs.prependContent).toBeNull();
    expect(callArgs.appendContent).toContain('## Agradecimientos');
    expect(callArgs.appendContent).toContain('Gracias a todos.');
    expect(callArgs.indiceContent).toBeNull();
    expect(callArgs.chapterSlugs).toEqual({});
  });
});

describe('buildExportAdditions', () => {
  it('frontmatter y backmatter null, sin capítulos → todo null excepto chapterSlugs vacío', async () => {
    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.prependContent).toBeNull();
    expect(result.appendContent).toBeNull();
    expect(result.indiceContent).toBeNull();
    expect(result.chapterSlugs).toEqual({});
  });

  it('titulo presente + sin backmatter → prependContent con portada, appendContent null', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'El libro', autor: 'Autor', subtitulo: undefined });
    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.prependContent).toContain('# El libro');
    expect(result.appendContent).toBeNull();
  });

  it('sin frontmatter + agradecimientos presente → prependContent null, appendContent con header', async () => {
    mockReadAgradecimientos.mockResolvedValueOnce({ contenido: 'Gracias.' });
    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.prependContent).toBeNull();
    expect(result.appendContent).toContain('## Agradecimientos');
  });

  it('portada + dedicatoria → prependContent con ambas separadas por ---', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'El libro', autor: 'Autor', subtitulo: undefined });
    mockReadDedicatoria.mockResolvedValueOnce({ contenido: 'Para ti.' });
    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.prependContent).toContain('# El libro');
    expect(result.prependContent).toContain('\n\n---\n\n');
    expect(result.prependContent).toContain('## Dedicatoria');
    expect(result.prependContent).toContain('Para ti.');
  });

  it('dedicatoria whitespace only → prependContent null aunque solo dedicatoria existe', async () => {
    mockReadDedicatoria.mockResolvedValueOnce({ contenido: '   ' });
    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.prependContent).toBeNull();
  });

  it('scope ambos con capítulos → indiceContent y chapterSlugs generados', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir' && a.path.endsWith('capitulos-terminados')) {
        return Promise.resolve([{ name: 'cap-01.md', is_file: true, is_dir: false }]);
      }
      if (cmd === 'list_dir' && a.path.endsWith('capitulos')) {
        return Promise.resolve([{ name: 'cap-02.md', is_file: true, is_dir: false }]);
      }
      if (cmd === 'read_text_file' && a.path.includes('cap-01.md')) {
        return Promise.resolve('# El primer capítulo\n\nContenido.');
      }
      if (cmd === 'read_text_file' && a.path.includes('cap-02.md')) {
        return Promise.resolve('# El segundo capítulo\n\nContenido.');
      }
      return Promise.resolve(undefined);
    });

    const result = await buildExportAdditions('/proyecto', { scope: 'ambos' });
    expect(result.indiceContent).toContain('## Índice');
    expect(result.indiceContent).toContain('[El primer capítulo](#cap-01)');
    expect(result.indiceContent).toContain('[El segundo capítulo](#cap-02)');
    expect(result.chapterSlugs).toEqual({ 'cap-01.md': 'cap-01', 'cap-02.md': 'cap-02' });
  });

  it('scope terminados → solo lee capitulos-terminados, no capitulos', async () => {
    const calledPaths: string[] = [];
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir') {
        calledPaths.push(a.path);
        return Promise.resolve([]);
      }
      return Promise.resolve(undefined);
    });

    await buildExportAdditions('/proyecto', { scope: 'terminados' });
    expect(calledPaths).toContain('/proyecto/capitulos-terminados');
    expect(calledPaths).not.toContain('/proyecto/capitulos');
  });

  it('scope en-progreso → solo lee capitulos, no capitulos-terminados', async () => {
    const calledPaths: string[] = [];
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir') {
        calledPaths.push(a.path);
        return Promise.resolve([]);
      }
      return Promise.resolve(undefined);
    });

    await buildExportAdditions('/proyecto', { scope: 'en-progreso' });
    expect(calledPaths).not.toContain('/proyecto/capitulos-terminados');
    expect(calledPaths).toContain('/proyecto/capitulos');
  });

  it('capítulo sin H1 → usa filename como título en el índice', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir') {
        return Promise.resolve([{ name: 'cap-01.md', is_file: true, is_dir: false }]);
      }
      if (cmd === 'read_text_file' && a.path.includes('cap-01.md')) {
        return Promise.resolve('Sin encabezado, solo texto.');
      }
      return Promise.resolve(undefined);
    });

    const result = await buildExportAdditions('/proyecto', { scope: 'terminados' });
    expect(result.indiceContent).toContain('[cap-01](#cap-01)');
  });
});

describe('exportBookDocx', () => {
  it('scope ambos → invoca export_book_docx con flags correctos', async () => {
    await exportBookDocx('/proyecto', { scope: 'ambos' }, '/out.docx');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_docx', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: true,
      outputPath: '/out.docx',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('scope terminados → includeTerminados=true, includeEnProgreso=false', async () => {
    await exportBookDocx('/proyecto', { scope: 'terminados' }, '/out.docx');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_docx', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: false,
      outputPath: '/out.docx',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('scope en-progreso → includeTerminados=false, includeEnProgreso=true', async () => {
    await exportBookDocx('/proyecto', { scope: 'en-progreso' }, '/out.docx');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_docx', {
      projectPath: '/proyecto',
      includeTerminados: false,
      includeEnProgreso: true,
      outputPath: '/out.docx',
      pandocFrontmatterBlock: null,
      prependContent: null,
      appendContent: null,
      indiceContent: null,
      chapterSlugs: {},
    });
  });

  it('propaga el error si invoke falla en export_book_docx', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'export_book_docx') return Promise.reject(new Error('pandoc falló'));
      if (cmd === 'list_dir') return Promise.resolve([]);
      return Promise.resolve(undefined);
    });
    await expect(
      exportBookDocx('/proyecto', { scope: 'ambos' }, '/out.docx')
    ).rejects.toThrow('pandoc falló');
  });

  it('con frontmatter lleno pasa pandocFrontmatterBlock y prependContent al command', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'Mi libro', autor: 'Juan', subtitulo: undefined });
    mockReadCopyright.mockResolvedValueOnce({ ano: 2024, titular: 'Juan', licencia: 'Todos los derechos reservados' });

    await exportBookDocx('/proyecto', { scope: 'ambos' }, '/out.docx');

    const docxCall = mockInvoke.mock.calls.find((c) => c[0] === 'export_book_docx');
    const callArgs = docxCall![1] as Record<string, unknown>;
    expect(typeof callArgs.pandocFrontmatterBlock).toBe('string');
    expect(callArgs.pandocFrontmatterBlock as string).toContain('title:');
    expect(typeof callArgs.prependContent).toBe('string');
    expect(callArgs.prependContent as string).toContain('# Mi libro');
  });
});

describe('countExportableFiles', () => {
  it('cuenta archivos .md en capitulos-terminados para scope terminados', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir' && a.path.endsWith('capitulos-terminados')) {
        return Promise.resolve([
          { name: 'cap-01.md', is_file: true, is_dir: false },
          { name: 'cap-02.md', is_file: true, is_dir: false },
        ]);
      }
      return Promise.resolve([]);
    });
    const count = await countExportableFiles('/proyecto', { scope: 'terminados' });
    expect(count).toBe(2);
    expect(mockInvoke).toHaveBeenCalledWith('list_dir', {
      path: '/proyecto/capitulos-terminados',
    });
  });

  it('cuenta archivos .md en capitulos para scope en-progreso', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir' && a.path.endsWith('capitulos')) {
        return Promise.resolve([{ name: 'cap-03.md', is_file: true, is_dir: false }]);
      }
      return Promise.resolve([]);
    });
    const count = await countExportableFiles('/proyecto', { scope: 'en-progreso' });
    expect(count).toBe(1);
    expect(mockInvoke).toHaveBeenCalledWith('list_dir', {
      path: '/proyecto/capitulos',
    });
  });

  it('devuelve 0 si el directorio no existe (error de invoke)', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('dir not found'));
    const count = await countExportableFiles('/proyecto', { scope: 'en-progreso' });
    expect(count).toBe(0);
  });

  it('suma ambas carpetas para scope ambos', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir' && a.path.endsWith('capitulos-terminados')) {
        return Promise.resolve([{ name: 'cap-01.md', is_file: true, is_dir: false }]);
      }
      if (cmd === 'list_dir' && a.path.endsWith('capitulos')) {
        return Promise.resolve([
          { name: 'cap-02.md', is_file: true, is_dir: false },
          { name: 'cap-03.md', is_file: true, is_dir: false },
        ]);
      }
      return Promise.resolve([]);
    });
    const count = await countExportableFiles('/proyecto', { scope: 'ambos' });
    expect(count).toBe(3);
  });

  it('excluye subdirectorios y archivos no-.md', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'list_dir') {
        return Promise.resolve([
          { name: 'cap-01.md', is_file: true, is_dir: false },
          { name: 'notas', is_file: false, is_dir: true },
          { name: 'readme.txt', is_file: true, is_dir: false },
        ]);
      }
      return Promise.resolve([]);
    });
    const count = await countExportableFiles('/proyecto', { scope: 'terminados' });
    expect(count).toBe(1);
  });

  it('scope en-progreso no llama list_dir en capitulos-terminados', async () => {
    const calledPaths: string[] = [];
    mockInvoke.mockImplementation((cmd: string, args?: unknown) => {
      const a = args as { path: string };
      if (cmd === 'list_dir') {
        calledPaths.push(a.path);
        return Promise.resolve([{ name: 'cap-02.md', is_file: true, is_dir: false }]);
      }
      return Promise.resolve(undefined);
    });
    await countExportableFiles('/proyecto', { scope: 'en-progreso' });
    expect(calledPaths).not.toContain('/proyecto/capitulos-terminados');
    expect(calledPaths).toContain('/proyecto/capitulos');
  });
});
