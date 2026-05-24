import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { exportBookMarkdown, countExportableFiles } from './export-service';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => vi.clearAllMocks());

describe('exportBookMarkdown', () => {
  it('scope ambos → includeTerminados=true, includeEnProgreso=true', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md');
    expect(mockInvoke).toHaveBeenCalledWith('export_book_markdown', {
      projectPath: '/proyecto',
      includeTerminados: true,
      includeEnProgreso: true,
      outputPath: '/out.md',
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
    });
  });

  it('propaga el error si invoke falla', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      exportBookMarkdown('/proyecto', { scope: 'ambos' }, '/out.md')
    ).rejects.toThrow('write failed');
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
});
