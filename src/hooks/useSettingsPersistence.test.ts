import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/stores/projectStore', () => ({ useProjectStore: vi.fn() }));
vi.mock('@/stores/layoutStore', () => ({ useLayoutStore: vi.fn() }));
vi.mock('@/stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('@/lib/settings', () => ({
  writeGlobalSettings: vi.fn().mockResolvedValue(undefined),
  writeProjectState: vi.fn().mockResolvedValue(undefined),
}));

import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { writeGlobalSettings } from '@/lib/settings';
import { useSettingsPersistence } from './useSettingsPersistence';

const mockUseProjectStore = vi.mocked(useProjectStore);
const mockUseLayoutStore = vi.mocked(useLayoutStore);
const mockUseSettingsStore = vi.mocked(useSettingsStore);
const mockWriteGlobalSettings = vi.mocked(writeGlobalSettings);

function makeProjectState(overrides: Record<string, unknown> = {}) {
  return {
    currentProject: { rootPath: '/proyecto' },
    activeChapterPath: '/proyecto/capitulos/cap-01.md',
    ...overrides,
  };
}

function makeLayoutState(overrides: Record<string, unknown> = {}) {
  return {
    sizes: { sidebar: 15, editor: 65, terminal: 35, versions: 22 },
    editorViewMode: 'edit' as const,
    ...overrides,
  };
}

function makeSettingsState(overrides: Record<string, unknown> = {}) {
  return {
    autoCommit: true,
    autosaveIntervalMs: 2000,
    themeMode: 'light' as const,
    editorFontFamily: 'serif' as const,
    editorFontSize: 16,
    defaultProjectLanguage: 'en',
    bookFontFamily: 'serif' as const,
    bookFontSize: 18,
    exportFolder: '',
    uiLocale: 'en',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseProjectStore.mockImplementation((selector: any) => selector(makeProjectState()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseLayoutStore.mockImplementation((selector: any) => selector(makeLayoutState()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSettingsStore.mockImplementation((selector: any) => selector(makeSettingsState()));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSettingsPersistence - persistGlobal incluye todos los campos de GlobalSettings', () => {
  it('el objeto escrito incluye defaultProjectLanguage del store (no el hardcode "en")', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeSettingsState({ defaultProjectLanguage: 'es' }))
    );

    renderHook(() => useSettingsPersistence());
    await vi.advanceTimersByTimeAsync(400);

    expect(mockWriteGlobalSettings).toHaveBeenCalledOnce();
    expect(mockWriteGlobalSettings.mock.calls[0]![0]).toMatchObject({
      defaultProjectLanguage: 'es',
    });
  });

  it('el objeto escrito incluye themeMode del store', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeSettingsState({ themeMode: 'dark' }))
    );

    renderHook(() => useSettingsPersistence());
    await vi.advanceTimersByTimeAsync(400);

    expect(mockWriteGlobalSettings.mock.calls[0]![0]).toMatchObject({ themeMode: 'dark' });
  });

  it('el objeto escrito incluye editorFontFamily y editorFontSize del store', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeSettingsState({ editorFontFamily: 'mono', editorFontSize: 20 }))
    );

    renderHook(() => useSettingsPersistence());
    await vi.advanceTimersByTimeAsync(400);

    expect(mockWriteGlobalSettings.mock.calls[0]![0]).toMatchObject({
      editorFontFamily: 'mono',
      editorFontSize: 20,
    });
  });

  it('el objeto escrito incluye uiLocale del store', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeSettingsState({ uiLocale: 'es' }))
    );

    renderHook(() => useSettingsPersistence());
    await vi.advanceTimersByTimeAsync(400);

    expect(mockWriteGlobalSettings).toHaveBeenCalledOnce();
    expect(mockWriteGlobalSettings.mock.calls[0]![0]).toMatchObject({
      uiLocale: 'es',
    });
  });

  it('un cambio de lastProjectPath no borra defaultProjectLanguage ni themeMode del objeto escrito', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: any) =>
      selector(makeSettingsState({ defaultProjectLanguage: 'fr', themeMode: 'dark' }))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseProjectStore.mockImplementation((selector: any) =>
      selector(makeProjectState({ currentProject: { rootPath: '/nuevo-proyecto' } }))
    );

    renderHook(() => useSettingsPersistence());
    await vi.advanceTimersByTimeAsync(400);

    const written = mockWriteGlobalSettings.mock.calls[0]![0];
    expect(written.defaultProjectLanguage).toBe('fr');
    expect(written.themeMode).toBe('dark');
    expect(written.lastProjectPath).toBe('/nuevo-proyecto');
  });
});
