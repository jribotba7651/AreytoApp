import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  readAgradecimientos,
  writeAgradecimientos,
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

describe('ensureBackmatterFiles', () => {
  it('crea el archivo si no existe', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(false)     // path_exists → no existe
      .mockResolvedValueOnce(undefined); // write_text_file

    await ensureBackmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(1);
    expect((writeCalls[0]![1] as { path: string }).path).toBe(
      '/proyecto/backmatter/agradecimientos.md'
    );
    expect((writeCalls[0]![1] as { contents: string }).contents).toBe('');
  });

  it('no sobreescribe si ya existe', async () => {
    mockInvoke
      .mockResolvedValueOnce(undefined) // ensure_dir
      .mockResolvedValueOnce(true);     // path_exists → existe

    await ensureBackmatterFiles('/proyecto');

    const writeCalls = mockInvoke.mock.calls.filter((c) => c[0] === 'write_text_file');
    expect(writeCalls).toHaveLength(0);
  });
});
