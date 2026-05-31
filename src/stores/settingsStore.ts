import { create } from 'zustand';
import { readGlobalSettings, writeGlobalSettings } from '@/lib/settings';

export const AUTOSAVE_DELAY_MS = 500;
export const THEME_STORAGE_KEY = 'areyto-theme-mode';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function applyTheme(mode: ThemeMode): void {
  const dark =
    mode === 'dark' ||
    (mode === 'auto' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (_) {}
}

interface SettingsState {
  autoCommit: boolean;
  autosaveIntervalMs: number;
  themeMode: ThemeMode;
  loaded: boolean;
  load: () => Promise<void>;
  setAutoCommit: (value: boolean) => Promise<void>;
  setAutosaveIntervalMs: (ms: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autoCommit: true,
  autosaveIntervalMs: AUTOSAVE_DELAY_MS,
  themeMode: 'light',
  loaded: false,

  load: async () => {
    try {
      const settings = await readGlobalSettings();
      const themeMode = (settings.themeMode ?? 'light') as ThemeMode;
      set({
        autoCommit: settings.autoCommit ?? true,
        autosaveIntervalMs: settings.autosaveIntervalMs ?? AUTOSAVE_DELAY_MS,
        themeMode,
        loaded: true,
      });
      applyTheme(themeMode);
    } catch {
      set({ loaded: true });
    }
  },

  setAutoCommit: async (value: boolean) => {
    set({ autoCommit: value });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, autoCommit: value });
    } catch (err) {
      console.warn('[areyto] Failed to persist autoCommit:', err);
    }
  },

  setAutosaveIntervalMs: async (ms: number) => {
    set({ autosaveIntervalMs: ms });
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, autosaveIntervalMs: ms });
    } catch (err) {
      console.warn('[areyto] Failed to persist autosaveIntervalMs:', err);
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    applyTheme(mode);
    try {
      const current = await readGlobalSettings();
      await writeGlobalSettings({ ...current, themeMode: mode });
    } catch (err) {
      console.warn('[areyto] Failed to persist themeMode:', err);
    }
  },
}));
