import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosave } from './useAutosave';

vi.mock('@/lib/project-fs', () => ({
  writeChapter: vi.fn(),
}));

import { writeChapter } from '@/lib/project-fs';
const mockWriteChapter = vi.mocked(writeChapter);

const PATH = '/tmp/mi-libro/capitulos/cap-01.md';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutosave', () => {
  it('no guarda si chapterPath es null', async () => {
    const onStatusChange = vi.fn();
    renderHook(() =>
      useAutosave({ content: '# Hola', chapterPath: null, projectPath: null, onStatusChange, delay: 500 })
    );

    await vi.advanceTimersByTimeAsync(600);
    expect(mockWriteChapter).not.toHaveBeenCalled();
  });

  it('guarda después del debounce', async () => {
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: null, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockWriteChapter).toHaveBeenCalledWith(PATH, 'cambio');
    expect(onStatusChange).toHaveBeenCalledWith('saving');
    expect(onStatusChange).toHaveBeenCalledWith('saved');
  });

  it('no guarda si el contenido no cambió desde el último save', async () => {
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: null, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    // Primer cambio y save
    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    const firstCallCount = mockWriteChapter.mock.calls.length;

    // Mismo contenido: no debe disparar nuevo save
    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockWriteChapter.mock.calls.length).toBe(firstCallCount);
  });

  it('llama onStatusChange con error si writeChapter falla', async () => {
    mockWriteChapter.mockResolvedValue({ ok: false, error: { kind: 'WriteFailed', path: PATH, reason: 'disk full' } });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: null, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'falla' });
    await vi.advanceTimersByTimeAsync(600);

    expect(onStatusChange).toHaveBeenCalledWith('error');
  });
});
