import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore, AUTOSAVE_DELAY_MS } from './settingsStore';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  useSettingsStore.setState({ autoCommit: true, autosaveIntervalMs: AUTOSAVE_DELAY_MS, themeMode: 'light', loaded: false });
  document.documentElement.removeAttribute('data-theme');
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

describe('settingsStore - load con autosaveIntervalMs', () => {
  it('popula autosaveIntervalMs desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, autosaveIntervalMs: 5000 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().autosaveIntervalMs).toBe(5000);
  });

  it('usa AUTOSAVE_DELAY_MS como default si autosaveIntervalMs es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().autosaveIntervalMs).toBe(AUTOSAVE_DELAY_MS);
  });
});

describe('settingsStore - setAutosaveIntervalMs', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1, autosaveIntervalMs: AUTOSAVE_DELAY_MS });

    const promise = useSettingsStore.getState().setAutosaveIntervalMs(15000);

    expect(useSettingsStore.getState().autosaveIntervalMs).toBe(15000);

    await promise;
  });

  it('persiste el valor al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, autosaveIntervalMs: AUTOSAVE_DELAY_MS };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setAutosaveIntervalMs(30000);

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, autosaveIntervalMs: 30000 },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setAutosaveIntervalMs(5000)).resolves.toBeUndefined();
  });
});

describe('settingsStore - load con themeMode', () => {
  it('popula themeMode dark desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, themeMode: 'dark' });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().themeMode).toBe('dark');
  });

  it('usa light como default si themeMode es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().themeMode).toBe('light');
  });

  it('aplica data-theme=dark al cargar modo oscuro', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, themeMode: 'dark' });

    await useSettingsStore.getState().load();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('aplica data-theme=light al cargar modo claro', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, themeMode: 'light' });

    await useSettingsStore.getState().load();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('settingsStore - setThemeMode', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1, themeMode: 'light' });

    const promise = useSettingsStore.getState().setThemeMode('dark');

    expect(useSettingsStore.getState().themeMode).toBe('dark');

    await promise;
  });

  it('aplica data-theme=dark al establecer modo oscuro', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setThemeMode('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('aplica data-theme=light al establecer modo claro', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setThemeMode('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persiste themeMode al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, themeMode: 'light' };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setThemeMode('dark');

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, themeMode: 'dark' },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setThemeMode('dark')).resolves.toBeUndefined();
  });
});
