import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from './settingsStore';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  useSettingsStore.setState({ autoCommit: true, loaded: false });
});

describe('settingsStore - load', () => {
  it('popula autoCommit false desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ autoCommit: false, panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().autoCommit).toBe(false);
    expect(useSettingsStore.getState().loaded).toBe(true);
  });

  it('usa true como default si autoCommit es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().autoCommit).toBe(true);
    expect(useSettingsStore.getState().loaded).toBe(true);
  });

  it('deja loaded=true y mantiene defaults si el invoke falla', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('no access'));

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().loaded).toBe(true);
    expect(useSettingsStore.getState().autoCommit).toBe(true);
  });
});

describe('settingsStore - setAutoCommit', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1, autoCommit: true });

    const promise = useSettingsStore.getState().setAutoCommit(false);

    expect(useSettingsStore.getState().autoCommit).toBe(false);

    await promise;
  });

  it('persiste el valor al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: { sidebar: 15 }, version: 1, autoCommit: true };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setAutoCommit(false);

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, autoCommit: false },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setAutoCommit(false)).resolves.toBeUndefined();
  });
});
