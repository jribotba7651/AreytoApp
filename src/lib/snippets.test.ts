import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { readSnippets, writeSnippets, createSnippetId } from './snippets';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readSnippets', () => {
  it('devuelve array vacio si el archivo no existe', async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const result = await readSnippets('/tmp/libro');

    expect(result).toEqual([]);
    expect(mockInvoke).toHaveBeenCalledWith('path_exists', { path: '/tmp/libro/.notes/snippets.json' });
  });

  it('devuelve los snippets parseados del archivo', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(
      JSON.stringify([{ id: '1', label: 'Intro', text: 'Un fragmento' }]),
    );

    const result = await readSnippets('/tmp/libro');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: '1', label: 'Intro', text: 'Un fragmento' });
  });

  it('devuelve array vacio si el JSON es invalido', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce('no es json');

    const result = await readSnippets('/tmp/libro');

    expect(result).toEqual([]);
  });
});

describe('writeSnippets', () => {
  it('crea la carpeta .notes y escribe el JSON', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(undefined);

    await writeSnippets('/tmp/libro', [{ id: '1', label: '', text: 'hola' }]);

    expect(mockInvoke).toHaveBeenCalledWith('ensure_dir', { path: '/tmp/libro/.notes' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/tmp/libro/.notes/snippets.json',
      contents: JSON.stringify([{ id: '1', label: '', text: 'hola' }], null, 2),
    });
  });
});

describe('createSnippetId', () => {
  it('genera ids unicos', () => {
    expect(createSnippetId()).not.toBe(createSnippetId());
  });
});
