import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { readCharacters, writeCharacters, createCharacterId } from './characters';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readCharacters', () => {
  it('devuelve array vacio si el archivo no existe', async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const result = await readCharacters('/tmp/libro');

    expect(result).toEqual([]);
    expect(mockInvoke).toHaveBeenCalledWith('path_exists', { path: '/tmp/libro/.notes/characters.json' });
  });

  it('devuelve los personajes parseados del archivo', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(
      JSON.stringify([{ id: '1', name: 'Ana', description: 'La heroina', color: 'blue' }]),
    );

    const result = await readCharacters('/tmp/libro');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: '1', name: 'Ana', description: 'La heroina', color: 'blue' });
  });

  it('devuelve array vacio si el JSON es invalido', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce('no es json');

    const result = await readCharacters('/tmp/libro');

    expect(result).toEqual([]);
  });
});

describe('writeCharacters', () => {
  it('crea la carpeta .notes y escribe el JSON', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(undefined);

    await writeCharacters('/tmp/libro', [{ id: '1', name: 'Ana', description: '', color: 'red' }]);

    expect(mockInvoke).toHaveBeenCalledWith('ensure_dir', { path: '/tmp/libro/.notes' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/tmp/libro/.notes/characters.json',
      contents: JSON.stringify([{ id: '1', name: 'Ana', description: '', color: 'red' }], null, 2),
    });
  });
});

describe('createCharacterId', () => {
  it('genera ids unicos', () => {
    expect(createCharacterId()).not.toBe(createCharacterId());
  });
});
