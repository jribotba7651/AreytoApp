import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/frontmatter-fs', () => ({
  readTitulo: vi.fn().mockResolvedValue(null),
  readCopyright: vi.fn().mockResolvedValue(null),
  readDedicatoria: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/backmatter-fs', () => ({
  readAgradecimientos: vi.fn().mockResolvedValue(null),
}));

import { invoke } from '@tauri-apps/api/core';
import { readTitulo, readCopyright, readDedicatoria } from '@/lib/frontmatter-fs';
import { readAgradecimientos } from '@/lib/backmatter-fs';
import { exportBookMarkdown, countExportableFiles, buildExportAdditions } from './export-service';

const mockInvoke = vi.mocked(invoke);
const mockReadTitulo = vi.mocked(readTitulo);
const mockReadCopyright = vi.mocked(readCopyright);
const mockReadDedicatoria = vi.mocked(readDedicatoria);
const mockReadAgradecimientos = vi.mocked(readAgradecimientos);

beforeEach(() => vi.clearAllMocks());

describe('exportBookMarkdown', () => {
  it('scope ambos → includeTerminados=true, includeEnProgreso=true, sin frontmatter/backmatter', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: true,
      outputPath: '/out.md',
      prependContent: null,
      appendContent: null,
    });
  });

  it('scope terminados → includeTerminados=true, includeEnProgreso=false', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await exportBookMarkdown('/proyecto', { scope: 'terminados' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: false,
      outputPath: '/out.md',
      prependContent: null,
      appendContent: null,
    });
  });

  it('scope en-progreso → includeTerminados=false, includeEnProgreso=true', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await exportBookMarkdown('/proyecto', { scope: 'en-progreso' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: false,
      includeEnProgreso: true,
      outputPath: '/out.md',
      prependContent: null,
      appendContent: null,
    });
  });

  it('propaga el error si invoke falla', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md')
    ).rejects.toThrow('write failed');
  });

  it('con frontmatter lleno pasa prependContent al command', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'Mi libro', autor: 'Juan', subtitulo: undefined });
    mockReadCopyright.mockResolvedValueOnce({ ano: 2024, titular: 'Juan', licencia: 'Todos los derechos reservados' });
    mockInvoke.mockResolvedValueOnce(undefined);

    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');

    const callArgs = mockInvoke.mock.calls[0]![1] as Record<string, unknown>;
    expect(typeof callArgs.prependContent).toBe('string');
    expect((callArgs.prependContent as string)).toContain('# Mi libro');
    expect((callArgs.prependContent as string)).toContain('**Juan**');
    expect(callArgs.appendContent).toBeNull();
  });

  it('con backmatter lleno pasa appendContent al command', async () => {
    mockReadAgradecimientos.mockResolvedValueOnce({ contenido: 'Gracias a todos.' });
    mockInvoke.mockResolvedValueOnce(undefined);

    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');

    const callArgs = mockInvoke.mock.calls[0]![1] as Record<string, unknown>;
    expect(callArgs.prependContent).toBeNull();
    expect(callArgs.appendContent).toContain('## Agradecimientos');
    expect(callArgs.appendContent).toContain('Gracias a todos.');
  });
});

describe('buildExportAdditions', () => {
  it('frontmatter y backmatter null → prependContent y appendContent null', async () => {
    const result = await buildExportAdditions('/proyecto');
    expect(result.prependContent).toBeNull();
    expect(result.appendContent).toBeNull();
  });

  it('titulo presente + sin backmatter → prependContent con portada, appendContent null', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'El libro', autor: 'Autor', subtitulo: undefined });
    const result = await buildExportAdditions('/proyecto');
    expect(result.prependContent).toContain('# El libro');
    expect(result.appendContent).toBeNull();
  });

  it('sin frontmatter + agradecimientos presente → prependContent null, appendContent con header', async () => {
    mockReadAgradecimientos.mockResolvedValueOnce({ contenido: 'Gracias.' });
    const result = await buildExportAdditions('/proyecto');
    expect(result.prependContent).toBeNull();
    expect(result.appendContent).toContain('## Agradecimientos');
  });

  it('portada + dedicatoria → prependContent con ambas separadas por ---', async () => {
    mockReadTitulo.mockResolvedValueOnce({ titulo: 'El libro', autor: 'Autor', subtitulo: undefined });
    mockReadDedicatoria.mockResolvedValueOnce({ contenido: 'Para ti.' });
    const result = await buildExportAdditions('/proyecto');
    expect(result.prependContent).toContain('# El libro');
    expect(result.prependContent).toContain('\n\n---\n\n');
    expect(result.prependContent).toContain('## Dedicatoria');
    expect(result.prependContent).toContain('Para ti.');
  });

  it('dedicatoria whitespace only → prependContent null aunque solo dedicatoria existe', async () => {
    mockReadDedicatoria.mockResolvedValueOnce({ contenido: '   ' });
    const result = await buildExportAdditions('/proyecto');
    expect(result.prependContent).toBeNull();
  });
});

describe('countExportableFiles', () => {
  it('cuenta archivos .md en capitulos-terminados para scope terminados', async () => {
    mockInvoke.mockResolvedValueOnce([
      { name: 'cap-01.md', is_file: true, is_dir: false },
      { name: 'cap-02.md', is_file: true, is_dir: false },
    ]);
    const count = await countExportableFiles('/proyecto', { scope: 'terminados' });
    expect(count).toBe(2);
    expect(mockInvoke).toHaveBeenCalledWith('list_dir', {
      path: '/proyecto/capitulos-terminados',
    });
  });

  it('cuenta archivos .md en capitulos para scope en-progreso', async () => {
    mockInvoke.mockResolvedValueOnce([
      { name: 'cap-03.md', is_file: true, is_dir: false },
    ]);
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
    mockInvoke
      .mockResolvedValueOnce([
        { name: 'cap-01.md', is_file: true, is_dir: false },
      ])
      .mockResolvedValueOnce([
        { name: 'cap-02.md', is_file: true, is_dir: false },
        { name: 'cap-03.md', is_file: true, is_dir: false },
      ]);
    const count = await countExportableFiles('/proyecto', { scope: 'ambos' });
    expect(count).toBe(3);
  });

  it('excluye subdirectorios y archivos no-.md', async () => {
    mockInvoke.mockResolvedValueOnce([
      { name: 'cap-01.md', is_file: true, is_dir: false },
      { name: 'notas', is_file: false, is_dir: true },
      { name: 'readme.txt', is_file: true, is_dir: false },
    ]);
    const count = await countExportableFiles('/proyecto', { scope: 'terminados' });
    expect(count).toBe(1);
  });

  it('scope en-progreso no llama list_dir en capitulos-terminados', async () => {
    mockInvoke.mockResolvedValueOnce([
      { name: 'cap-02.md', is_file: true, is_dir: false },
    ]);
    await countExportableFiles('/proyecto', { scope: 'en-progreso' });
    const calledPaths = mockInvoke.mock.calls.map((c) => (c[1] as { path: string }).path);
    expect(calledPaths).not.toContain('/proyecto/capitulos-terminados');
    expect(calledPaths).toContain('/proyecto/capitulos');
  });
});
