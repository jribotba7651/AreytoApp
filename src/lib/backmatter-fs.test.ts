import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  readAgradecimientos,
  writeAgradecimientos,
  readSobreElAutor,
  writeSobreElAutor,
  readOtrosLibros,
  writeOtrosLibros,
  ensureBackmatterFiles,
} from './backmatter-fs';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => vi.clearAllMocks());

describe('readAgradecimientos', () => {
  it('retorna contenido si el archivo existe', async () => {
    mockInvoke.mockResolvedValueOnce('Gracias a todos.');
    const result = await readAgradecimientos('/proyecto');
    expect(result).toEqual({ contenido: 'Gracias a todos.' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/backmatter/agradecimientos.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readAgradecimientos('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeAgradecimientos', () => {
  it('escribe el contenido en la ruta correcta', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeAgradecimientos('/proyecto', { contenido: 'Gracias.' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/proyecto/backmatter/agradecimientos.md',
      contents: 'Gracias.',
    });
  });
});

describe('readSobreElAutor', () => {
  it('retorna contenido si el archivo existe', async () => {
    mockInvoke.mockResolvedValueOnce('Bio del autor.');
    const result = await readSobreElAutor('/proyecto');
    expect(result).toEqual({ contenido: 'Bio del autor.' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/backmatter/sobre-el-autor.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readSobreElAutor('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeSobreElAutor', () => {
  it('escribe el contenido en la ruta correcta', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeSobreElAutor('/proyecto', { contenido: 'Bio.' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/proyecto/backmatter/sobre-el-autor.md',
      contents: 'Bio.',
    });
  });
});

describe('readOtrosLibros', () => {
  it('retorna contenido si el archivo existe', async () => {
    mockInvoke.mockResolvedValueOnce('Libro anterior.');
    const result = await readOtrosLibros('/proyecto');
    expect(result).toEqual({ contenido: 'Libro anterior.' });
    expect(mockInvoke).toHaveBeenCalledWith('read_text_file', {
      path: '/proyecto/backmatter/otros-libros.md',
    });
  });

  it('retorna null si el archivo no existe', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('not found'));
    const result = await readOtrosLibros('/proyecto');
    expect(result).toBeNull();
  });
});

describe('writeOtrosLibros', () => {
  it('escribe el contenido en la ruta correcta', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await writeOtrosLibros('/proyecto', { contenido: 'Otro libro.' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/proyecto/backmatter/otros-libros.md',
      contents: 'Otro libro.',
    });
  });
});

describe('ensureBackmatterFiles', () => {
  it('crea los 3 archivos si no existen', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(false)     // path_exists agradecimientos
      .mockResolvedValueOnce(undefined) // write agradecimientos
      .mockResolvedValueOnce(false)     // path_exists sobre-el-autor
      .mockResolvedValueOnce(undefined) // write sobre-el-autor
      .mockResolvedValueOnce(false)     // path_exists otros-libros
      .mockResolvedValueOnce(undefined); // write otros-libros

    await ensureBackmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(3);
    expect((writeCalls[0]![1] as { path: string }).path).toBe(
      '/proyecto/backmatter/agradecimientos.md'
    );
    expect((writeCalls[1]![1] as { path: string }).path).toBe(
      '/proyecto/backmatter/sobre-el-autor.md'
    );
    expect((writeCalls[2]![1] as { path: string }).path).toBe(
      '/proyecto/backmatter/otros-libros.md'
    );
  });

  it('no sobreescribe archivos que ya existen', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(true)      // path_exists agradecimientos
      .mockResolvedValueOnce(true)      // path_exists sobre-el-autor
      .mockResolvedValueOnce(true);     // path_exists otros-libros

    await ensureBackmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(0);
  });
});
