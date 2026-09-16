import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { readBookmarks, writeBookmarks, createBookmarkId } from './bookmarks';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readBookmarks', () => {
  it('devuelve array vacio si el archivo no existe', async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const result = await readBookmarks('/tmp/libro');

    expect(result).toEqual([]);
    expect(mockInvoke).toHaveBeenCalledWith('path_exists', { path: '/tmp/libro/.notes/bookmarks.json' });
  });

  it('devuelve marcadores parseados del archivo', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(
      JSON.stringify([
        { id: 'bm1', title: 'Revisar final', chapterFilename: 'cap-01.md', note: 'Ajustar ritmo', createdAt: '2026-09-16' },
      ]),
    );

    const result = await readBookmarks('/tmp/libro');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'bm1', title: 'Revisar final', chapterFilename: 'cap-01.md', note: 'Ajustar ritmo', createdAt: '2026-09-16' });
  });

  it('devuelve array vacio si el JSON es invalido', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce('invalid json');

    const result = await readBookmarks('/tmp/libro');

    expect(result).toEqual([]);
  });
});

describe('writeBookmarks', () => {
  it('crea el directorio .notes y escribe el JSON', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(undefined);

    const list = [{ id: 'bm1', title: 'Punto clave', chapterFilename: null, note: '', createdAt: '2026-09-16' }];
    await writeBookmarks('/tmp/libro', list);

    expect(mockInvoke).toHaveBeenCalledWith('ensure_dir', { path: '/tmp/libro/.notes' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/tmp/libro/.notes/bookmarks.json',
      contents: JSON.stringify(list, null, 2),
    });
  });
});

describe('createBookmarkId', () => {
  it('genera ids unicos', () => {
    expect(createBookmarkId()).not.toBe(createBookmarkId());
  });
});
