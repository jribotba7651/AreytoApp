import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { readTimeline, writeTimeline, createTimelineEventId } from './timeline';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readTimeline', () => {
  it('devuelve array vacio si el archivo no existe', async () => {
    mockInvoke.mockResolvedValueOnce(false);

    const result = await readTimeline('/tmp/libro');

    expect(result).toEqual([]);
    expect(mockInvoke).toHaveBeenCalledWith('path_exists', { path: '/tmp/libro/.notes/timeline.json' });
  });

  it('devuelve los eventos parseados del archivo', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(
      JSON.stringify([
        { id: '1', title: 'Conoce a Ana', chapterFilename: 'cap-01.md', description: 'Primer encuentro' },
      ]),
    );

    const result = await readTimeline('/tmp/libro');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: '1', title: 'Conoce a Ana', chapterFilename: 'cap-01.md', description: 'Primer encuentro' });
  });

  it('devuelve array vacio si el JSON es invalido', async () => {
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce('no es json');

    const result = await readTimeline('/tmp/libro');

    expect(result).toEqual([]);
  });
});

describe('writeTimeline', () => {
  it('crea la carpeta .notes y escribe el JSON', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(undefined);

    await writeTimeline('/tmp/libro', [
      { id: '1', title: 'Climax', chapterFilename: null, description: '' },
    ]);

    expect(mockInvoke).toHaveBeenCalledWith('ensure_dir', { path: '/tmp/libro/.notes' });
    expect(mockInvoke).toHaveBeenCalledWith('write_text_file', {
      path: '/tmp/libro/.notes/timeline.json',
      contents: JSON.stringify(
        [{ id: '1', title: 'Climax', chapterFilename: null, description: '' }],
        null,
        2
      ),
    });
  });
});

describe('createTimelineEventId', () => {
  it('genera ids unicos', () => {
    expect(createTimelineEventId()).not.toBe(createTimelineEventId());
  });
});
