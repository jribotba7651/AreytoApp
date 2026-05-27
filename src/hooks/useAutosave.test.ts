import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosave } from './useAutosave';

vi.mock('@/lib/project-fs', () => ({
  writeChapter: vi.fn(),
}));

vi.mock('@/lib/versioning', () => ({
  commitChanges: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(),
  },
}));

import { writeChapter } from '@/lib/project-fs';
import { commitChanges } from '@/lib/versioning';
import { useSettingsStore } from '@/stores/settingsStore';

const mockWriteChapter = vi.mocked(writeChapter);
const mockCommitChanges = vi.mocked(commitChanges);
const mockGetState = vi.mocked(useSettingsStore.getState);

const PATH = '/tmp/mi-libro/capitulos/cap-01.md';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockGetState.mockReturnValue({ autoCommit: true, loaded: true } as ReturnType<typeof useSettingsStore.getState>);
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

  it('flush ejecuta el save inmediatamente sin esperar debounce', async () => {
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    const onStatusChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: null, onStatusChange, delay: 2000 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio flush' });

    // Sin avanzar el timer, flush debe guardar inmediatamente
    await result.current.flush();

    expect(mockWriteChapter).toHaveBeenCalledWith(PATH, 'cambio flush');
    expect(onStatusChange).toHaveBeenCalledWith('saved');
  });

  it('flush cancela timer pendiente antes de guardar', async () => {
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    const onStatusChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: null, onStatusChange, delay: 2000 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio' });

    // flush cancela el timer y guarda
    await result.current.flush();

    // Avanzar el timer: no debe guardar de nuevo
    const prevCallCount = mockWriteChapter.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2500);

    expect(mockWriteChapter.mock.calls.length).toBe(prevCallCount);
  });
});

describe('useAutosave - integración con autoCommit', () => {
  const PROJECT = '/tmp/mi-libro';

  it('no invoca commitChanges si autoCommit es false', async () => {
    mockGetState.mockReturnValue({ autoCommit: false, loaded: true } as ReturnType<typeof useSettingsStore.getState>);
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: PROJECT, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockWriteChapter).toHaveBeenCalled();
    expect(mockCommitChanges).not.toHaveBeenCalled();
  });

  it('invoca commitChanges si autoCommit es true', async () => {
    mockGetState.mockReturnValue({ autoCommit: true, loaded: true } as ReturnType<typeof useSettingsStore.getState>);
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    mockCommitChanges.mockResolvedValue({ ok: true, value: 'abc1234' });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: PROJECT, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockWriteChapter).toHaveBeenCalled();
    expect(mockCommitChanges).toHaveBeenCalledWith(PROJECT, PATH);
  });

  it('invoca commitChanges si settings no está cargado (loaded=false)', async () => {
    mockGetState.mockReturnValue({ autoCommit: true, loaded: false } as ReturnType<typeof useSettingsStore.getState>);
    mockWriteChapter.mockResolvedValue({ ok: true, value: undefined });
    mockCommitChanges.mockResolvedValue({ ok: true, value: 'abc1234' });
    const onStatusChange = vi.fn();

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutosave({ content, chapterPath: PATH, projectPath: PROJECT, onStatusChange, delay: 500 }),
      { initialProps: { content: 'inicio' } }
    );

    rerender({ content: 'cambio' });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockCommitChanges).toHaveBeenCalled();
  });
});
