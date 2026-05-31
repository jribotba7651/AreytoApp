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
  useSettingsStore.setState({
    autoCommit: true,
    autosaveIntervalMs: AUTOSAVE_DELAY_MS,
    themeMode: 'light',
    editorFontFamily: 'serif',
    editorFontSize: 16,
    defaultProjectLanguage: 'en',
    bookFontFamily: 'serif',
    bookFontSize: 18,
    loaded: false,
  });
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('--font-editor');
  document.documentElement.style.removeProperty('--font-size-editor');
  document.documentElement.style.removeProperty('--font-book');
  document.documentElement.style.removeProperty('--font-size-book');
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

describe('settingsStore - load con editorFontFamily y editorFontSize', () => {
  it('popula editorFontFamily inter desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, editorFontFamily: 'inter' });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().editorFontFamily).toBe('inter');
  });

  it('usa serif como default si editorFontFamily es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().editorFontFamily).toBe('serif');
  });

  it('usa 16 como default si editorFontSize es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().editorFontSize).toBe(16);
  });

  it('aplica --font-size-editor al cargar tamaño 20', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, editorFontSize: 20 });

    await useSettingsStore.getState().load();

    expect(document.documentElement.style.getPropertyValue('--font-size-editor')).toBe('20px');
  });
});

describe('settingsStore - setEditorFontFamily', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    const promise = useSettingsStore.getState().setEditorFontFamily('mono');

    expect(useSettingsStore.getState().editorFontFamily).toBe('mono');

    await promise;
  });

  it('aplica --font-editor al establecer mono', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setEditorFontFamily('mono');

    expect(document.documentElement.style.getPropertyValue('--font-editor')).toContain('monospace');
  });

  it('aplica --font-editor al establecer inter', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setEditorFontFamily('inter');

    expect(document.documentElement.style.getPropertyValue('--font-editor')).toContain('Inter');
  });

  it('persiste editorFontFamily al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, editorFontFamily: 'serif' };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setEditorFontFamily('sans');

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, editorFontFamily: 'sans' },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setEditorFontFamily('inter')).resolves.toBeUndefined();
  });
});

describe('settingsStore - setEditorFontSize', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    const promise = useSettingsStore.getState().setEditorFontSize(20);

    expect(useSettingsStore.getState().editorFontSize).toBe(20);

    await promise;
  });

  it('aplica --font-size-editor al establecer 18', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setEditorFontSize(18);

    expect(document.documentElement.style.getPropertyValue('--font-size-editor')).toBe('18px');
  });

  it('persiste editorFontSize al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, editorFontSize: 16 };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setEditorFontSize(20);

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, editorFontSize: 20 },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setEditorFontSize(14)).resolves.toBeUndefined();
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

describe('settingsStore - load con defaultProjectLanguage', () => {
  it('popula defaultProjectLanguage desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, defaultProjectLanguage: 'es' });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().defaultProjectLanguage).toBe('es');
  });

  it('usa "en" como default si defaultProjectLanguage es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().defaultProjectLanguage).toBe('en');
  });
});

describe('settingsStore - setDefaultProjectLanguage', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    const promise = useSettingsStore.getState().setDefaultProjectLanguage('es');

    expect(useSettingsStore.getState().defaultProjectLanguage).toBe('es');

    await promise;
  });

  it('persiste el valor al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, defaultProjectLanguage: 'en' };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setDefaultProjectLanguage('fr');

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, defaultProjectLanguage: 'fr' },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setDefaultProjectLanguage('es')).resolves.toBeUndefined();
  });
});

describe('settingsStore - load con bookFontFamily y bookFontSize', () => {
  it('popula bookFontFamily inter desde los settings del disco', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, bookFontFamily: 'inter' });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().bookFontFamily).toBe('inter');
  });

  it('usa serif como default si bookFontFamily es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().bookFontFamily).toBe('serif');
  });

  it('usa 18 como default si bookFontSize es undefined en el archivo', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1 });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().bookFontSize).toBe(18);
  });

  it('aplica --font-size-book al cargar tamaño 22', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, bookFontSize: 22 });

    await useSettingsStore.getState().load();

    expect(document.documentElement.style.getPropertyValue('--font-size-book')).toBe('22px');
  });

  it('aplica --font-book al cargar inter', async () => {
    mockInvoke.mockResolvedValueOnce({ panels: {}, version: 1, bookFontFamily: 'inter' });

    await useSettingsStore.getState().load();

    expect(document.documentElement.style.getPropertyValue('--font-book')).toContain('Inter');
  });
});

describe('settingsStore - setBookFontFamily', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    const promise = useSettingsStore.getState().setBookFontFamily('mono');

    expect(useSettingsStore.getState().bookFontFamily).toBe('mono');

    await promise;
  });

  it('aplica --font-book al establecer mono', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setBookFontFamily('mono');

    expect(document.documentElement.style.getPropertyValue('--font-book')).toContain('monospace');
  });

  it('persiste bookFontFamily al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, bookFontFamily: 'serif' };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setBookFontFamily('sans');

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, bookFontFamily: 'sans' },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setBookFontFamily('inter')).resolves.toBeUndefined();
  });
});

describe('settingsStore - setBookFontSize', () => {
  it('actualiza el store de forma optimista antes de escribir al disco', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    const promise = useSettingsStore.getState().setBookFontSize(20);

    expect(useSettingsStore.getState().bookFontSize).toBe(20);

    await promise;
  });

  it('aplica --font-size-book al establecer 22', async () => {
    mockInvoke.mockResolvedValue({ panels: {}, version: 1 });

    await useSettingsStore.getState().setBookFontSize(22);

    expect(document.documentElement.style.getPropertyValue('--font-size-book')).toBe('22px');
  });

  it('persiste bookFontSize al disco con merge del estado actual', async () => {
    const currentOnDisk = { panels: {}, version: 1, bookFontSize: 18 };
    mockInvoke
      .mockResolvedValueOnce(currentOnDisk)
      .mockResolvedValueOnce(undefined);

    await useSettingsStore.getState().setBookFontSize(20);

    expect(mockInvoke).toHaveBeenCalledWith('write_global_settings', {
      settings: { ...currentOnDisk, bookFontSize: 20 },
    });
  });

  it('no lanza si el invoke falla', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));

    await expect(useSettingsStore.getState().setBookFontSize(16)).resolves.toBeUndefined();
  });
});
