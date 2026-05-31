import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  readTitulo,
  readCopyright,
  writeTitulo,
  writeCopyright,
  readDedicatoria,
  writeDedicatoria,
  readMetadata,
  writeMetadata,
  ensureFrontmatterFiles,
} from './frontmatter-fs';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => vi.clearAllMocks());

describe('readTitulo', () => {
  it('parsea un archivo existente', async () => {
    mockInvoke.mockResolvedValueOnce('---\ntitulo: Mi libro\nautor: Juan\n---\n');
    const result = await readTitulo('/proyecto');
    expect(result).toEqual({ titulo: 'Mi libro', autor: 'Juan' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/frontmatter/titulo.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readTitulo('/proyecto');
    expect(result).toBeNull();
  });
});

describe('readCopyright', () => {
  it('parsea un archivo existente', async () => {
    mockInvoke.mockResolvedValueOnce('---\nano: 2024\ntitular: Yo\nlicencia: MIT\n---\n');
    const result = await readCopyright('/proyecto');
    expect(result).toEqual({ ano: 2024, titular: 'Yo', licencia: 'MIT' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/frontmatter/copyright.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readCopyright('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeTitulo', () => {
  it('escribe el archivo con YAML serializado', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeTitulo('/proyecto', { titulo: 'El libro', autor: 'Autor' });
    const [cmd, args] = mockInvoke.mock.calls[0] as [string, { path: string; contents: string }];
    expect(cmd).toBe('write_text_file');
    expect(args.path).toBe('/proyecto/frontmatter/titulo.md');
    expect(args.contents).toContain('titulo: El libro');
    expect(args.contents).toContain('autor: Autor');
  });
});

describe('writeCopyright', () => {
  it('escribe el archivo con YAML serializado', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeCopyright('/proyecto', { ano: 2025, titular: 'Yo', licencia: 'MIT' });
    const [cmd, args] = mockInvoke.mock.calls[0] as [string, { path: string; contents: string }];
    expect(cmd).toBe('write_text_file');
    expect(args.path).toBe('/proyecto/frontmatter/copyright.md');
    expect(args.contents).toContain('ano: 2025');
  });
});

describe('readDedicatoria', () => {
  it('retorna contenido si el archivo existe', async () => {
    mockInvoke.mockResolvedValueOnce('Para ti, con amor.');
    const result = await readDedicatoria('/proyecto');
    expect(result).toEqual({ contenido: 'Para ti, con amor.' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/frontmatter/dedicatoria.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readDedicatoria('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeDedicatoria', () => {
  it('escribe el contenido en la ruta correcta (markdown plano)', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeDedicatoria('/proyecto', { contenido: 'Para ti.' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/proyecto/frontmatter/dedicatoria.md',
      contents: 'Para ti.',
    });
  });
});

describe('readMetadata', () => {
  it('parsea un archivo metadata.yaml existente (YAML puro sin ---)', async () => {
    mockInvoke.mockResolvedValueOnce('idioma: es\neditorial: Planeta\n');
    const result = await readMetadata('/proyecto');
    expect(result).toMatchObject({ idioma: 'es', editorial: 'Planeta' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/frontmatter/metadata.yaml',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readMetadata('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeMetadata', () => {
  it('escribe YAML puro en metadata.yaml (sin delimitadores ---)', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeMetadata('/proyecto', {
      idioma: 'es',
      descripcion: '',
      editorial: 'Planeta',
      isbn: '',
      genero: '',
      fechaPublicacion: '',
    });
    const [cmd, args] = mockInvoke.mock.calls[0] as [string, { path: string; contents: string }];
    expect(cmd).toBe('write_text_file');
    expect(args.path).toBe('/proyecto/frontmatter/metadata.yaml');
    expect(args.contents).toContain('idioma: es');
    expect(args.contents).not.toMatch(/^---/);
  });
});

describe('ensureFrontmatterFiles', () => {
  it('crea los 4 archivos si no existen (titulo, copyright, dedicatoria, metadata)', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(false)     // path_exists titulo
      .mockResolvedValueOnce(undefined) // write_text_file titulo
      .mockResolvedValueOnce(false)     // path_exists copyright
      .mockResolvedValueOnce(undefined) // write_text_file copyright
      .mockResolvedValueOnce(false)     // path_exists dedicatoria
      .mockResolvedValueOnce(undefined) // write_text_file dedicatoria
      .mockResolvedValueOnce(false)     // path_exists metadata
      .mockResolvedValueOnce(undefined); // write_text_file metadata

    await ensureFrontmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(4);
    const paths = writeCalls.map((c) => (c[1] as { path: string }).path);
    expect(paths).toContain('/proyecto/frontmatter/titulo.md');
    expect(paths).toContain('/proyecto/frontmatter/copyright.md');
    expect(paths).toContain('/proyecto/frontmatter/dedicatoria.md');
    expect(paths).toContain('/proyecto/frontmatter/metadata.yaml');
  });

  it('metadata.yaml se crea con idioma: en por default', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(true)      // path_exists titulo → exists
      .mockResolvedValueOnce(true)      // path_exists copyright → exists
      .mockResolvedValueOnce(true)      // path_exists dedicatoria → exists
      .mockResolvedValueOnce(false)     // path_exists metadata → no existe
      .mockResolvedValueOnce(undefined); // write_text_file metadata

    await ensureFrontmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(1);
    const contents = (writeCalls[0]![1] as { contents: string }).contents;
    expect(contents).toContain('idioma: en');
    expect(contents).not.toMatch(/^---/);
  });

  it('metadata.yaml se crea con el idioma pasado como argumento', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(true)      // path_exists titulo → exists
      .mockResolvedValueOnce(true)      // path_exists copyright → exists
      .mockResolvedValueOnce(true)      // path_exists dedicatoria → exists
      .mockResolvedValueOnce(false)     // path_exists metadata → no existe
      .mockResolvedValueOnce(undefined); // write_text_file metadata

    await ensureFrontmatterFiles('/proyecto', 'es');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(1);
    const contents = (writeCalls[0]![1] as { contents: string }).contents;
    expect(contents).toContain('idioma: es');
  });

  it('no sobreescribe archivos existentes', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(true)      // path_exists titulo → exists
      .mockResolvedValueOnce(true)      // path_exists copyright → exists
      .mockResolvedValueOnce(true)      // path_exists dedicatoria → exists
      .mockResolvedValueOnce(true);     // path_exists metadata → exists

    await ensureFrontmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(0);
  });
});
